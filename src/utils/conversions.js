const marked = require("marked");
const turndown = require("turndown");
const striptags = require("striptags");
const sharp = require("sharp");

const markdownToHtml = (markdown) => {
  return marked.parse(markdown);
};

const markdownToText = (markdown) => {
  const html = markdownToHtml(markdown);
  return htmlToText(html);
};

const htmlToMarkdown = (html) => {
  const turndownService = new turndown();
  return turndownService.turndown(html);
};

const htmlToText = (html) => {
  return striptags(html);
};

const jsonToText = (json) => {
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
