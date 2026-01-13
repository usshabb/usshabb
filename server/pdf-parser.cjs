const { PDFParse } = require('pdf-parse');

module.exports = async function parsePDF(buffer) {
  const data = await PDFParse(buffer);
  return data.text;
};
