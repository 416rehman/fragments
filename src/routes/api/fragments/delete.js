const db = require("../../../db");

/**
 * Get a list of fragments for the current user
 */
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../response");
const crypto = require("crypto");

module.exports = async (req, res) => {
  const ownerId = crypto.createHash("sha256").update(req.user).digest("hex")
  if (await db.delete(req.params.id, ownerId)) {
    return res.status(200).send(createSuccessResponse());
  }

  return res.status(404).send(createErrorResponse(404, "Fragment not found"));
};