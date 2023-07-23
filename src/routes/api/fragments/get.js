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
  const as = parts.length > 1 ? parts[1] : null;

  const fragment = db.get(id, req.user, false);
  if (!fragment) {
    res.status(404).send(createErrorResponse(404, "Fragment not found"));
    return;
  }

  if (as) {
    const converted = convert(fragment.data, fragment.metadata.type, as);
    if (!converted.success) {
      const validConversions = getValidConversionsForContentType(
        fragment.metadata.type
      );
      res
        .status(415)
        .send(
          createErrorResponse(
            415,
            "Unsupported conversion." +
              (validConversions
                ? " Valid conversions are: " + validConversions.join(", ")
                : "")
          )
        );
      return;
    }
    fragment.data = converted.data;

    res.writeHead(200, {"Content-Type": getContentTypeForExtension(as) || fragment.metadata.type});
  } else {
    res.writeHead(200, {"Content-Type": fragment.metadata.type});
  }

  res.write(fragment.data);
};

module.exports.getFragmentInfo = (req, res) => {
  const id = req.params.id;
  const fragment = db.get(id, req.user, true);
  if (!fragment) {
    res.status(404).send(createErrorResponse(404, "Fragment not found"));
    return;
  }

  res.send(createSuccessResponse({ fragment }));
};