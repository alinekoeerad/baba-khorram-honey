import QRCode from 'qrcode';

/**
 * Standard ISO/IEC 18004 Compliant QR Code Generator
 * Generates pure SVG QR codes using the battle-tested `qrcode` library.
 * Fully scannable by all iOS, Android, and hardware barcode readers.
 * Encodes ONLY the short URL SITE_URL/o/<code>. Never personal data or full order text.
 */
export function generateQrSvg(text: string, size = 220): string {
  if (!text || text.trim().length === 0) {
    return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#fff;color:#786455;font-size:12px;">بدون آدرس</div>`;
  }

  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const moduleCount = qr.modules.size;
    const margin = 4; // ISO quiet zone of at least 4 modules
    const totalModules = moduleCount + margin * 2;

    let path = '';
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin},${r + margin}h1v1h-1z `;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="بارکد QR سفارش">
      <rect width="100%" height="100%" fill="#FFFFFF" />
      <path d="${path.trim()}" fill="#000000" />
    </svg>`;
  } catch (err) {
    console.error('Failed to generate QR Code SVG:', err);
    return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#fff;color:#dc2626;font-size:12px;">خطا در ساخت بارکد</div>`;
  }
}
