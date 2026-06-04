import QRCode from 'qrcode';

/**
 * Generates a QR code data URL for the public menu page.
 * Uses BPC brand colors (maroon on white).
 *
 * @param {string} menuUrl - The URL to encode in the QR code
 * @returns {Promise<string>} Base64 data URL of the QR code image
 */
export const generateMenuQR = async (menuUrl) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(menuUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#7B1C1C',  // BPC Maroon
        light: '#FFFFFF',
      },
    });

    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error.message);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a QR code as a Buffer (for PDF embedding).
 *
 * @param {string} data - Data to encode
 * @param {number} width - Image width in pixels
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const generateQRBuffer = async (data, width = 200) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width,
      margin: 1,
      color: {
        dark: '#7B1C1C',
        light: '#FFFFFF',
      },
    });

    return buffer;
  } catch (error) {
    console.error('QR Buffer generation failed:', error.message);
    throw new Error('Failed to generate QR code buffer');
  }
};
