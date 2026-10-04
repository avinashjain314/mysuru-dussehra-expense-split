/**
 * Mysuru Dasara 2026 - Multi-Device Sync & Sharing Module
 * Enables dual-user synchronization across phones for GitHub Pages hosting:
 * 1. URL State Sync (1-click link sharing)
 * 2. QR Code Sync (Phone-to-phone direct sync)
 * 3. WhatsApp formatted trip breakdown
 * 4. JSON / CSV Data Export & Import
 * 5. Firebase Realtime Sync connector (Optional Cloud Room)
 */

class TripSync {
  /**
   * Generates a portable, base64 encoded URL containing current trip state
   */
  static generateShareableLink() {
    const state = window.TripState;
    const payload = {
      expenses: state.expenses,
      budget: state.tripBudget,
      date: state.tripDate,
      ts: Date.now()
    };

    try {
      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(jsonStr));
      const baseUrl = window.location.origin + window.location.pathname;
      return `${baseUrl}#import=${encoded}`;
    } catch (e) {
      console.error('Failed to create shareable link', e);
      return window.location.href;
    }
  }

  /**
   * Checks if current URL has imported state in hash
   */
  static checkUrlImport() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#import=')) {
      try {
        const raw = hash.replace('#import=', '');
        const decoded = decodeURIComponent(atob(raw));
        const payload = JSON.parse(decoded);
        if (payload && Array.isArray(payload.expenses)) {
          return payload;
        }
      } catch (err) {
        console.error('Invalid import hash', err);
      }
    }
    return null;
  }

  /**
   * Generates formatted WhatsApp summary text
   */
  static generateWhatsAppSummary() {
    const state = window.TripState;
    const calc = window.TripCalculator.calculate(state.expenses, state.tripBudget);

    let text = `👑 *MYSURU DASARA 2026 TRIP EXPENSES* 👑\n`;
    text += `📅 Date: 17 October 2026\n`;
    text += `💰 *Total Trip Spend:* ₹${calc.totalTrip.toLocaleString('en-IN')}\n\n`;

    text += `*Who Paid What:*\n`;
    text += `🔹 Avinash Paid: ₹${calc.avinash.paid.toLocaleString('en-IN')} (Share: ₹${calc.avinash.share.toLocaleString('en-IN')})\n`;
    text += `🔸 Thannmay Paid: ₹${calc.thannmay.paid.toLocaleString('en-IN')} (Share: ₹${calc.thannmay.share.toLocaleString('en-IN')})\n\n`;

    text += `*Settlement Status:*\n`;
    if (calc.settlement.isSettled) {
      text += `✅ *All Settled Up!* Expenses are even.\n\n`;
    } else {
      text += `⚡ *${calc.settlement.description}*\n\n`;
    }

    text += `*Category Breakdown:*\n`;
    if (calc.categoryTotals.travel > 0) text += `🚗 Travel & Fuel: ₹${calc.categoryTotals.travel.toLocaleString('en-IN')}\n`;
    if (calc.categoryTotals.food > 0) text += `🍛 Food & Snacks: ₹${calc.categoryTotals.food.toLocaleString('en-IN')}\n`;
    if (calc.categoryTotals.sightseeing > 0) text += `🎟️ Dasara & Sightseeing: ₹${calc.categoryTotals.sightseeing.toLocaleString('en-IN')}\n`;
    if (calc.categoryTotals.stay > 0) text += `🏨 Stay & Hotel: ₹${calc.categoryTotals.stay.toLocaleString('en-IN')}\n`;
    if (calc.categoryTotals.shopping > 0) text += `🛍️ Shopping: ₹${calc.categoryTotals.shopping.toLocaleString('en-IN')}\n`;
    if (calc.categoryTotals.misc > 0) text += `📦 Misc: ₹${calc.categoryTotals.misc.toLocaleString('en-IN')}\n`;

    text += `\nTrack & add more expenses in our app: ${window.location.origin + window.location.pathname}`;

    return text;
  }

  /**
   * Opens WhatsApp with summary
   */
  static shareToWhatsApp() {
    const text = encodeURIComponent(this.generateWhatsAppSummary());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  }

  /**
   * Exports expenses to CSV
   */
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

  /**
   * Exports backup JSON file
   */
  static exportJson() {
    const state = window.TripState;
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users: state.users,
      tripBudget: state.tripBudget,
      roomCode: state.roomCode,
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

  /**
   * Imports backup JSON file
   */
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
