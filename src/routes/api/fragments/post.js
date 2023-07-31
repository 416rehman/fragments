const db = require("../../../db");
const {
    isContentTypeSupported,
    conversionTable,
} = require("../../../utils/helpers");
/**
 * Get a list of fragments for the current user
 */
const {
    createSuccessResponse,
    createErrorResponse,
} = require("../../../response");
const crypto = require("crypto");

module.exports = async (req, res) => {
    const type = req.headers["content-type"];
    const binaryData = req.body;

    if (!binaryData || binaryData.length === 0) {
        return res.status(400).send(createErrorResponse(400, "Missing body"));
    }

    if (!isContentTypeSupported(type)) {
        const validTypes = Object.keys(conversionTable).join(", ");
        return res
            .status(415)
            .send(
                createErrorResponse(
                    415,
                    "Unsupported Media Type. Valid types are: " + validTypes
                )
            );
    }

    try {
        const ownerId = crypto.createHash("sha256").update(req.user).digest("hex")
        const fragment = await db.create(binaryData, type, ownerId);
        if (!fragment) {
            //Server error
            return res.status(500).send(createErrorResponse(500, "Failed to create fragment"));
        }

        return res.set("Location", `${req.protocol}://${req.get("host")}/v1/fragments/${fragment.id}`).status(201).send(createSuccessResponse({fragment}));
    } catch (err) {
        return res.status(500).send(createErrorResponse(500, err.message));
    }
};