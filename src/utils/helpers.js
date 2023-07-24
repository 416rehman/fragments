const conversions = require("./conversions");
const { webpToGif } = require("./conversions");

// A table of valid conversions for each type. The first item in the array is the corresponding extension for the type.
const conversionTable = {
  "text/plain": {
    txt: null,
  },
  "text/plain; charset=utf-8": {
    txt: null,
  },
  "text/markdown": {
    md: null,
    html: conversions.markdownToHtml,
    txt: conversions.markdownToText,
  },
  "text/html": {
    html: null,
    md: conversions.htmlToMarkdown,
    txt: conversions.htmlToText,
  },
  "application/json": {
    json: null,
    txt: conversions.jsonToText,
  },
  "image/png": {
    png: null,
    jpeg: conversions.pngToJpeg,
    webp: conversions.pngToWebp,
    gif: conversions.pngToGif,
    jpg: conversions.pngToJpeg,
  },
  "image/jpeg": {
    jpeg: null,
    png: conversions.jpegToPng,
    webp: conversions.jpegToWebp,
    gif: conversions.jpegToGif,
    jpg: null,
  },
  "image/webp": {
    webp: null,
    png: conversions.webpToPng,
    jpeg: conversions.webpToJpeg,
    gif: webpToGif,
    jpg: conversions.webpToJpeg,
  },
  "image/gif": {
    gif: null,
    png: conversions.gifToPng,
    jpeg: conversions.gifToJpeg,
    webp: conversions.gifToWebp,
    jpg: conversions.gifToJpeg,
  },
  "image/jpg": {
    jpg: null,
    png: conversions.jpegToPng,
    jpeg: null,
    webp: conversions.jpegToWebp,
    gif: conversions.jpegToGif,
  },
};

function getValidConversionsForContentType(contentType) {
  return Object.keys(conversionTable[contentType]);
}

function getContentTypeForExtension(extension) {
  if (!extension) {
    return null;
  }

  for (const [contentType, extensions] of Object.entries(conversionTable)) {
    if (Object.keys(extensions)[0] === extension) {
      return contentType;
    }
  }
  return null; // Extension not found
}

const isContentTypeSupported = (contentType) => {
  return !!conversionTable[contentType];
};

const convert = async (data, fromContentType, toExtension) => {
  const isValidExtension = getContentTypeForExtension(toExtension);
  if (!isValidExtension) {
    return {
      success: false,
      data,
    };
  }

  const validExtensions = conversionTable[fromContentType];
  if (!validExtensions) {
    return {
      success: false,
      data,
    };
  }
  if (!Object.prototype.hasOwnProperty.call(validExtensions, toExtension)) {
    return {
      success: false,
      data,
    };
  }

  const toContentType = getContentTypeForExtension(toExtension);
  if (toContentType === fromContentType) {
    // self-conversion, no need to convert.
    return {
      success: true,
      data,
    };
  }

  const conversionFunction = conversionTable[fromContentType][toExtension];
  if (!conversionFunction) {
    return {
      success: false,
      data,
    };
  }

  const isPromise = conversionFunction.constructor.name === "AsyncFunction";

  return {
    success: true,
    data: isPromise ? await conversionFunction(data) : conversionFunction(data),
  };
};

module.exports = {
  conversionTable,
  getContentTypeForExtension,
  isContentTypeSupported,
  convert,
  getValidConversionsForContentType,
};