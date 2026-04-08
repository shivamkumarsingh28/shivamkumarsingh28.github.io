/**
 * ══════════════════════════════════════════════════════════════════
 *  PORTFOLIO BACKEND — Code.gs
 *  Google Apps Script Web App
 *
 *  HOW TO DEPLOY:
 *  1. Go to https://script.google.com  →  New Project
 *  2. Paste this entire file into the editor
 *  3. Click Deploy → New Deployment
 *  4. Type: Web app
 *  5. Execute as: Me | Who has access: Anyone
 *  6. Click Deploy → Copy the Web App URL
 *  7. Paste that URL into CONFIG.GAS_URL in app.js
 *
 *  SHEET STRUCTURE:
 *  ─────────────────────────────────────────────────────────────────
 *  Sheet "projects":
 *    id | title | description | tags | emoji | github | link | featured | date
 *
 *  Sheet "blog":
 *    id | title | excerpt | content | tags | emoji | date | author | readTime
 *
 *  Sheet "messages"  (contact form submissions):
 *    firstName | lastName | email | subject | message | timestamp
 *
 *  You can add any extra sheets — they'll appear in the dropdown
 *  automatically when the frontend calls ?action=tables
 * ══════════════════════════════════════════════════════════════════
 */

/* ─── GET handler ─────────────────────────────────────────────────── */
function doGet(e) {
  const p = e.parameter || {};

  // ── List all sheet names
  if (p.action === 'tables') {
    return jsonOk({ tables: getSheetNames() });
  }

  // ── Contact form submission via GET (avoids CORS issues with POST)
  if (p.action === 'submit') {
    return handleSubmit(p);
  }

  // ── Fetch table data
  if (!p.table) {
    return jsonOk({
      info:   'Portfolio API — provide ?table=<sheetName>',
      tables: getSheetNames(),
    });
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(p.table);

  if (!sheet) {
    return jsonError(`Sheet "${p.table}" not found. Available: ${getSheetNames().join(', ')}`);
  }

  let data = sheetToArray(sheet);

  // ── Apply filters  (?filter[key]=value)
  Object.keys(p).forEach(key => {
    const match = key.match(/^filter\[(.+)]$/);
    if (match) {
      const field = match[1];
      const value = String(p[key]).toLowerCase();
      data = data.filter(row =>
        String(row[field] ?? '').toLowerCase().includes(value)
      );
    }
  });

  // ── Sort  (?sort=field:asc|desc)
  if (p.sort) {
    const [field, dir] = p.sort.split(':');
    data = data.sort((a, b) => {
      const va = String(a[field] ?? '').toLowerCase();
      const vb = String(b[field] ?? '').toLowerCase();
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  // ── Limit  (?limit=N)
  if (p.limit) {
    data = data.slice(0, Math.max(1, parseInt(p.limit, 10)));
  }

  return jsonOk({ table: p.table, count: data.length, data });
}

/* ─── POST handler ────────────────────────────────────────────────── */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    return handleSubmit(payload);
  } catch (err) {
    return jsonError('Invalid JSON: ' + err.message);
  }
}

/* ─── Handle form submission ─────────────────────────────────────── */
function handleSubmit(data) {
  try {
    const ss        = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = data.table || 'messages';
    let   sheet     = ss.getSheetByName(sheetName);

    // Auto-create "messages" sheet if missing
    if (!sheet && sheetName === 'messages') {
      sheet = ss.insertSheet('messages');
      sheet.appendRow(['firstName', 'lastName', 'email', 'subject', 'message', 'timestamp']);
    }
    if (!sheet) return jsonError(`Sheet "${sheetName}" not found`);

    // Map payload to header order
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => {
      if (h === 'timestamp') return new Date().toISOString();
      return data[h] ?? '';
    });

    sheet.appendRow(row);

    // Optional: email notification
    // MailApp.sendEmail('you@email.com', 'New contact form submission', JSON.stringify(data, null, 2));

    return jsonOk({ success: true, message: 'Submission received!' });
  } catch (err) {
    return jsonError('Submission failed: ' + err.message);
  }
}

/* ─── Helpers ────────────────────────────────────────────────────── */

/** Convert a sheet to an array of objects using the first row as keys. */
function sheetToArray(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  return values
    .slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (!h) return;
        const val = row[i];
        // Convert Date objects to ISO strings
        obj[h] = val instanceof Date ? val.toISOString().split('T')[0] : val;
      });
      return obj;
    });
}

/** Return list of all sheet tab names. */
function getSheetNames() {
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .map(s => s.getName());
}

/** Respond with JSON + CORS headers. */
function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
