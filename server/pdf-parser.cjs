const pdfParse = require('pdf-parse');

module.exports = async function parsePDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
};
