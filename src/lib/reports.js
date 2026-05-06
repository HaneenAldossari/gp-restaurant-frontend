// Polished report builders shared across pages.
//
// Two output formats:
//   buildPolishedCsv(report)  -> RFC 4180 CSV with a metadata header,
//                                section labels, blank-row dividers and
//                                an Excel-friendly UTF-8 BOM.
//   openPrintableReport(rep)  -> opens a self-contained HTML document
//                                in a new tab, ready for Cmd+P → Save
//                                as PDF. Looks like a real report, not
//                                a screen grab.
//
// Report shape (passed to both):
//   {
//     title:    'Dashboard Report',
//     subtitle: 'Sales overview',
//     meta:     [{ label: 'Date range', value: 'Jan 1 → Jan 31' }, ...],
//     sections: [
//       { name: 'KPIs',         kind: 'kv',    rows: [['Revenue', '12,345 SAR'], ...] },
//       { name: 'Top Products', kind: 'table', columns: ['Product','Revenue (SAR)','Qty'],
//                                              rows: [['Latte', 4500, 220], ...],
//                                              totals: ['Total', 14200, 731] },
//     ],
//   }

const PROJECT_NAME = 'Smart Sales Analytics';
const ORG_NAME = 'Prince Sattam Bin Abdulaziz University';

// ── CSV ─────────────────────────────────────────────────────────────

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const csvRows = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

export const buildPolishedCsv = (report) => {
  const lines = [];
  const today = new Date();
  const ts = today.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Header block — these `#` lines are comments to a human and treated
  // as one-cell rows by Excel, which keeps them visually separate from
  // the data tables below.
  lines.push([`# ${PROJECT_NAME}`]);
  lines.push([`# ${report.title}${report.subtitle ? ' — ' + report.subtitle : ''}`]);
  lines.push([`# Generated: ${ts}`]);
  for (const m of report.meta || []) {
    lines.push([`# ${m.label}: ${m.value}`]);
  }
  lines.push([`# ${ORG_NAME}`]);
  lines.push([]);

  for (const section of report.sections) {
    lines.push([`== ${section.name} ==`]);

    if (section.kind === 'kv') {
      lines.push(['Metric', 'Value']);
      for (const [k, v] of section.rows) lines.push([k, v]);
    } else {
      // table
      lines.push(section.columns);
      for (const r of section.rows) lines.push(r);
      if (section.totals) lines.push(section.totals);
    }
    lines.push([]);  // blank row separator
  }

  // BOM so Excel auto-detects UTF-8 and Arabic / SAR symbols render right
  return '﻿' + csvRows(lines);
};

