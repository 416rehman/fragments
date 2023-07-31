const crypto = require("crypto");
const logger = require("../../logger");
const s3Client = require("./s3Client");
const {PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsCommand} = require("@aws-sdk/client-s3");

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
    static metadataList = [];

    // Create a new fragment object and store it in the database's metadata and data arrays.
    static async create(blob, type, ownerId, id = null) {
        if (!blob || !type || !ownerId) {
            return null;
        }

        const metadata = {
            id: id || crypto.randomUUID(),
            ownerId: crypto.createHash("sha256").update(ownerId).digest("hex"),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            type: type,
            size: blob.length || 0,
        };

        // Create the PUT API params from our details
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            // Our key will be a mix of the ownerID and fragment id, written as a path
            Key: `${metadata.ownerId}/${metadata.id}`,
            Body: blob,
        };

        console.log(params);

        // Create a PUT Object command to send to S3
        const command = new PutObjectCommand(params);

        try {
            // Use our client to send the command
            await s3Client.send(command);
            FragmentsDatabase.metadataList.push(metadata);
        } catch (err) {
            // If anything goes wrong, log enough info that we can debug
            const {Bucket, Key} = params;
            logger.error({err, Bucket, Key}, 'Error uploading fragment data to S3');
            throw new Error('unable to upload fragment data');
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
        const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");
        const metadata = FragmentsDatabase.metadataList.find(
            (object) => object.id === id
        );
        if (!metadata) {
            return null;
        }

        if (metadata.ownerId !== ownerHash) {
            return null;
        }

        if (metadataOnly) {
            return {metadata};
        }
        // Create the PUT API params from our details
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            // Our key will be a mix of the ownerID and fragment id, written as a path
            Key: `${crypto.createHash("sha256").update(ownerId).digest("hex")}/${id}`,
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
    static async getAllForOwner(ownerId, metadataOnly = true) {
        const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");

        const metadataList = FragmentsDatabase.metadataList.filter(
            (object) => object.ownerId === ownerHash
        );
        if (metadataOnly) {
            return metadataList;
        }

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            // The key should start with the owner ID, so we can use that to filter
            Prefix: `${ownerId}/`,
        };

        // Create a list command to send to S3
        const command = new ListObjectsCommand(params);

        try {
            const data = await s3Client.send(command);
            const promises = [];
            for (const object of data.Contents) {
                const params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    // Our key will be a mix of the ownerID and fragment id, written as a path
                    Key: object.Key,
                };

                // Create a GET Object command to send to S3
                const command = new GetObjectCommand(params);
                promises.push(s3Client.send(command));
            }
            const results = await Promise.all(promises);
            const buffers = await Promise.all(results.map((result) => streamToBuffer(result.Body)));
            return metadataList.map((metadata, index) => {
                return {metadata, data: buffers[index]};
            });
        } catch (err) {
            const {Bucket, Prefix} = params;
            logger.error({err, Bucket, Prefix}, 'Error listing fragment data from S3');
            throw new Error('unable to list fragment data');
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
            console.log("No id, ownerId, or newBlob provided");
            return null;
        }

        // Check that the object exists
        const object = FragmentsDatabase.metadataList.find((object) => object.id === id);
        if (!object) {
            console.log("Object does not exist");
            return null;
        }

        // Check that the owner ID matches
        const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");

        if (object.ownerId !== ownerHash) {
            console.log("Owner ID does not match");
            return null;
        }

        try {
            // first delete the old object
            await FragmentsDatabase.delete(id, ownerId);

            // then create a new one
            return await FragmentsDatabase.create(newBlob, object.type, ownerId);
        } catch (err) {
            logger.error({err}, 'Error updating fragment data');
            return null;
        }
    }

    /**
     * Delete one or more objects by ID.
     * @param id An ID of object to delete
     * @param ownerId The ID of the owner of the objects. If specified, only objects with this owner ID will be deleted.
     * Returns true if successful, false otherwise.
     */
    static async delete(id, ownerId) {
        if (!id || !ownerId) {
            return false;
        }

        const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");

        // Get index of metadata
        const indexOfMetadata = FragmentsDatabase.metadataList.findIndex(
            (object) => {
                return object.id === id && object.ownerId === ownerHash;
            }
        );
        if (indexOfMetadata < 0) {
            logger.error("Metadata not found");
            return false;
        }

        // Get index of blob
        // Create the DELETE API params from our details
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            // Our key will be a mix of the ownerID and fragment id, written as a path
            Key: `${ownerId}/${id}`,
        };

        // Create a DELETE Object command to send to S3
        const command = new DeleteObjectCommand(params);

        try {
            // Delete the object from the Amazon S3 bucket.
            await s3Client.send(command);
        } catch (err) {
            const {Bucket, Key} = params;
            logger.error({err, Bucket, Key}, 'Error streaming fragment data from S3');
            throw new Error('unable to read fragment data');
        }

        // Delete
        FragmentsDatabase.metadataList.splice(indexOfMetadata, 1);

        return true;
    }
}

module.exports = FragmentsDatabase;