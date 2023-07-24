const db = require("../../../db");

/**
 * Get a list of fragments for the current user
 */
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../response");

module.exports = async (req, res) => {
  if (await db.delete(req.params.id, req.user)) {
    res.status(200).send(createSuccessResponse());
    return;
  }

  res.status(404).send(createErrorResponse(404, "Fragment not found"));
};