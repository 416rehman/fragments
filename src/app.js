// src/app.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const passport = require("passport");
const authenticate = require("./authorization");

const logger = require("./logger");
const { createErrorResponse } = require("./response");
const pino = require("pino-http")({
  // Use our default logger instance, which is already configured
  logger,
});

// Create an express app instance we can use to attach middleware and HTTP routes
const app = express();

// Use logging middleware
app.use(pino);

// Use security middleware
app.use(helmet());

// Use CORS middleware so we can make requests across origins
app.use(cors());

// Use gzip/deflate compression middleware
app.use(compression());

// Middleware to handle raw text
app.use(express.text({ type: "*/*" }));

// Middleware to handle raw images
app.use((req, res, next) => {
  if (req.is("image/*")) {
    const contentLength = parseInt(req.header("Content-Length"));
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB limit
      return res
        .status(413)
        .send(createErrorResponse(413, "Payload Too Large"));
    }
    req.setEncoding("binary");
    req.data = "";
    req.on("data", (chunk) => {
      req.data += chunk;
    });
    req.on("end", () => {
      req.body = Buffer.from(req.data, "binary");
      next();
    });
  } else {
    next();
  }
});

// Set up our passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

app.use("/", require("./routes"));

// Add 404 middleware to handle any requests for resources that can't be found
app.use((req, res) => {
  res.status(404).send(createErrorResponse(404, "Resource not found"));
});

// Add error-handling middleware to deal with anything else
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // We may already have an error response we can use, but if not, use a generic
  // 500 server error and message.
  const status = err.status || 500;
  const message = err.message || "unable to process request";

  // If this is a server error, log something so we can see what's going on.
  if (status > 499) {
    logger.error({ err }, `Error processing request`);
  }

  res.status(status).send(createErrorResponse(status, message));
});

// Export our `app` so we can access it in server.js
module.exports = app;