export const downloadCsv = (report, filename) => {
  const csv = buildPolishedCsv(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Excel-compatible spreadsheet (HTML-as-XLS) ──────────────────────
//
// Background: tester (Noura) flagged that the CSV export opens in
// Excel with the sheet flipped right-to-left and product names
// truncated. Root cause is Excel's locale heuristic — when the host
// machine is configured with Arabic locale, every CSV opens in RTL
// view by default, regardless of the file's content. Pure CSV gives
// us no place to override that setting.
//
// Fix: emit an HTML table the file extension `.xls` and the
// `application/vnd.ms-excel` MIME type. Excel happily opens HTML as
// a worksheet, AND it honours an Office-specific MS XML directive
// `<x:DisplayRightToLeft>False</x:DisplayRightToLeft>` that hard-
// overrides the Arabic-locale RTL flip. Column widths can also be
// specified inline in <col>, fixing the truncation. No new
// dependency required.
const buildExcelHtml = (report) => {
  const today = new Date();
  const ts = today.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Generous default widths; product-name columns get the widest cells.
  const colWidth = (col) => {
    const c = String(col).toLowerCase();
    if (c.includes('product') || c.includes('item') || c.includes('name'))
      return 280;
    if (c.includes('category')) return 180;
    if (c.includes('what to do') || c.includes('action') ||
        c.includes('rationale') || c.includes('advice'))
      return 320;
    if (c.includes('date')) return 140;
    return 110;
  };

  const renderSection = (section) => {
    if (section.kind === 'kv') {
      return `
        <h3>${escapeHtml(section.name)}</h3>
        <table dir="ltr">
          <colgroup><col style="width:200px"/><col style="width:240px"/></colgroup>
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody>
            ${section.rows.map(([k, v]) =>
              `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`
            ).join('')}
          </tbody>
        </table>`;
    }
    const colTags = (section.columns || []).map((c) =>
      `<col style="width:${colWidth(c)}px"/>`
    ).join('');
    return `
      <h3>${escapeHtml(section.name)}</h3>
      <table dir="ltr">
        <colgroup>${colTags}</colgroup>
        <thead>
          <tr>${(section.columns || []).map((c) =>
            `<th>${escapeHtml(c)}</th>`
          ).join('')}</tr>
        </thead>
        <tbody>
          ${(section.rows || []).map((r) => `
            <tr>${r.map((cell) =>
              `<td>${escapeHtml(cell)}</td>`
            ).join('')}</tr>
          `).join('')}
        </tbody>
        ${section.totals ? `
          <tfoot>
            <tr>${section.totals.map((cell) =>
              `<th>${escapeHtml(cell)}</th>`
            ).join('')}</tr>
          </tfoot>` : ''}
      </table>`;
  };

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40" dir="ltr">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(report.title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Report</x:Name>
          <x:WorksheetOptions>
            <x:DisplayRightToLeft>False</x:DisplayRightToLeft>
            <x:DefaultColWidth>14</x:DefaultColWidth>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; direction: ltr; }
    h2 { font-size: 14pt; margin: 0 0 4px 0; }
    h3 { font-size: 12pt; margin: 18px 0 4px 0; }
    table { border-collapse: collapse; direction: ltr; }
    th, td { border: 1px solid #b0b0b0; padding: 4px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: bold; }
    tfoot th { background: #e5e7eb; }
    .meta { color: #555; font-size: 10pt; margin-bottom: 12px; }
  </style>
</head>
<body dir="ltr">
  <h2>${escapeHtml(report.title)}${report.subtitle ? ' — ' + escapeHtml(report.subtitle) : ''}</h2>
  <div class="meta">
    ${PROJECT_NAME} · ${ORG_NAME}<br/>
    Generated: ${escapeHtml(ts)}
    ${(report.meta || []).map((m) =>
      `<br/>${escapeHtml(m.label)}: ${escapeHtml(m.value)}`
    ).join('')}
  </div>
  ${(report.sections || []).map(renderSection).join('\n')}
</body>
</html>`;
};

export const downloadExcel = (report, filename) => {
  const html = buildExcelHtml(report);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Printable HTML report ───────────────────────────────────────────

const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const renderKv = (rows) => `
  <table class="kv">
    <tbody>
      ${rows.map(([k, v]) => `
        <tr>
          <th>${escapeHtml(k)}</th>
          <td>${escapeHtml(v)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
`;

const renderTable = (section) => `
  <table class="data">
    <thead>
      <tr>${section.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${section.rows.map((r) => `
        <tr>${r.map((cell, i) =>
          `<td class="${i === 0 ? 'first' : 'num'}">${escapeHtml(cell)}</td>`
        ).join('')}</tr>
      `).join('')}
    </tbody>
    ${section.totals ? `
      <tfoot>
        <tr>${section.totals.map((cell, i) =>
          `<td class="${i === 0 ? 'first' : 'num'}">${escapeHtml(cell)}</td>`
        ).join('')}</tr>
      </tfoot>
    ` : ''}
  </table>
`;

const renderSection = (s) => `
  <section>
    <h2>${escapeHtml(s.name)}</h2>
    ${s.kind === 'kv' ? renderKv(s.rows) : renderTable(s)}
  </section>
`;

const reportHtml = (report) => {
  const today = new Date();
  const ts = today.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(report.title)} — ${PROJECT_NAME}</title>
<style>
  :root {
    --ink: #0f172a;
    --muted: #64748b;
    --line: #e2e8f0;
    --brand: #0ea5e9;
    --brand-deep: #0369a1;
    --bg-soft: #f8fafc;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
    color: var(--ink);
    background: #fff;
    padding: 48px 56px;
    max-width: 920px;
    margin: 0 auto;
  }
  header.cover {
    border-bottom: 3px solid var(--brand);
    padding-bottom: 20px;
    margin-bottom: 28px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
  }
  header.cover .brand { display: flex; align-items: center; gap: 12px; }
  header.cover .logo {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--brand), var(--brand-deep));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 18px;
    letter-spacing: -0.5px;
  }
  header.cover .titles h1 {
    margin: 0; font-size: 22px; letter-spacing: -0.4px;
  }
  header.cover .titles .sub {
    color: var(--muted); font-size: 13px; margin-top: 2px;
  }
  header.cover .stamp {
    text-align: right; color: var(--muted); font-size: 12px; line-height: 1.6;
  }
  header.cover .stamp strong { color: var(--ink); display: block; font-size: 13px; }
  .meta {
    background: var(--bg-soft);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 32px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px 24px;
  }
  .meta div { font-size: 12.5px; }
  .meta .lbl { color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-size: 10.5px; font-weight: 600; }
  .meta .val { color: var(--ink); margin-top: 2px; }

  section { margin-bottom: 28px; page-break-inside: avoid; }
  section h2 {
    font-size: 14px; font-weight: 600; margin: 0 0 10px;
    color: var(--brand-deep);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }

  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.kv th {
    text-align: left; font-weight: 500; color: var(--muted);
    padding: 8px 12px; width: 45%; border-bottom: 1px solid var(--line);
  }
  table.kv td {
    padding: 8px 12px; border-bottom: 1px solid var(--line); font-weight: 600;
  }
  table.data thead th {
    text-align: left; font-weight: 600; font-size: 11.5px;
    text-transform: uppercase; letter-spacing: 0.4px;
    color: var(--muted); padding: 10px 12px;
    border-bottom: 2px solid var(--ink);
  }
  table.data tbody td {
    padding: 9px 12px; border-bottom: 1px solid var(--line);
  }
  table.data tbody tr:nth-child(even) td { background: var(--bg-soft); }
  table.data td.first { font-weight: 500; }
  table.data td.num {
    text-align: right; font-variant-numeric: tabular-nums;
  }
  table.data tfoot td {
    padding: 10px 12px;
    border-top: 2px solid var(--ink);
    font-weight: 700;
    background: #fff;
  }

  footer.colophon {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 11px;
    display: flex; justify-content: space-between;
  }

  /* Print */
  @media print {
    body { padding: 16mm 18mm; max-width: none; }
    header.cover { margin-bottom: 18px; }
    section { margin-bottom: 18px; }
    .no-print { display: none; }
  }

  .toolbar {
    position: fixed; top: 16px; right: 16px;
    background: white; border: 1px solid var(--line);
    border-radius: 8px; padding: 6px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.08);
    display: flex; gap: 4px;
  }
  .toolbar button {
    border: 0; background: var(--brand); color: white;
    padding: 8px 14px; border-radius: 6px; font-weight: 600;
    cursor: pointer; font-size: 12px;
  }
  .toolbar button.secondary { background: #f1f5f9; color: var(--ink); }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">Save as PDF / Print</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>

  <header class="cover">
    <div class="brand">
      <div class="logo">SS</div>
      <div class="titles">
        <h1>${escapeHtml(report.title)}</h1>
        <div class="sub">${escapeHtml(report.subtitle || PROJECT_NAME)}</div>
      </div>
    </div>
    <div class="stamp">
      <strong>${escapeHtml(PROJECT_NAME)}</strong>
      Generated ${escapeHtml(ts)}<br/>
      ${escapeHtml(ORG_NAME)}
    </div>
  </header>

  ${(report.meta || []).length ? `
    <div class="meta">
      ${(report.meta || []).map((m) => `
        <div>
          <div class="lbl">${escapeHtml(m.label)}</div>
          <div class="val">${escapeHtml(m.value)}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${report.sections.map(renderSection).join('')}

  <footer class="colophon">
    <span>${escapeHtml(PROJECT_NAME)} · Confidential business report</span>
    <span>Page <span class="pn"></span></span>
  </footer>
</body>
</html>`;
};

export const openPrintableReport = (report) => {
  const html = reportHtml(report);
  const win = window.open('', '_blank');
  if (!win) {
    // Pop-up blocked — fall back to a download so the user still gets it.
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(report.title || 'report').toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
};

// ── Number / currency helpers used by callers ──────────────────────

export const fmtSar = (n) => {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.round(Number(n))) + ' SAR';
};

export const fmtNum = (n, digits = 0) => {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(Number(n));
};

export const fmtPct = (n, digits = 1) => {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toFixed(digits)}%`;
};
