const db = require("../../../db");
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
const crypto = require("crypto");

module.exports.getFragments = async (req, res) => {
    const bExpand = !!req.query.expand;
    const ownerId = crypto.createHash("sha256").update(req.user).digest("hex")
    let fragments = await db.getAllForOwner(ownerId, bExpand);

    res.send(createSuccessResponse({fragments}));
};

module.exports.getFragment = async (req, res) => {
    const parts = req.params.id.split(".");
    const id = parts[0];
    const as = parts.length > 1 ? parts[1] : null;

    const ownerId = crypto.createHash("sha256").update(req.user).digest("hex")

    const fragment = await db.get(id, ownerId, false, false);

    if (!fragment) {
        return res.status(404).send(createErrorResponse(404, "Fragment not found"));
    }

    if (as) {
        const converted = await convert(fragment.data, fragment.metadata.type, as);
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
        fragment.data = await converted.data;
        const newType = getContentTypeForExtension(as);

        res.writeHead(200, {
            "Content-Type": newType || fragment.metadata.type,
            "Content-Length": fragment.data.length,
        });
    } else {
        res.writeHead(200, {"Content-Type": fragment.metadata.type, "Content-Length": fragment.metadata.size});
    }

    res.write(fragment.data);
    res.end();
};

module.exports.getFragmentInfo = async (req, res) => {
    const id = req.params.id;
    const ownerId = crypto.createHash("sha256").update(req.user).digest("hex")
    const fragment = await db.get(id, ownerId, true);
    if (!fragment) {
        return res.status(404).send(createErrorResponse(404, "Fragment not found"));
    }

    return res.send(createSuccessResponse({fragment}));
};