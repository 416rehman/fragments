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

module.exports.getFragments = async (req, res) => {
    const bExpand = !!req.query.expand;
    let fragments = await db.getAllForOwner(req.user);

    // IDs only if no expand key
    if (!bExpand && fragments.length > 0) {
        fragments = fragments.map((fragment) => {
            return fragment.id;
        });
    }

    res.send(createSuccessResponse({fragments}));
};

module.exports.getFragment = async (req, res) => {
    const parts = req.params.id.split(".");
    const id = parts[0];
    const as = parts.length > 1 ? parts[1] : null;

    const fragment = await db.get(id, req.user, false);
    if (!fragment) {
        return res.status(404).send(createErrorResponse(404, "Fragment not found"));
    }

    if (as) {
        console.log("---------CONVERTING to " + as + "---------")
        const converted = await convert(fragment.data, fragment.metadata.type, as);
        console.log("---------CONVERTED---------")
        console.log(converted)
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
        const newType = getContentTypeForExtension(as);
        console.log("---------NEW TYPE---------")
        console.log(newType)

        res.writeHead(200, {
            "Content-Type": newType || fragment.metadata.type,
            "Content-Length": fragment.data.length,
        });
    } else {
        console.log("---------NOT CONVERTING---------")
        res.writeHead(200, {"Content-Type": fragment.metadata.type, "Content-Length": fragment.metadata.size});
    }

    console.log("FRAGMENT DATA")
    console.log(fragment.data)
    res.write(fragment.data);
    res.end();
};

module.exports.getFragmentInfo = async (req, res) => {
    const id = req.params.id;
    const fragment = await db.get(id, req.user, true);
    if (!fragment) {
        return res.status(404).send(createErrorResponse(404, "Fragment not found"));
    }

    return res.send(createSuccessResponse({fragment}));
};