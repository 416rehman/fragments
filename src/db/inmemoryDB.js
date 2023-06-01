const crypto = require("crypto");
const logger = require("../logger");

/**
 * This is an in-memory database that will be used for assignment 1. I am not using a real database as the assignment does not mention it.
 * Returns: {
 *     id, ownerId, created, updated, type, size
 * }
 */
class FragmentsDatabase {
  static metadataList = [];
  static bloblist = [];

  // Create a new fragment object and store it in the database's metadata and data arrays.
  static create(blob, type, ownerId) {
    if (!blob || !type || !ownerId) {
      return null;
    }

    const metadata = {
      id: crypto.randomUUID(),
      ownerId: crypto.createHash("sha256").update(ownerId).digest("hex"),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      type: type,
      size: blob.length,
    };

    FragmentsDatabase.metadataList.push(metadata);
    FragmentsDatabase.bloblist.push({ id: metadata.id, data: blob });

    return metadata;
  }

  /**
   * Get a single object by its ID. If metadataOnly is true, the data property will be omitted from the returned object.
   * Returns: {
   *     metadata: { ... },
   *     data: <Buffer>
   * }
   */
  static get(id, ownerId, metadataOnly = true) {
    const metadata = FragmentsDatabase.metadataList.find(
      (object) => object.id === id
    );
    if (!metadata) {
      return null;
    }

    const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");
    if (metadata.ownerId !== ownerHash) {
      return null;
    }
    if (metadataOnly) {
      return { metadata };
    }
    const blob = FragmentsDatabase.bloblist.find((object) => object.id === id);
    return { metadata, data: blob.data };
  }

  /**
   * Get all objects in the database. If metadataOnly is true, the data property will be omitted from the returned objects.
   * Returns: [
   * {metadata: { ... }, data: <Buffer>},
   * ...
   * ]
   */
  static getAll(metadataOnly = true) {
    if (metadataOnly) {
      return FragmentsDatabase.metadataList;
    }
    return FragmentsDatabase.metadataList.map((metadata) => {
      const blob = FragmentsDatabase.bloblist.find(
        (object) => object.id === metadata.id
      );
      return { metadata, data: blob.data };
    });
  }

  /**
   * Get all objects for an owner. If metadataOnly is true, the data property will be omitted from the returned objects.
   * if metadataOnly is true, returns: [{id, ownerId, created, updated, type, size}, {...}]
   * if metadataOnly is false, returns: [{metadata: {id, ownerId, created, updated, type, size}, data: <Buffer>}, {...}]
   */
  static getAllForOwner(ownerId, metadataOnly = true) {
    const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");

    const metadataList = FragmentsDatabase.metadataList.filter(
      (object) => object.ownerId === ownerHash
    );
    if (metadataOnly) {
      return metadataList;
    }
    return metadataList.map((metadata) => {
      const blob = FragmentsDatabase.bloblist.find(
        (object) => object.id === metadata.id
      );
      return { metadata, data: blob.data };
    });
  }

  /**
   * Update the metadata and/or data of an object.
   * @param id The ID of the object to update
   * @param ownerId The ID of the owner of the object. Must be specified, otherwise the object will not be updated.
   * @param newBlob The updated data. If null, the data will not be updated.
   * Returns updated metadata object if successful, null otherwise.
   *
   */
  static update(id, ownerId, newBlob) {
    if (!id || !ownerId || !newBlob) {
      return null;
    }

    // Check that the object exists
    const metadataIndex = FragmentsDatabase.metadataList.findIndex((object) => {
      return object.id === id;
    });
    if (metadataIndex === -1) {
      return null;
    }

    // Check that the owner ID matches
    const ownerHash = crypto.createHash("sha256").update(ownerId).digest("hex");

    if (FragmentsDatabase.metadataList[metadataIndex].ownerId !== ownerHash) {
      return null;
    }

    if (newBlob && newBlob.length > 0) {
      const blobIndex = FragmentsDatabase.bloblist.findIndex((object) => {
        return object.id === id;
      });
      if (blobIndex === -1) {
        return null;
      }
      FragmentsDatabase.bloblist[blobIndex].data = newBlob;
      // Update the metadata
      FragmentsDatabase.metadataList[metadataIndex].updated =
        new Date().toISOString();
      FragmentsDatabase.metadataList[metadataIndex].size = newBlob.length;

      return FragmentsDatabase.metadataList[metadataIndex];
    }

    return null;
  }

  /**
   * Delete one or more objects by ID.
   * @param id An ID of object to delete
   * @param ownerId The ID of the owner of the objects. If specified, only objects with this owner ID will be deleted.
   * Returns true if successful, false otherwise.
   */
  static delete(id, ownerId) {
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
    const indexOfBlob = FragmentsDatabase.bloblist.findIndex((object) => {
      return object.id === id;
    });
    if (indexOfBlob < 0) {
      logger.error("Blob not found");
      return false;
    }

    // Delete
    FragmentsDatabase.metadataList.splice(indexOfMetadata, 1);
    FragmentsDatabase.bloblist.splice(indexOfBlob, 1);

    return true;
  }
}

module.exports = FragmentsDatabase;
