/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require("express");

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.use("/fragments", require("./fragments"));

// Other routes will go here later on...

module.exports = router;
