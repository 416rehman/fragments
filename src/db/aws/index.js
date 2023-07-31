const crypto = require("crypto");
const logger = require("../../logger");
const s3Client = require("./s3Client");
const {PutObjectCommand, GetObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
const ddbDocClient = require('./ddbDocClient');
const {PutCommand, GetCommand, QueryCommand, DeleteCommand} = require('@aws-sdk/lib-dynamodb');

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        // As the data streams in, we'll collect it into an array.
        const chunks = [];

        // Streams have events that we can listen for and run
        // code.  We need to know when new `data` is available,
        // if there's an `error`, and when we're at the `end`
        // of the stream.

        // When there's data, add the chunk to our chunks list
        stream.on('data', (chunk) => chunks.push(chunk));
        // When there's an error, reject the Promise
        stream.on('error', reject);
        // When the stream is done, resolve with a new Buffer of our chunks
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

/**
 * This is an in-memory database that will be used for assignment 1. I am not using a real database as the assignment does not mention it.
 * Returns: {
 *     id, ownerId, created, updated, type, size
 * }
 */
class FragmentsDatabase {
    // Writes a fragment to DynamoDB. Returns a Promise.
    static async writeFragment(fragment) {
        // Configure our PUT params, with the name of the table and item (attributes and keys)
        const params = {
            TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
            Item: fragment,
        };

        // Create a PUT command to send to DynamoDB
        const command = new PutCommand(params);

        try {
            return await ddbDocClient.send(command);
        } catch (err) {
            logger.warn({err, params, fragment}, 'error writing fragment to DynamoDB');
            throw err;
        }
    }

    // Reads a fragment from DynamoDB. Returns a Promise<fragment|undefined>
    static async readFragment(ownerId, id) {
        // Configure our GET params, with the name of the table and key (partition key + sort key)
        const params = {
            TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
            Key: {ownerId, id},
        };

        // Create a GET command to send to DynamoDB
        const command = new GetCommand(params);

        try {
            // Wait for the data to come back from AWS
            const data = await ddbDocClient.send(command);
            // We may or may not get back any data (e.g., no item found for the given key).
            // If we get back an item (fragment), we'll return it.  Otherwise we'll return `undefined`.
            return data?.Item;
        } catch (err) {
            logger.warn({err, params}, 'error reading fragment from DynamoDB');
            throw err;
        }
    }

    static async listFragments(ownerId, expand = false) {
        // Configure our QUERY params, with the name of the table and the query expression
        const params = {
            TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
            // Specify that we want to get all items where the ownerId is equal to the
            // `:ownerId` that we'll define below in the ExpressionAttributeValues.
            KeyConditionExpression: 'ownerId = :ownerId',
            // Use the `ownerId` value to do the query
            ExpressionAttributeValues: {
                ':ownerId': ownerId,
            },
        };

        // Limit to only `id` if we aren't supposed to expand. Without doing this
        // we'll get back every attribute.  The projection expression defines a list
        // of attributes to return, see:
        // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ProjectionExpressions.html
        if (!expand) {
            params.ProjectionExpression = 'id';
        }

        // Create a QUERY command to send to DynamoDB
        const command = new QueryCommand(params);

        try {
            // Wait for the data to come back from AWS
            const data = await ddbDocClient.send(command);

            // If we haven't expanded to include all attributes, remap this array from
            // [ {"id":"b9e7a264-630f-436d-a785-27f30233faea"}, {"id":"dad25b07-8cd6-498b-9aaf-46d358ea97fe"} ,... ] to
            // [ "b9e7a264-630f-436d-a785-27f30233faea", "dad25b07-8cd6-498b-9aaf-46d358ea97fe", ... ]
            return !expand ? data?.Items.map((item) => item.id) : data?.Items
        } catch (err) {
            logger.error({err, params}, 'error getting all fragments for user from DynamoDB');
            throw err;
        }
    }

    // Deletes a fragment from DynamoDB. Returns a Promise.
    static async deleteFragment(ownerId, id) {
        // Configure our DELETE params, with the name of the table and key (partition key + sort key)
        const params = {
            TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
            Key: {ownerId, id},
            ReturnValues: 'ALL_OLD',
        };

        // Create a DELETE command to send to DynamoDB
        const command = new DeleteCommand(params);

        try {
            const result = await ddbDocClient.send(command);
            // Return the deleted item
            return result?.Attributes;
        } catch (err) {
            logger.warn({err, params}, 'error deleting fragment from DynamoDB');
            throw err;
        }
    }

    // Create a new fragment object and store it in the database's metadata and data arrays.
    static async create(blob, type, ownerId, id = null) {
        if (!blob || !type || !ownerId) {
            return null;
        }

        const metadata = {
            id: id || crypto.randomUUID(),
            ownerId: ownerId,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            type: type,
            size: blob.length || 0,
        };

        // Create the PUT API params from our details
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            // Our key will be a mix of the ownerID and fragment id, written as a path
            Key: `${ownerId}/${metadata.id}`,
            Body: blob,
        };

        // Create a PUT Object command to send to S3
        const command = new PutObjectCommand(params);

        try {
            // Use our client to send the command
            await s3Client.send(command);
            // If successful, add the metadata to our list
            await FragmentsDatabase.writeFragment(metadata);
        } catch (err) {
            // If anything goes wrong, log enough info that we can debug
            const {Bucket, Key} = params;
            logger.error({err, Bucket, Key}, 'Error uploading fragment data to S3');
            throw new Error('Unable to upload fragment data');
        }



        return metadata;
    }

    /**
     * Get a single object by its ID. If metadataOnly is true, the data property will be omitted from the returned object.
     * Returns: {
     *     metadata: { ... },
     *     data: <Buffer>
     * }
     */
    static async get(id, ownerId, metadataOnly = true) {
        const metadata = await FragmentsDatabase.readFragment(ownerId, id);
        if (!metadata) {
            return null;
        }

        if (metadata.ownerId !== ownerId) {
            return null;
        }

        if (metadataOnly) {
            return {metadata};
        }
        // Create the PUT API params from our details
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `${ownerId}/${metadata.id}`,
        };

        // Create a GET Object command to send to S3
        const command = new GetObjectCommand(params);

        try {
            // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
            const data = await s3Client.send(command);
            // Convert the ReadableStream to a Buffer
            return {metadata, data: await streamToBuffer(data.Body)};
        } catch (err) {
            const {Bucket, Key} = params;
            logger.error({err, Bucket, Key}, 'Error streaming fragment data from S3');
            throw new Error('unable to read fragment data');
        }
    }

    /**
     * Get all objects for an owner. If metadataOnly is true, the data property will be omitted from the returned objects.
     * if metadataOnly is true, returns: [{id, ownerId, created, updated, type, size}, {...}]
     * if metadataOnly is false, returns: [{metadata: {id, ownerId, created, updated, type, size}, data: <Buffer>}, {...}]
     */
    static async getAllForOwner(ownerId, expand = false) {

        const metadataList = await FragmentsDatabase.listFragments(ownerId, expand);
        if (!expand) {
            return metadataList;
        }

        // For each object, create a GET Object command to send to S3
        try {
            const dataPromises = metadataList.map((metadata) => {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    // Our key will be a mix of the ownerID and fragment id, written as a path
                    Key: `${metadata.ownerId}/${metadata.id}`,
                };
                const command = new GetObjectCommand(params);
                return s3Client.send(command);
            });

            // Get all the objects from the Amazon S3 bucket. They are returned as ReadableStreams.
            const data = await Promise.all(dataPromises);
            // Convert the ReadableStreams to Buffers
            const buffers = await Promise.all(data.map((stream) => streamToBuffer(stream.Body)));
            // Combine the metadata and data into a single object
            return metadataList.map((metadata, index) => ({metadata, data: buffers[index]}));
        } catch (err) {
            logger.error({err}, 'Error streaming fragment data from S3');
            throw new Error('unable to read fragment data');
        }
    }

    /**
     * Update the metadata and/or data of an object.
     * @param id The ID of the object to update
     * @param ownerId The ID of the owner of the object. Must be specified, otherwise the object will not be updated.
     * @param newBlob The updated data. If null, the data will not be updated.
     * Returns updated metadata object if successful, null otherwise.
     *
     */
    static async update(id, ownerId, newBlob) {
        if (!id || !ownerId || !newBlob) {
            return null;
        }

        try {
            // first delete the old object
            const deletedMetadata = await FragmentsDatabase.delete(id, ownerId);
            if (!deletedMetadata) {
                return null;
            }

            // then create a new one
            return await FragmentsDatabase.create(newBlob, deletedMetadata.type, ownerId);
        } catch (err) {
            logger.error({err}, 'Error updating fragment data');
            return null;
        }
    }

    /**
     * Delete one or more objects by ID.
     * @param id An ID of object to delete
     * @param ownerId The ID of the owner of the objects. If specified, only objects with this owner ID will be deleted.
     * Returns metadata object of deleted object if successful, null otherwise.
     */
    static async delete(id, ownerId) {
        if (!id || !ownerId) {
            return null;
        }

        // Delete all objects with matching ID and owner ID
        const deletedMetadata = await FragmentsDatabase.deleteFragment(ownerId, id);
        if (!deletedMetadata) {
            return null;
        }

        // Create a DELETE Object command to send to S3
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            // Our key will be a mix of the ownerID and fragment id, written as a path
            Key: `${ownerId}/${id}`,
        });

        try {
            // Delete the object from the Amazon S3 bucket.
            await s3Client.send(command);
        } catch (err) {
            const {Bucket, Key} = command;
            logger.error({err, Bucket, Key}, 'Error deleting fragment data from S3');
            throw new Error('unable to delete fragment data');
        }

        return deletedMetadata;
    }
}

module.exports = FragmentsDatabase;