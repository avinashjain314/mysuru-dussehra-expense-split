# 🏰 Mysuru Dasara 2026 - Trip Expense & Split App

A dedicated, mobile-first progressive web application designed for **Avinash** and **Thannmay** for their **Bengaluru ➔ Mysuru Dasara Trip** on **17 October 2026**.

Built with pure HTML5, CSS3, and JavaScript with **zero build tools** and **zero server costs**, making it 100% ready to host on **GitHub Pages**.

---

## 🌟 Key Features

- **📊 100% Automated Google Sheet Live Sync**:
  - Automatically writes all transactions to your shared Google Sheet: `https://docs.google.com/spreadsheets/d/1LElegoQAyOkOCNERLbHXYoaeW4bH1-nIxxzIPGz4tDs/edit`.
  - Background live polling every 6 seconds.
  - Zero manual syncing needed: log on one phone, and it pops up on the other automatically!
- **🛡️ Zero-Data-Loss Vault Storage**:
  - **Triple-Layer Redundancy**: Writes simultaneously to **LocalStorage**, rolling **Snapshot Vaults**, and **IndexedDB** (`MysuruDasaraVault_DB`).
  - **Auto-Recovery**: If a mobile browser or system reboot ever clears temporary cache, the app automatically recovers all expenses from the Vault.
  - **Hardware Storage Persistence**: Invokes `navigator.storage.persist()` so iOS & Android browsers will **never** purge your trip data.
  - **100% Offline Ready**: Works seamlessly on the Bengaluru-Mysuru highway and inside Mysore Palace without internet connection. Even UPI QR generation runs purely in local JavaScript.
  - **Trash Can & Accidental Delete Protection**: Deleted items are preserved in a Trash Vault and can be restored anytime.
- **Dual-Traveler Profiles Pre-Configured**:
  - Quickly toggle active user between **Avinash** and **Thannmay** with 1 tap in the top header.
  - Color-coded avatars and tags (Sky Blue for Avinash, Rose Pink for Thannmay).
- **Live Settlement Calculation & Banner**:
  - Automatically computes who paid what, each person's fair share, and net settlement.
  - Prominent banner: *"Thannmay owes Avinash ₹X"* or *"Avinash owes Thannmay ₹Y"* or *"All Settled Up!"*.
- **⚡ Instant UPI Payment Integration**:
  - Dynamically creates UPI payment links (`upi://pay?pa=...`) and on-screen scannable QR codes for **Google Pay**, **PhonePe**, **Paytm**, and **BHIM**.
  - Settle up balances instantly at any tea stall or dinner table.
- **Flexible Expense Logging**:
  - Quick-add suggestions tailored for Mysuru: *Mylari Masala Dosa, Expressway Toll, Palace Entry Tickets, Guru Sweets Mysore Pak, Petrol, Dasara Exhibition*.
  - Quick amount increments (+₹100, +₹200, +₹500, +₹1,000).
  - Split strategies: **50/50 Equal Split**, **100% Personal Spend**, or **Custom Split**.
  - Categorization: Travel & Toll, Food & Snacks, Stay, Sightseeing, Shopping, and Misc.
- **🎯 Trip Budget Tracker**:
  - Set a trip budget target (default: ₹15,000).
  - Real-time gauge progress bar, remaining allowance, and over-budget alerts.
- **📱 Dual-Phone Sync (GitHub Pages Compatible)**:
  - **1-Tap WhatsApp Summary**: Generates a neatly formatted trip summary to send directly to Thannmay.
  - **Shareable Sync Link**: Generates a URL encoded with all trip expenses so the other phone merges them in 1 tap.
  - **JSON & Excel / CSV Export & Restore**: Keep backups safe.
