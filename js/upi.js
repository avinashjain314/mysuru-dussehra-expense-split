/**
 * Mysuru Dasara 2026 - UPI Payment & Settlement Integration
 * Builds standard Indian UPI Intent links & renders QR codes for instant settlement via
 * Google Pay, PhonePe, Paytm, BHIM or any UPI application.
 */

class UPIHelper {
  /**
   * Generates standard UPI intent URL
   * @param {Object} params
   * @param {string} params.upiId - VPA address (e.g., avinash@okhdfcbank)
   * @param {string} params.name - Receiver name
   * @param {number} params.amount - Settlement amount in INR
   * @param {string} params.note - Transaction note
   */
  static generateUpiUrl({ upiId, name, amount, note = 'Mysuru Dasara Trip Settlement' }) {
    if (!upiId) return '';
    const cleanUpi = encodeURIComponent(upiId.trim());
    const cleanName = encodeURIComponent(name.trim());
    const cleanNote = encodeURIComponent(note.trim());
    const cleanAmt = amount ? Number(amount).toFixed(2) : '';

    let url = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR&tn=${cleanNote}`;
    if (cleanAmt && Number(cleanAmt) > 0) {
      url += `&am=${cleanAmt}`;
    }
    return url;
  }

  /**
   * Renders QR code onto a container element using dynamic QR generator
   */
  static renderUpiQr(containerEl, upiUrl, amount) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    if (!upiUrl) {
      containerEl.innerHTML = `
        <div style="padding: 20px; color: var(--text-muted); font-size: 0.85rem; text-align: center;">
          <p>⚠️ No UPI ID configured yet.</p>
          <button class="btn btn-outline btn-sm" style="margin-top: 8px;" onclick="window.App.openSettingsModal()">
            ⚙️ Add UPI ID in Settings
          </button>
        </div>
      `;
      return;
    }

    // 1. First Priority: Offline Pure-JavaScript Local Generator
    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(containerEl, {
          text: upiUrl,
          width: 190,
          height: 190,
          colorDark: '#0b0f19',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
        return;
      }
    } catch (e) {
      console.warn('Local QRCode fallback to image', e);
    }

    // 2. Secondary fallback: High-speed endpoint if connected
    const encodedData = encodeURIComponent(upiUrl);
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodedData}`;
    qrImg.alt = 'Scan with GPay, PhonePe, or Paytm';
    qrImg.style.width = '190px';
    qrImg.style.height = '190px';
    qrImg.style.borderRadius = '8px';
    qrImg.loading = 'lazy';

    qrImg.onerror = () => {
      // Offline fallback when no QR library and no internet: direct launch button
      containerEl.innerHTML = `
        <div style="padding: 14px; text-align: center;">
          <p style="font-size: 0.82rem; color: #000; margin-bottom: 8px;">Tap below to launch UPI App:</p>
          <a href="${upiUrl}" class="btn btn-primary btn-sm" style="color: #0b0f19;">Open UPI App</a>
        </div>
      `;
    };

    containerEl.appendChild(qrImg);
  }
}

window.UPIHelper = UPIHelper;
