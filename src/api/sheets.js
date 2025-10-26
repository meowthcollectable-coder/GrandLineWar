// Fetch Google Sheet via the gviz endpoint (public view-only)
export async function fetchSheet(sheetId, gid = 0) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonText = text.replace(/^[^\(]*\(\s*/, '').replace(/\);\s*$/, '');
  const data = JSON.parse(jsonText);
  const rows = data.table.rows || [];
  const cols = data.table.cols.map(c => c.label || c.id);
  const result = rows.map(r => {
    const obj = {};
    (r.c || []).forEach((cell, i) => {
      const key = cols[i] || `col${i}`;
      obj[key] = cell ? cell.v : "";
    });
    return obj;
  });
  return result;
}
