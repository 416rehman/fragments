const db = require("../../../db/inmemoryDB.js");
const {
  getContentTypeForExtension,
  convert,
  getValidConversionsForContentType,
} = require("../../../utils/helpers");

/**
 * Get a list of fragments for the current user
 */
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../../response");

module.exports.getFragments = (req, res) => {
  const bExpand = !!req.query.expand;
  let fragments = db.getAllForOwner(req.user);

  // IDs only if no expand key
  if (!bExpand && fragments.length > 0) {
    fragments = fragments.map((fragment) => {
      return fragment.id;
    });
  }

  res.send(createSuccessResponse({ fragments }));
};

module.exports.getFragment = (req, res) => {
  const parts = req.params.id.split(".");
  const id = parts[0];
  const extension = parts.length > 1 ? parts[1] : null;

  const fragment = db.get(id, req.user, false);
  if (!fragment) {
    res.status(404).send({ error: "Fragment not found" });
    return;
  }

  res.set("Content-Type", fragment.metadata.type);

  if (extension) {
    const converted = convert(fragment.data, fragment.metadata.type, extension);
    if (!converted.success) {
      const validConversions = getValidConversionsForContentType(
        fragment.metadata.type
      );
      res
        .status(415)
        .send(
          createErrorResponse(
            415,
            "Unsupported conversion." + validConversions
              ? " Valid conversions are: " + validConversions.join(", ")
              : ""
          )
        );
      return;
    }
    fragment.data = converted.data;

    res.set(
      "Content-Type",
      getContentTypeForExtension(extension) || fragment.metadata.type
    );
  }

  res.send(fragment.data);
};

module.exports.getFragmentInfo = (req, res) => {
  const id = req.params.id;
  const fragment = db.get(id, req.user, true);
  if (!fragment) {
    res.status(404).send({ error: "Fragment not found" });
    return;
  }

  res.send(createSuccessResponse({ fragment }));
};
