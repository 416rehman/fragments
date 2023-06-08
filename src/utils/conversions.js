const marked = require("marked");
const turndown = require("turndown");
const striptags = require("striptags");
const sharp = require("sharp");

const markdownToHtml = (markdown) => {
    if (! (typeof markdown === 'string' || markdown instanceof String)) {
        markdown = new TextDecoder("utf-8").decode(markdown);
    }
    return marked.parse(markdown, {headerIds: false, mangle: false});
};

const markdownToText = (markdown) => {
    if (! (typeof markdown === 'string' || markdown instanceof String)) {
        markdown = new TextDecoder("utf-8").decode(markdown);
    }
    const html = markdownToHtml(markdown);
    return htmlToText(html);
};

const htmlToMarkdown = (html) => {
    if (! (typeof html === 'string' || html instanceof String)) {
        html = new TextDecoder("utf-8").decode(html);
    }
    const turndownService = new turndown();
    return turndownService.turndown(html);
};

const htmlToText = (html) => {
    if (! (typeof html === 'string' || html instanceof String)) {
        html = new TextDecoder("utf-8").decode(html);
    }
    return striptags(html);
};

const jsonToText = (json) => {
    if (! (typeof json === 'string' || json instanceof String)) {
        json = new TextDecoder("utf-8").decode(json);
    }
    return JSON.stringify(json);
};

const pngToJpeg = (png) => {
    return sharp(png).jpeg().toBuffer();
};

const pngToWebp = (png) => {
    return sharp(png).webp().toBuffer();
};

const pngToGif = (png) => {
    return sharp(png).gif().toBuffer();
};

const jpegToPng = (jpeg) => {
    return sharp(jpeg).png().toBuffer();
};

const jpegToWebp = (jpeg) => {
    return sharp(jpeg).webp().toBuffer();
};

const jpegToGif = (jpeg) => {
    return sharp(jpeg).gif().toBuffer();
};

const webpToPng = (webp) => {
    return sharp(webp).png().toBuffer();
};

const webpToJpeg = (webp) => {
    return sharp(webp).jpeg().toBuffer();
};

const webpToGif = (webp) => {
    return sharp(webp).gif().toBuffer();
};

const gifToPng = (gif) => {
    return sharp(gif).png().toBuffer();
};

const gifToJpeg = (gif) => {
    return sharp(gif).jpeg().toBuffer();
};

const gifToWebp = (gif) => {
    return sharp(gif).webp().toBuffer();
};

module.exports = {
    markdownToHtml,
    markdownToText,
    htmlToMarkdown,
    htmlToText,
    jsonToText,
    pngToJpeg,
    pngToWebp,
    pngToGif,
    jpegToPng,
    jpegToWebp,
    jpegToGif,
    webpToPng,
    webpToJpeg,
    webpToGif,
    gifToPng,
    gifToJpeg,
    gifToWebp,
};
