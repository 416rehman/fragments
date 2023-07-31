/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require("express");
const { getFragment, getFragments, getFragmentInfo } = require("./get");
const postFragment = require("./post");
const putFragment = require("./put");
const deleteFragment = require("./delete");

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.get("/", getFragments);
router.get("/:id", getFragment);
router.get("/:id/info", getFragmentInfo);
router.post("/", postFragment);
router.put("/:id", putFragment);
router.delete("/:id", deleteFragment);

// Other routes will go here later on...

module.exports = router;