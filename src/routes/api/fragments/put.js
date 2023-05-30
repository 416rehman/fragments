const db = require("../../../db/inmemoryDB.js");

/**
 * Get a list of fragments for the current user
 */
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../response");

module.exports = (req, res) => {
  const id = req.params.id;
  const fragment = db.get(id, req.user, true);
  if (!fragment) {
    res.status(404).send(createErrorResponse(404, "Fragment not found"));
    return;
  }

  //content type must match
  if (req.headers["content-type"] !== fragment.metadata.type) {
    res
      .status(400)
      .send(
        createErrorResponse(
          400,
          "Content-Type cannot be changed after creation"
        )
      );
    return;
  }

  const blob = req.body;
  if (!blob) {
    res.status(400).send(createErrorResponse(400, "Missing body"));
  }
  if (blob.length < 1) {
    res.status(400).send(createErrorResponse(400, "Empty body"));
  }
  const updatedFragment = db.update(id, req.user, blob);
  if (!updatedFragment) {
    //Server error
    res.status(500).send(createErrorResponse(500, "Failed to update fragment"));
    return;
  }

  res.status(200).send(createSuccessResponse({ fragment: updatedFragment }));
};
