/**
 * Módulo de Reportes y Exportación (PDF, Excel, CSV)
 * Instituto Nacional Dr. Sarbelio Navarrete
 */

class ReportExporter {
  static exportToCSV(filename, rows) {
    if (!rows || !rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k].toString();
              cell = cell.replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator);
        })
        .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  static exportToExcel(filename, tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const html = table.outerHTML;
    const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  static printReport(title, tableHtml) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e3a8a; font-size: 16pt; margin-bottom: 5px; }
          h3 { text-align: center; color: #64748b; font-size: 11pt; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; }
          th { background-color: #f1f5f9; }
          .footer { margin-top: 30px; font-size: 9pt; text-align: right; color: #94a3b8; }
        </style>
      </head>
      <body>
        <h1>INSTITUTO NACIONAL DR. SARBELIO NAVARRETE</h1>
        <h3>${title}</h3>
        ${tableHtml}
        <div class="footer">Fecha de emisión: ${new Date().toLocaleDateString('es-SV')} ${new Date().toLocaleTimeString('es-SV')}</div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
}

window.ReportExporter = ReportExporter;
