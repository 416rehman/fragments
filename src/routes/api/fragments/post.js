const db = require("../../../db/inmemoryDB.js");
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

module.exports = (req, res) => {
    const type = req.headers["content-type"];
    const binaryData = req.body;

    console.log('POST /v1/fragments', {type, binaryData});

    if (!binaryData || binaryData.length === 0) {
        res.status(400).send(createErrorResponse(400, "Missing body"));
    }

    if (!isContentTypeSupported(type)) {
        const validTypes = Object.keys(conversionTable).join(", ");
        res
            .status(415)
            .send(
                createErrorResponse(
                    415,
                    "Unsupported Media Type. Valid types are: " + validTypes
                )
            );
    }

    const fragment = db.create(binaryData, type, req.user);
    if (!fragment) {
        //Server error
        res.status(500).send(createErrorResponse(500, "Failed to create fragment"));
    }

    res.set("Location", `${req.protocol}://${req.get("host")}/v1/fragments/${fragment.id}`);

    res.status(201).send(createSuccessResponse({fragment}));
};