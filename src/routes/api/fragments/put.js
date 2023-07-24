const db = require("../../../db");

/**
 * Get a list of fragments for the current user
 */
const {
    createSuccessResponse,
    createErrorResponse,
} = require("../../../response");

module.exports = async (req, res) => {
    const id = req.params.id;
    let fragment
    try {
        fragment = await db.get(id, req.user, true);
    } catch (err) {
        return res.status(404).send(createErrorResponse(404, "Fragment not found"));
    }

    if (!fragment) {
        return res.status(404).send(createErrorResponse(404, "Fragment not found"));
    }

    //content type must match
    if (req.headers["content-type"] !== fragment.metadata.type) {
        return res
            .status(400)
            .send(
                createErrorResponse(
                    400,
                    "Content-Type cannot be changed after creation"
                )
            );
    }

    const binaryData = req.body;
    if (!binaryData || binaryData.length === 0) {
        return res.status(400).send(createErrorResponse(400, "Missing body"));
    }

    try {
        const updatedFragment = await db.update(id, req.user, binaryData);
        if (!updatedFragment) {
            //Server error
            return res.status(500).send(createErrorResponse(500, "Failed to update fragment"));
        }

        return res.status(200).send(createSuccessResponse({fragment: updatedFragment}));
    } catch (err) {
        return res.status(500).send(createErrorResponse(500, err.message));
    }

};