- **👑 Mysore Dasara 2026 Guide & Companion**:
  - Mysore Palace Illumination timings (7:00 PM – 8:00 PM) and photo vantage points.
  - Authentic Food Trail: Hotel Vinayaka Mylari, Guru Sweets Mart, RRR Restaurant, Gayatri Tiffin Room.
  - Dussehra Spots: Chamundi Hills, Exhibition, Flower Show, Brindavan Gardens.
  - Bengaluru-Mysuru Expressway (NH 275) tips & pitstops.
- **Offline PWA Support**:
  - Installable to Android & iPhone home screens with offline caching so it works even without internet on the highway or in crowded palace grounds.

---

## 🚀 How to Host on GitHub Pages (Step-by-Step in 2 Minutes)

Because this app uses standard static web technologies with no Node.js build steps, deploying it to GitHub Pages is completely free and instant!

### Step 1: Initialize Git in this folder
Open your terminal (PowerShell or Bash) in this project folder:
```bash
cd "c:\Users\Avinash jain\OneDrive\Desktop\Mysuru Finance"
git init
git add .
git commit -m "Initial commit of Mysuru Dasara 2026 expense app"
```

### Step 2: Create a New GitHub Repository
1. Go to [GitHub.com](https://github.com) and click **New Repository** (e.g. name it `mysuru-finance` or `mysuru-dasara`).
2. Keep it **Public** (required for free GitHub Pages).
3. Do not initialize with README or license (you already have them).

### Step 3: Link and Push Code
Run the commands shown on GitHub:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/mysuru-finance.git
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. On your GitHub repository page, go to **Settings** (tab at the top right).
2. Click on **Pages** in the left sidebar (under "Code and automation").
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: Select `main` and folder `/ (root)`
4. Click **Save**.
5. Wait ~30 to 60 seconds. GitHub will display your live URL:
   ```
   https://<YOUR_GITHUB_USERNAME>.github.io/mysuru-finance/
   ```

Share this URL with **Thannmay**!

---

## 📲 How Avinash & Thannmay Use the App on the Trip

1. **Open the GitHub URL on both phones**:
   - On **Android (Chrome)**: Tap the 3 dots menu ➔ **"Add to Home screen"** or **"Install app"**.
   - On **iPhone (Safari)**: Tap the Share button ➔ **"Add to Home Screen"**.
2. **Switch Active User**:
   - In the top header, Avinash taps his name or Thannmay taps his name so expenses logged default to that person.
3. **Configure UPI IDs**:
   - Go to the **Settings** tab.
   - Enter your UPI IDs (e.g., `avinash@okhdfcbank` and `thannmay@ybl`).
   - Now the **Settle Up** tab will automatically generate dynamic UPI QR codes and 1-tap payment buttons!
4. **Syncing Between Phones**:
   - Whenever one of you enters a bunch of expenses, go to **Settings** ➔ Tap **"Copy Sync Link"** and send it on WhatsApp, or click **"Send WhatsApp Summary to Thannmay"**.
   - When the other person opens the link, the app will ask: *"Found expenses shared with you! Do you want to merge them?"* ➔ Click **Yes** and both phones stay 100% in sync!

---

## 📂 Project Structure

```
Mysuru Finance/
├── index.html          # Main application page with all tabs and modals
├── manifest.json       # Progressive Web App manifest
├── sw.js               # Service Worker for offline capabilities
├── README.md           # Instructions and deployment guide
├── css/
│   └── styles.css      # Royal Mysore gold & midnight navy responsive styles
└── js/
    ├── app.js          # Main app logic, tabs, forms, and event handling
    ├── state.js        # State store, profiles, LocalStorage persistence & merge
    ├── calculator.js   # Real-time expense math, split logic, and budget metrics
    ├── upi.js          # UPI Intent links and dynamic QR code generation
    ├── sync.js         # URL state sync, WhatsApp message generator & CSV/JSON export
    └── mysore-guide.js # Mysore Dasara 2026 itinerary, food trail & palace tips
```

---

Have a fantastic and memorable Dasara trip to Mysuru! 👑✨
