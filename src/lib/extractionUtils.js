
/**
 * Utility functions for parsing extracted text and data to find financial figures.
 */

// Helper to clean and parse number strings (e.g. "10'000.00" -> 10000.00)
export const parseSwissNumber = (str) => {
  if (!str) return 0;
  // Remove ' (apostrophe), ’ (smart quote), and spaces used as thousands separators
  const cleanStr = str.toString().replace(/['’\s]/g, '').replace(',', '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

// Regex to find potential currency values associated with keywords
// Looks for a number at the end of a line containing the keyword, or immediately following it
export const findValueInText = (text, keywords) => {
  const lines = text.split('\n');
  
  for (const keyword of keywords) {
    // Escape special regex chars in keyword
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedKeyword}.*?([0-9]['’\\s0-9]*[\\.,]?[0-9]{2})`, 'i');
    
    // Try to find in the whole text first (multiline match)
    const match = text.match(regex);
    if (match && match[1]) {
      return parseSwissNumber(match[1]);
    }

    // Fallback: Check line by line for safer context
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        // Find the last number in this line
        const numbers = line.match(/([0-9]['’\s0-9]*[\.,]?[0-9]{2})/g);
        if (numbers && numbers.length > 0) {
          return parseSwissNumber(numbers[numbers.length - 1]);
        }
      }
    }
  }
  return 0;
};

// Logic for Excel arrays (rows of cells)
export const findValueInExcel = (rows, keywords) => {
  for (const row of rows) {
    // Convert all cells in row to string for searching
    const rowStr = row.map(cell => String(cell).toLowerCase());
    
    // Check if any cell contains one of the keywords
    const keywordIndex = rowStr.findIndex(cellVal => 
      keywords.some(k => cellVal.includes(k.toLowerCase()))
    );

    if (keywordIndex !== -1) {
      // Look for a number in the adjacent cells (next 1-3 cells)
      for (let i = 1; i <= 3; i++) {
        if (row[keywordIndex + i]) {
          const val = row[keywordIndex + i];
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const parsed = parseSwissNumber(val);
            if (parsed > 0) return parsed;
          }
        }
      }
    }
  }
  return 0;
};
