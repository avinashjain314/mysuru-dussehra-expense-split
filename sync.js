/**
 * Mysuru Dasara 2026 - Automated Google Sheets & Multi-Device Live Sync
 * 
 * 1. Automatic Live Background Sync:
 *    - Real-time two-way synchronization via Google Apps Script Web App.
 *    - Connected to user's Google Sheet: https://docs.google.com/spreadsheets/d/1LElegoQAyOkOCNERLbHXYoaeW4bH1-nIxxzIPGz4tDs/edit
 *    - Polls in background every 6 seconds and on tab focus.
 *    - Automatically pushes new expenses the moment they are logged.
 * 2. 1-Tap Offline URL & QR Sync (Instant fallback if no Apps Script configured).
 * 3. Full Auto-Merge & Deduplication.
 */

const SYNC_STORAGE_KEYS = {
  SHEET_API_URL: 'mysuru_google_sheet_api_v2',
  LAST_SYNC_TIME: 'mysuru_last_sync_timestamp_v2'
};

// Default Google Sheet ID provided by Avinash
const DEFAULT_SHEET_ID = '1LElegoQAyOkOCNERLbHXYoaeW4bH1-nIxxzIPGz4tDs';

class TripSync {
  static getSheetApiUrl() {
    // 1. Check URL query params (?api=...)
    const params = new URLSearchParams(window.location.search);
    if (params.has('api')) {
      const url = decodeURIComponent(params.get('api'));
      localStorage.setItem(SYNC_STORAGE_KEYS.SHEET_API_URL, url);
      return url;
    }

    // 2. Check LocalStorage
    return localStorage.getItem(SYNC_STORAGE_KEYS.SHEET_API_URL) || '';
  }

