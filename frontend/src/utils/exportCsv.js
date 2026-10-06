// Converts an array of row objects into a CSV file and triggers a
// browser download. No backend round-trip needed — the data is already
// loaded on the page, so this just reshapes and saves it client-side.
//
// columns: [{ label: 'Date', accessor: (row) => formatDate(row.date) }]
export const exportToCSV = (filename, rows, columns) => {
  if (!rows || rows.length === 0) return;

  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell(c.accessor ? c.accessor(row) : row[c.key]))
        .join(',')
    )
    .join('\n');

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};