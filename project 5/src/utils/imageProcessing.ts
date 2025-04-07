import { createCanvas, loadImage } from 'canvas';

/**
 * Preprocesses an image for better OCR recognition
 * @param file The image file to process
 * @returns A data URL of the processed image
 */
async function preprocessImage(file: File): Promise<string> {
  const img = await loadImage(URL.createObjectURL(file));
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Convert to grayscale and increase contrast
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Increase contrast
    const contrast = 1.5; // Contrast factor
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const newValue = factor * (avg - 128) + 128;
    
    // Apply thresholding for better text recognition
    const threshold = 128;
    const final = newValue > threshold ? 255 : 0;

    data[i] = final;     // R
    data[i + 1] = final; // G
    data[i + 2] = final; // B
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * Extracts date from OCR text using various Japanese date formats
 */
function extractDateFromText(text: string): string {
  const datePatterns = [
    // YYYY年MM月DD日
    /(\d{4})[年](\d{1,2})[月](\d{1,2})[日]/,
    // YYYY/MM/DD or YYYY-MM-DD
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    // YY/MM/DD
    /(\d{2})[\/-](\d{1,2})[\/-](\d{1,2})/,
    // MM/DD/YY
    /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})/,
    // 令和X年MM月DD日
    /令和(\d{1,2})年(\d{1,2})月(\d{1,2})日/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);

      // Handle two-digit years
      if (year < 100) {
        year += 2000;
      }
      // Handle 令和
      else if (pattern.source.includes('令和')) {
        year = 2018 + year;
      }

      // Validate date
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Extracts amount from OCR text focusing on total amount patterns
 */
function extractAmountFromText(text: string): number {
  // Remove spaces and normalize Japanese characters
  const normalizedText = text
    .replace(/\s+/g, '')
    .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

  const amountPatterns = [
    // Match patterns with specific keywords
    /(?:合計金額|お買上げ合計|総合計|合計|お会計).*?[¥￥][\s]*(\d{1,3}(?:,\d{3})*)/i,
    // Match the last occurrence of amount with yen symbol
    /[¥￥][\s]*(\d{1,3}(?:,\d{3})*)[^\d]*$/m,
    // Fallback: match any amount with yen symbol
    /[¥￥][\s]*(\d{1,3}(?:,\d{3})*)/
  ];

  for (const pattern of amountPatterns) {
    const matches = normalizedText.matchAll(pattern);
    let highestAmount = 0;

    for (const match of Array.from(matches)) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      if (amount > highestAmount) {
        highestAmount = amount;
      }
    }

    if (highestAmount > 0) {
      return highestAmount;
    }
  }

  return 0;
}

export { preprocessImage, extractDateFromText, extractAmountFromText };