  static setSheetApiUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem(SYNC_STORAGE_KEYS.SHEET_API_URL, url.trim());
    } else {
      localStorage.removeItem(SYNC_STORAGE_KEYS.SHEET_API_URL);
    }
    this.updateCloudStatusBadge();
  }

  /**
   * Pushes a single expense to the Google Sheet backend
   */
  static async pushExpense(expense, action = 'add') {
    const apiUrl = this.getSheetApiUrl();
    if (!apiUrl) return;

    this.updateCloudStatusBadge('syncing');
    try {
      // Priority 1: GET parameter method (100% immune to CORS & mobile redirect issues)
      const dataStr = encodeURIComponent(JSON.stringify(expense));
      const getUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') +
        'action=' + action +
        '&data=' + dataStr +
        '&t=' + Date.now();

      if (getUrl.length < 3500) {
        await fetch(getUrl, { method: 'GET' });
      } else {
        // Fallback for large payload: POST with mode: 'no-cors'
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: action, expense: expense, id: expense ? expense.id : null })
        });
      }
      localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME, Date.now());
      this.updateCloudStatusBadge('synced');
    } catch (err) {
      console.warn('Google Sheet push fallback to no-cors POST:', err);
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: action, expense: expense, id: expense ? expense.id : null })
        });
        this.updateCloudStatusBadge('synced');
      } catch (e2) {
        this.updateCloudStatusBadge('error');
      }
    }
  }

  /**
   * Tests the connection to the Google Apps Script Web App URL
   * Returns: { ok: boolean, message: string, details?: any }
   */
  static async testConnection(customUrl) {
    const rawUrl = customUrl || this.getSheetApiUrl();
    if (!rawUrl || !rawUrl.trim()) {
      return {
        ok: false,
        message: 'No URL entered. Please paste your Google Apps Script Web App URL.'
      };
    }

    const url = rawUrl.trim();

    // Check 1: Did the user paste the Google Sheet URL instead of Apps Script URL?
    if (url.includes('docs.google.com/spreadsheets')) {
      return {
        ok: false,
        message: '⚠️ You pasted the Google Sheet spreadsheet link! You must paste the Web App URL from Extensions ➔ Apps Script ➔ Deploy ➔ Manage deployments ➔ Web app (ends in /exec).'
      };
    }

    if (!url.startsWith('https://script.google.com/')) {
      return {
        ok: false,
        message: '⚠️ URL must start with https://script.google.com/macros/s/.../exec'
      };
    }

    try {
      const pingUrl = url + (url.includes('?') ? '&' : '?') + 'action=ping&t=' + Date.now();
      const res = await fetch(pingUrl, { method: 'GET' });
      
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        if (text.includes('accounts.google.com') || text.includes('Sign in') || text.includes('ServiceLogin')) {
          return {
            ok: false,
            message: '⚠️ Permission Error: Apps Script is set to "Only myself". In Apps Script, click Deploy ➔ Manage deployments ➔ Edit (pencil) ➔ set "Who has access" to "Anyone" ➔ Deploy.'
          };
        }
        return {
          ok: false,
          message: 'Received non-JSON response from Google. Ensure you deployed as "Web app" with access: "Anyone".'
        };
      }

      if (data && (data.success || Array.isArray(data))) {
        const rows = data.rowCount !== undefined ? data.rowCount : (Array.isArray(data) ? data.length : 0);
        return {
          ok: true,
          message: `🟢 Connected! Google Sheet is active. (${rows} expenses currently in sheet)`,
          data: data
        };
      } else if (data && data.error) {
        return {
          ok: false,
          message: `⚠️ Apps Script reported: ${data.error}`
        };
      }

      return {
        ok: true,
        message: '🟢 Connected successfully to Google Sheet!'
      };
    } catch (err) {
      return {
        ok: false,
        message: `❌ Connection failed (${err.message || 'Failed to fetch'}). Check your internet or Apps Script URL.`
      };
    }
  }

  /**
   * Pushes all local expenses to the Google Sheet (useful for initial seeding)
   */
  static async pushAllExpensesToSheet() {
    const apiUrl = this.getSheetApiUrl();
    if (!apiUrl) {
      return { success: false, message: 'Please configure your Google Apps Script URL in Settings first.' };
    }

    const state = window.TripState;
    if (!state.expenses || state.expenses.length === 0) {
      return { success: false, message: 'No expenses logged locally to upload.' };
    }

    this.updateCloudStatusBadge('syncing');

    try {
      const dataStr = encodeURIComponent(JSON.stringify(state.expenses));
      const getUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') +
        'action=sync_all&data=' + dataStr +
        '&t=' + Date.now();

      let pushed = false;
      if (getUrl.length < 3500) {
        const res = await fetch(getUrl, { method: 'GET' });
        if (res.ok) {
          const resJson = await res.json().catch(() => null);
          if (resJson && resJson.success) pushed = true;
        }
      }

      if (!pushed) {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'sync_all', expenses: state.expenses })
        });
      }

      localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME, Date.now());
      this.updateCloudStatusBadge('synced');
      return { success: true, count: state.expenses.length, message: `Uploaded ${state.expenses.length} expense(s) to Google Sheet!` };
    } catch (err) {
      console.warn('Push all fallback to no-cors POST:', err);
      try {
        await fetch(apiUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'sync_all', expenses: state.expenses })
        });
        this.updateCloudStatusBadge('synced');
        return { success: true, count: state.expenses.length, message: `Uploaded ${state.expenses.length} expense(s) to Google Sheet!` };
      } catch (e2) {
        this.updateCloudStatusBadge('error');
        return { success: false, message: 'Network error connecting to Google Sheet.' };
      }
    }
  }

  /**
   * Pulls the latest expenses from the Google Sheet and auto-merges them
   */
  static async pullLatestFromCloud(silent = true) {
    const apiUrl = this.getSheetApiUrl();
    if (!apiUrl) {
      this.updateCloudStatusBadge('unconfigured');
      return 0;
    }

    try {
      // Add cache buster to prevent stale browser cache
      const fetchUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      const resp = await fetch(fetchUrl);

      if (resp.ok) {
        const cloudExpenses = await resp.json();
        if (Array.isArray(cloudExpenses)) {
          const added = window.TripState.mergeExpenses(cloudExpenses);
          localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME, Date.now());
          this.updateCloudStatusBadge('synced');

          if (added > 0 && !silent && window.App && window.App.showToast) {
            window.App.showToast(`✨ Auto-Synced: Loaded ${added} new expenses from Google Sheet!`);
          }
          return added;
        }
      }
      this.updateCloudStatusBadge('synced');
    } catch (err) {
      // Offline or network error
      this.updateCloudStatusBadge('offline');
    }
    return 0;
  }

  /**
   * Starts automatic background synchronization polling
   */
  static startAutoSync() {
    // Initial fetch
    this.pullLatestFromCloud(true);

    // Poll every 6 seconds in background
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => {
        this.pullLatestFromCloud(true);
      }, 6000);
    }

    // Refresh immediately when window regains focus or comes online
    window.addEventListener('focus', () => this.pullLatestFromCloud(true));
    window.addEventListener('online', () => this.pullLatestFromCloud(false));
  }

  /**
   * Updates the UI badge in the header indicating Google Sheet status
   */
  static updateCloudStatusBadge(status) {
    const badge = document.getElementById('cloud-sync-status-badge');
    const dot = document.getElementById('cloud-status-dot');
    const text = document.getElementById('cloud-status-text');
    if (!badge || !dot || !text) return;

    const apiUrl = this.getSheetApiUrl();

    if (!apiUrl) {
      badge.style.display = 'flex';
      badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      badge.style.color = '#f59e0b';
      dot.style.background = '#f59e0b';
      text.textContent = 'Setup Sheet Sync';
      badge.onclick = () => window.App.switchTab('settings');
      return;
    }

    badge.style.display = 'flex';
    badge.onclick = () => {
      const lastSync = localStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);
      const timeStr = lastSync ? new Date(Number(lastSync)).toLocaleTimeString('en-IN') : 'Just now';
      alert(`🟢 Google Sheet Live Sync is Active!\n\nConnected Sheet ID: ${DEFAULT_SHEET_ID}\nLast Synced: ${timeStr}\n\nBoth Avinash and Thannmay's expenses are synced automatically in the background.`);
    };

    if (status === 'syncing') {
      badge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      badge.style.color = '#38bdf8';
      dot.style.background = '#38bdf8';
      text.textContent = 'Syncing...';
    } else if (status === 'offline') {
      badge.style.borderColor = 'rgba(148, 163, 184, 0.3)';
      badge.style.color = '#94a3b8';
      dot.style.background = '#94a3b8';
      text.textContent = 'Offline (Vault Safe)';
    } else {
      badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      badge.style.color = '#10b981';
      dot.style.background = '#10b981';
      text.textContent = 'Sheet Live';
    }
  }

  /**
   * Generates a 1-tap sync link (URL fallback)
   */
  static generateShareableLink() {
    const state = window.TripState;
    const apiUrl = this.getSheetApiUrl();
    
    const compactExpenses = (state.expenses || []).map(e => ({
      i: e.id,
      t: e.title,
      a: e.amount,
      c: e.category,
      p: e.paidBy,
      s: e.splitType,
      d: e.date,
      m: e.paymentMode || 'UPI',
      sd: e.splitDetails || {}
    }));

    const payload = {
      b: state.tripBudget || 15000,
      r: state.roomCode || 'MYS-DASARA-2026',
      api: apiUrl || '',
      e: compactExpenses,
      ts: Date.now()
    };

    try {
      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}#sync=${encoded}`;
    } catch (err) {
      console.error('Failed to create compact sync link', err);
      return window.location.href;
    }
  }

  /**
   * Checks if current URL has sync/import data in hash or search query
   */
  static checkUrlImport() {
    const hash = window.location.hash || '';
    let raw = '';

    if (hash.startsWith('#sync=')) {
      raw = hash.replace('#sync=', '');
    } else if (hash.startsWith('#import=')) {
      raw = hash.replace('#import=', '');
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.has('sync')) {
        raw = params.get('sync');
      }
    }

    if (!raw) return null;

    try {
      const decoded = decodeURIComponent(atob(raw));
      const payload = JSON.parse(decoded);

      // If payload includes Google Apps Script API URL, save it automatically on the receiving phone!
      if (payload.api) {
        this.setSheetApiUrl(payload.api);
      }

      // Compact format
      if (payload && Array.isArray(payload.e)) {
        const expandedExpenses = payload.e.map(c => ({
          id: c.i,
          title: c.t,
          amount: c.a,
          category: c.c,
          paidBy: c.p,
          splitType: c.s,
          date: c.d,
          paymentMode: c.m || 'UPI',
          splitDetails: c.sd || {},
          createdAt: c.d ? new Date(c.d).getTime() : Date.now()
        }));

        return {
          expenses: expandedExpenses,
          budget: payload.b || 15000,
          roomCode: payload.r || 'MYS-DASARA-2026'
        };
      }

      if (payload && Array.isArray(payload.expenses)) {
        return payload;
      }
    } catch (err) {
      console.error('Invalid sync payload', err);
    }

    return null;
  }

  /**
   * Generates formatted WhatsApp summary text with embedded sync link
   */
  static generateWhatsAppSummary() {
    const state = window.TripState;
    const calc = window.TripCalculator.calculate(state.expenses, state.tripBudget);
    const syncLink = this.generateShareableLink();

    let text = `👑 *MYSURU DASARA 2026 TRIP EXPENSES* 👑\n`;
    text += `📅 Date: 17 October 2026\n`;
    text += `💰 *Total Trip Spend:* ₹${calc.totalTrip.toLocaleString('en-IN')}\n\n`;

    text += `*Who Paid What:*\n`;
    text += `🔹 Avinash Paid: ₹${calc.avinash.paid.toLocaleString('en-IN')} (Fair Share: ₹${calc.avinash.share.toLocaleString('en-IN')})\n`;
    text += `🔸 Thannmay Paid: ₹${calc.thannmay.paid.toLocaleString('en-IN')} (Fair Share: ₹${calc.thannmay.share.toLocaleString('en-IN')})\n\n`;

    text += `*Split Status:*\n`;
    if (calc.settlement.isSettled) {
      text += `✅ *All Settled Up!* Expenses are even.\n\n`;
    } else {
      text += `⚡ *${calc.settlement.description}*\n\n`;
    }

    text += `📲 *Open App & Live Sync:* \n${syncLink}`;

    return text;
  }

  static shareToWhatsApp() {
    const text = encodeURIComponent(this.generateWhatsAppSummary());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  static copySyncLink() {
    const link = this.generateShareableLink();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(link).then(() => link);
    } else {
      const input = document.createElement('textarea');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return Promise.resolve(link);
    }
  }

  static renderSyncQr(containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    const link = this.generateShareableLink();

    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(containerEl, {
          text: link,
          width: 200,
          height: 200,
          colorDark: '#0b0f19',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.L
        });
        return;
      }
    } catch (e) {
      console.warn('Local QRCode fallback', e);
    }

    const encodedData = encodeURIComponent(link);
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedData}`;
    qrImg.alt = 'Scan to sync expenses';
    qrImg.style.width = '200px';
    qrImg.style.height = '200px';
    containerEl.appendChild(qrImg);
  }

  static exportCsv() {
    const expenses = window.TripState.expenses;
    if (!expenses || expenses.length === 0) {
      alert('No expenses to export.');
      return;
    }

    let csv = 'ID,Date,Title,Category,Amount (INR),Paid By,Split Type,Avinash Share,Thannmay Share,Payment Mode,Notes\n';
    expenses.forEach(e => {
      const half = (e.amount / 2).toFixed(2);
      const avShare = e.splitType === 'equal' ? half : (e.splitDetails ? e.splitDetails.avinash : (e.paidBy === 'avinash' ? e.amount : 0));
      const thShare = e.splitType === 'equal' ? half : (e.splitDetails ? e.splitDetails.thannmay : (e.paidBy === 'thannmay' ? e.amount : 0));

      const row = [
        `"${e.id}"`,
        `"${e.date || ''}"`,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${e.category || ''}"`,
        e.amount,
        `"${e.paidBy || ''}"`,
        `"${e.splitType || ''}"`,
        avShare,
        thShare,
        `"${e.paymentMode || ''}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mysuru_Dasara_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static exportJson() {
    const state = window.TripState;
    const backupData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      sheetId: DEFAULT_SHEET_ID,
      users: state.users,
      tripBudget: state.tripBudget,
      expenses: state.expenses
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mysuru_Trip_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static importJsonFile(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && Array.isArray(data.expenses)) {
          const added = window.TripState.mergeExpenses(data.expenses);
          if (data.tripBudget) window.TripState.updateBudget(data.tripBudget);
          if (callback) callback({ success: true, count: added });
        } else {
          if (callback) callback({ success: false, error: 'Invalid JSON format' });
        }
      } catch (err) {
        if (callback) callback({ success: false, error: 'Malformed JSON file' });
      }
    };
    reader.readAsText(file);
  }
}

window.TripSync = TripSync;
