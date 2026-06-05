// Real .xlsx writer — zero dependencies. Builds a genuine Office Open XML
// workbook (a ZIP of XML parts) entirely in the browser and triggers a
// download. Used by the mobile Admin panel's "สร้างรายงาน Excel" button.

// ── CRC32 (for ZIP entries) ─────────────────────────────────
const _CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = _CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function _enc(s) { return new TextEncoder().encode(s); }

// ── Minimal STORE-method ZIP ────────────────────────────────
function zipStore(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = _enc(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lh.setUint16(8, 0, true);
    lh.setUint16(10, 0, true);
    lh.setUint16(12, 0, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);
    lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, 0, true);
    ch.setUint16(14, 0, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true);
    ch.setUint32(24, size, true);
    ch.setUint16(28, name.length, true);
    ch.setUint16(30, 0, true);
    ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true);
    ch.setUint16(36, 0, true);
    ch.setUint32(38, 0, true);
    ch.setUint32(42, offset, true);
    central.push({ header: new Uint8Array(ch.buffer), name });
    offset += 30 + name.length + size;
  }
  const centralParts = [];
  let centralSize = 0;
  for (const c of central) {
    centralParts.push(c.header, c.name);
    centralSize += c.header.length + c.name.length;
  }
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(8, files.length, true);
  eo.setUint16(10, files.length, true);
  eo.setUint32(12, centralSize, true);
  eo.setUint32(16, offset, true);
  return new Blob([...parts, ...centralParts, new Uint8Array(eo.buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ── XLSX assembly ───────────────────────────────────────────
function _colRef(n) {
  let s = ''; n++;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function _xml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _sheetXml(rows) {
  let body = '';
  rows.forEach((row, ri) => {
    let cells = '';
    row.forEach((val, ci) => {
      const ref = _colRef(ci) + (ri + 1);
      const isNum = typeof val === 'number' && isFinite(val);
      // style s=1 = bold header row (defined in styles.xml)
      const sAttr = ri === 0 ? ' s="1"' : '';
      if (isNum) {
        cells += `<c r="${ref}"${sAttr}><v>${val}</v></c>`;
      } else {
        cells += `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${_xml(val)}</t></is></c>`;
      }
    });
    body += `<row r="${ri + 1}">${cells}</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

// sheets: [{ name, rows: [[...], ...] }]
function buildXLSX(sheets) {
  const files = [];
  let ctOverrides = '';
  sheets.forEach((s, i) => {
    ctOverrides += `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  });
  files.push({ name: '[Content_Types].xml', data: _enc(
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ctOverrides}</Types>`) });
  files.push({ name: '_rels/.rels', data: _enc(
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) });

  let sheetTags = '', relTags = '';
  sheets.forEach((s, i) => {
    sheetTags += `<sheet name="${_xml(s.name).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`;
    relTags += `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
  });
  const stylesRid = sheets.length + 1;
  relTags += `<Relationship Id="rId${stylesRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`;

  files.push({ name: 'xl/workbook.xml', data: _enc(
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetTags}</sheets></workbook>`) });
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: _enc(
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relTags}</Relationships>`) });
  files.push({ name: 'xl/styles.xml', data: _enc(
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF252478"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`) });

  sheets.forEach((s, i) => {
    files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: _enc(_sheetXml(s.rows)) });
  });
  return zipStore(files);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
}

Object.assign(window, { buildXLSX, downloadBlob });
