const fs = require('fs');
let content = fs.readFileSync('src/app/corporate/leadgen/leads/page.js', 'utf8');

// Remove duplicate helper function definitions
// First, find the second occurrence and remove it along with the following duplicate content
const lines = content.split('\n');

// Find and remove duplicate parseDate function (starts at line with "const parseDate")
let firstParseDateFound = false;
const filteredLines = lines.filter((line, index) => {
  if (line.includes('const parseDate = (dateStr) => {')) {
    if (firstParseDateFound) {
      // Skip this line and the next lines until we find the next function or empty line
      return false;
    }
    firstParseDateFound = true;
  }
  return true;
});

// Also remove duplicate formatDateForCompare function
let firstFormatDateFound = false;
const finalLines = filteredLines.filter((line, index) => {
  if (line.includes('const formatDateForCompare = (dateStr) => {')) {
    if (firstFormatDateFound) {
      return false;
    }
    firstFormatDateFound = true;
  }
  return true;
});

content = finalLines.join('\n');

fs.writeFileSync('src/app/corporate/leadgen/leads/page.js', content);
console.log('Done');
