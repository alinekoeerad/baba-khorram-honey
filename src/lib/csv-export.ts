/**
 * Persian-compatible CSV / Excel Export Utility
 * Uses UTF-8 BOM (\uFEFF) to guarantee correct rendering of Persian (Farsi) glyphs in Excel and LibreOffice.
 */

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const sanitizeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];

  // Add Headers
  csvRows.push(headers.map(sanitizeCell).join(','));

  // Add Data Rows
  rows.forEach((row) => {
    csvRows.push(row.map(sanitizeCell).join(','));
  });

  // Prepend UTF-8 BOM for proper Persian display in Windows Excel
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
