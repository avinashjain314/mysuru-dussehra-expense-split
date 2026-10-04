/**
 * =========================================================================
 * MYSURU DASARA 2026 - GOOGLE SHEETS LIVE SYNC BACKEND (V2)
 * =========================================================================
 * 
 * This version supports BOTH GET and POST methods, completely eliminating
 * any mobile browser CORS or redirect issues!
 * 
 * Works 100% on:
 * - Chrome, Safari, Firefox
 * - Instagram in-app browser
 * - Mobile webviews & PWA
 * =========================================================================
 */

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action || 'get';

    // 0. PING / DIAGNOSTIC TEST
    if (action === 'ping' || action === 'test') {
      return createJsonResponse({
        success: true,
        version: 'v2.1',
        sheetName: sheet.getName(),
        rowCount: Math.max(0, sheet.getLastRow() - 1),
        message: 'Google Sheet Live Sync is connected and ready!'
      });
    }

    // 1. ADD / UPDATE via GET
    if (action === 'add' || action === 'update') {
      var exp = parseDataSafely(params.data);
      if (exp) {
        saveExpenseToSheet(sheet, exp);
        return createJsonResponse({ success: true, action: action, id: exp.id, totalRows: sheet.getLastRow() - 1 });
      }
      return createJsonResponse({ error: 'Failed to parse expense data: ' + params.data });
    }

    // 2. DELETE via GET
    if (action === 'delete') {
      var idToDelete = params.id;
      deleteExpenseFromSheet(sheet, idToDelete);
      return createJsonResponse({ success: true, deleted: idToDelete, totalRows: sheet.getLastRow() - 1 });
    }

    // 3. SYNC ALL via GET
    if (action === 'sync_all') {
      var expenses = parseDataSafely(params.data);
      if (Array.isArray(expenses)) {
        syncAllExpensesToSheet(sheet, expenses);
        return createJsonResponse({ success: true, syncedCount: expenses.length, totalRows: sheet.getLastRow() - 1 });
      }
      return createJsonResponse({ error: 'Failed to parse sync_all expenses array' });
    }

    // 4. DEFAULT: RETURN ALL EXPENSES
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse([]);
    }

    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;

      var item = {};
      for (var j = 0; j < headers.length; j++) {
        item[headers[j]] = row[j];
      }

      item.amount = Number(item.amount) || 0;
      if (typeof item.splitDetails === 'string' && item.splitDetails.indexOf('{') === 0) {
        try { item.splitDetails = JSON.parse(item.splitDetails); } catch(err) { item.splitDetails = {}; }
      }
      results.push(item);
    }

    return createJsonResponse(results);

  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var payload;
    
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      payload = {};
    }

    var action = payload.action || 'add';

    if (action === 'ping' || action === 'test') {
      return createJsonResponse({
        success: true,
        version: 'v2.1',
        sheetName: sheet.getName(),
        rowCount: Math.max(0, sheet.getLastRow() - 1),
        message: 'Google Sheet Live Sync is connected and ready! (POST mode)'
      });
    }

    if (action === 'add' || action === 'update') {
      var exp = payload.expense;
      if (!exp && payload.data) exp = parseDataSafely(payload.data);
      if (exp) {
        saveExpenseToSheet(sheet, exp);
        return createJsonResponse({ success: true, action: action, id: exp.id, totalRows: sheet.getLastRow() - 1 });
      }
      return createJsonResponse({ error: 'Missing or invalid expense payload' });
    }

    if (action === 'delete') {
      deleteExpenseFromSheet(sheet, payload.id);
      return createJsonResponse({ success: true, deleted: payload.id, totalRows: sheet.getLastRow() - 1 });
    }

    if (action === 'sync_all') {
      var expenses = payload.expenses;
      if (!expenses && payload.data) expenses = parseDataSafely(payload.data);
      syncAllExpensesToSheet(sheet, expenses || []);
      return createJsonResponse({ success: true, syncedCount: (expenses || []).length, totalRows: sheet.getLastRow() - 1 });
    }

    return createJsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function parseDataSafely(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch (e1) {
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch (e2) {
      return null;
    }
  }
}

function saveExpenseToSheet(sheet, exp) {
  if (!exp || !exp.id) return;
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == exp.id) {
      rowIndex = i + 1;
      break;
    }
  }

  var avShare = exp.splitType === 'equal' ? (exp.amount / 2) : (exp.splitDetails ? (exp.splitDetails.avinash || 0) : 0);
  var thShare = exp.splitType === 'equal' ? (exp.amount / 2) : (exp.splitDetails ? (exp.splitDetails.thannmay || 0) : 0);

  var rowData = [
    exp.id,
    exp.date || new Date().toISOString(),
    exp.title,
    Number(exp.amount),
    exp.category,
    exp.paidBy,
    exp.splitType,
    avShare,
    thShare,
    JSON.stringify(exp.splitDetails || {}),
    exp.paymentMode || 'UPI',
    exp.notes || '',
    exp.createdAt || Date.now()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteExpenseFromSheet(sheet, idToDelete) {
  if (!idToDelete) return;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == idToDelete) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function syncAllExpensesToSheet(sheet, expenses) {
  sheet.clearContents();
  setupHeaders(sheet);

  for (var k = 0; k < expenses.length; k++) {
    var eItem = expenses[k];
    var avS = eItem.splitType === 'equal' ? (eItem.amount / 2) : (eItem.splitDetails ? (eItem.splitDetails.avinash || 0) : 0);
    var thS = eItem.splitType === 'equal' ? (eItem.amount / 2) : (eItem.splitDetails ? (eItem.splitDetails.thannmay || 0) : 0);

    sheet.appendRow([
      eItem.id,
      eItem.date || new Date().toISOString(),
      eItem.title,
      Number(eItem.amount),
      eItem.category,
      eItem.paidBy,
      eItem.splitType,
      avS,
      thS,
      JSON.stringify(eItem.splitDetails || {}),
      eItem.paymentMode || 'UPI',
      eItem.notes || '',
      eItem.createdAt || Date.now()
    ]);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Trip_Expenses');
  if (!sheet) {
    sheet = ss.getActiveSheet();
    sheet.setName('Trip_Expenses');
  }

  if (sheet.getLastRow() === 0) {
    setupHeaders(sheet);
  }
  return sheet;
}

function setupHeaders(sheet) {
  var headers = [
    'id', 'date', 'title', 'amount', 'category', 'paidBy', 'splitType',
    'avinashShare', 'thannmayShare', 'splitDetails', 'paymentMode', 'notes', 'createdAt'
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
