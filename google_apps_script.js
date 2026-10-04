/**
 * =========================================================================
 * MYSURU DASARA 2026 - GOOGLE SHEETS LIVE SYNC BACKEND
 * =========================================================================
 * 
 * This Google Apps Script turns your Google Sheet into a live cloud database.
 * Sheet URL: https://docs.google.com/spreadsheets/d/1LElegoQAyOkOCNERLbHXYoaeW4bH1-nIxxzIPGz4tDs/edit
 * 
 * INSTRUCTIONS TO DEPLOY (Takes 60 seconds):
 * 1. Open your Google Sheet in your browser.
 * 2. Click "Extensions" menu at the top -> "Apps Script".
 * 3. Delete any code in the editor, and paste this entire script.
 * 4. Click the blue "Deploy" button (top right) -> "New deployment".
 * 5. Click the gear icon (Select type) -> choose "Web app".
 * 6. Set:
 *    - Description: "Mysuru Finance API"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial so both phones can sync without login)
 * 7. Click "Deploy", authorize access with your Google account.
 * 8. Copy the "Web app URL" (it looks like https://script.google.com/macros/s/.../exec).
 * 9. Paste that URL into your app Settings -> "Google Sheet Live Sync URL", or in js/sync.js!
 * =========================================================================
 */

function doGet(e) {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createJsonResponse([]);
  }
  
  var headers = data[0];
  var expenses = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue; // Skip empty rows
    
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    
    // Ensure proper types
    item.amount = Number(item.amount) || 0;
    if (typeof item.splitDetails === 'string' && item.splitDetails.indexOf('{') === 0) {
      try {
        item.splitDetails = JSON.parse(item.splitDetails);
      } catch (err) {
        item.splitDetails = {};
      }
    }
    
    expenses.push(item);
  }
  
  return createJsonResponse(expenses);
}

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'add';
    
    if (action === 'add' || action === 'update') {
      var exp = payload.expense;
      if (!exp || !exp.id) {
        return createJsonResponse({ error: 'Missing expense data' });
      }
      
      var data = sheet.getDataRange().getValues();
      var rowIndex = -1;
      
      // Check if expense already exists (for update)
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == exp.id) {
          rowIndex = i + 1; // 1-based row number
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
      
      return createJsonResponse({ success: true, action: action, id: exp.id });
    }
    
    if (action === 'delete') {
      var idToDelete = payload.id;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] == idToDelete) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      return createJsonResponse({ success: true, deleted: idToDelete });
    }
    
    if (action === 'sync_all') {
      // Full sync / seed
      var expenses = payload.expenses || [];
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
      
      return createJsonResponse({ success: true, syncedCount: expenses.length });
    }
    
    return createJsonResponse({ error: 'Unknown action' });
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
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
    'id',
    'date',
    'title',
    'amount',
    'category',
    'paidBy',
    'splitType',
    'avinashShare',
    'thannmayShare',
    'splitDetails',
    'paymentMode',
    'notes',
    'createdAt'
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
