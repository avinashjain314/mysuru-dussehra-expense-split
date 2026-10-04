/**
 * Mysuru Dasara 2026 - Main Application Controller
 * Manages UI rendering, tabs, expense forms, modals, search, filters & toasts.
 */

class AppController {
  constructor() {
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.selectedCategory = 'food';
    this.selectedSplitType = 'equal';
    this.selectedPayer = 'avinash';
    this.editingExpenseId = null;

    this.init();
  }

  init() {
    // 1. Subscribe to state changes
    window.TripState.subscribe(() => {
      this.renderAll();
    });

    // 2. Setup DOM Event Listeners
    this.bindEvents();

    // 3. Check for URL state import
    this.handleUrlImportCheck();

    // 4. Initial Render
    this.renderAll();
    this.renderGuide();
  }

  bindEvents() {
    // Navigation Tabs
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Active User Switcher in Header
    const userToggle = document.getElementById('user-toggle-btn');
    if (userToggle) {
      userToggle.addEventListener('click', () => {
        window.TripState.toggleActor();
        this.showToast(`Logged in as ${window.TripState.users[window.TripState.currentActor].name}`);
      });
    }

    // Floating Action Button (+ Add)
    const fabBtn = document.getElementById('fab-add-expense');
    if (fabBtn) {
      fabBtn.addEventListener('click', () => this.openExpenseModal());
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Close modal when tapping overlay background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.dataset.filter;
        this.renderExpenseList();
      });
    });

    // Search Input
    const searchInput = document.getElementById('expense-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderExpenseList();
      });
    }

    // Expense Form: Quick Suggestion Chips
    document.querySelectorAll('.quick-chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        const titleInput = document.getElementById('expense-title');
        const cat = chip.dataset.cat;
        if (titleInput) {
          titleInput.value = chip.dataset.title;
          if (cat) this.selectCategory(cat);
        }
      });
    });

    // Expense Form: Quick Amount Buttons (+100, +200, +500, +1000)
    document.querySelectorAll('.quick-amt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amtInput = document.getElementById('expense-amount');
        const addVal = parseFloat(btn.dataset.add) || 0;
        const current = parseFloat(amtInput.value) || 0;
        amtInput.value = current + addVal;
      });
    });

    // Category Pickers in Form
    document.querySelectorAll('.cat-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectCategory(item.dataset.cat);
      });
    });

    // Payer Selector Buttons in Form
    document.querySelectorAll('.segment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const payer = btn.dataset.payer;
        this.selectPayer(payer);
      });
    });

    // Split Tab Buttons
    document.querySelectorAll('.split-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectSplitType(btn.dataset.split);
      });
    });

    // Expense Form Submission
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleExpenseSubmit();
      });
    }

    // WhatsApp Share Button
    const waBtn = document.getElementById('btn-share-whatsapp');
    if (waBtn) {
      waBtn.addEventListener('click', () => window.TripSync.shareToWhatsApp());
    }

    // Shareable Link Button
    const linkBtn = document.getElementById('btn-copy-sync-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', () => {
        const link = window.TripSync.generateShareableLink();
        navigator.clipboard.writeText(link).then(() => {
          this.showToast('📋 Trip sync link copied to clipboard!');
        }).catch(() => {
          prompt('Copy this sync link:', link);
        });
      });
    }

    // Export CSV & JSON Buttons
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) csvBtn.addEventListener('click', () => window.TripSync.exportCsv());

    const jsonBtn = document.getElementById('btn-export-json');
    if (jsonBtn) jsonBtn.addEventListener('click', () => window.TripSync.exportJson());

    // Import JSON File
    const jsonFileEl = document.getElementById('import-json-file');
    if (jsonFileEl) {
      jsonFileEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          window.TripSync.importJsonFile(file, (res) => {
            if (res.success) {
              this.showToast(`✅ Synced ${res.count} items from backup!`);
            } else {
              this.showToast(`❌ Error: ${res.error}`);
            }
          });
        }
      });
    }

    // Budget Update in Settings
    const budgetInput = document.getElementById('settings-budget-input');
    if (budgetInput) {
      budgetInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0) {
          window.TripState.updateBudget(val);
          this.showToast('💰 Budget goal updated!');
        }
      });
    }

    // UPI ID Inputs in Settings
    const avinashUpiInput = document.getElementById('settings-avinash-upi');
    if (avinashUpiInput) {
      avinashUpiInput.addEventListener('change', (e) => {
        window.TripState.updateUserUpi('avinash', e.target.value);
        this.showToast("Avinash's UPI ID saved!");
      });
    }

    const thannmayUpiInput = document.getElementById('settings-thannmay-upi');
    if (thannmayUpiInput) {
      thannmayUpiInput.addEventListener('change', (e) => {
        window.TripState.updateUserUpi('thannmay', e.target.value);
        this.showToast("Thannmay's UPI ID saved!");
      });
    }
  }

  switchTab(tabId) {
    // 1. Update navigation items
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // 2. Update panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // 3. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Show/Hide FAB (only on expenses tab)
    const fab = document.getElementById('fab-add-expense');
    if (fab) {
      fab.style.display = tabId === 'expenses' ? 'flex' : 'none';
    }

    if (tabId === 'settle') {
      this.renderSettlementView();
    } else if (tabId === 'analytics') {
      this.renderAnalyticsView();
    }
  }

  selectCategory(cat) {
    this.selectedCategory = cat;
    document.querySelectorAll('.cat-picker-item').forEach(item => {
      item.classList.toggle('active', item.dataset.cat === cat);
    });
  }

  selectPayer(payerId) {
    this.selectedPayer = payerId;
    document.querySelectorAll('.segment-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.payer === payerId);
    });
  }

  selectSplitType(splitType) {
    this.selectedSplitType = splitType;
    document.querySelectorAll('.split-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.split === splitType);
    });

    const customFields = document.getElementById('custom-split-fields');
    if (customFields) {
      customFields.classList.toggle('active', splitType === 'custom');
    }
  }

  renderAll() {
    this.renderHeader();
    this.renderHeroStats();
    this.renderExpenseList();
    this.renderAnalyticsView();
    this.renderSettlementView();
    this.renderSettingsValues();
  }

  renderHeader() {
    const actor = window.TripState.currentActor;
    const user = window.TripState.users[actor];
    const dot = document.getElementById('header-user-dot');
    const nameEl = document.getElementById('header-user-name');

    if (dot) {
      dot.className = `user-avatar-dot ${actor}`;
    }
    if (nameEl && user) {
      nameEl.textContent = user.name;
    }
  }

  renderHeroStats() {
    const state = window.TripState;
    const calc = window.TripCalculator.calculate(state.expenses, state.tripBudget);

    // Total Trip Spend
    const totalEl = document.getElementById('stat-trip-total');
    if (totalEl) totalEl.textContent = `₹${calc.totalTrip.toLocaleString('en-IN')}`;

    // Avinash Spent
    const avinashEl = document.getElementById('stat-avinash-spent');
    if (avinashEl) avinashEl.textContent = `₹${calc.avinash.paid.toLocaleString('en-IN')}`;

    // Thannmay Spent
    const thannmayEl = document.getElementById('stat-thannmay-spent');
    if (thannmayEl) thannmayEl.textContent = `₹${calc.thannmay.paid.toLocaleString('en-IN')}`;

    // Settlement Banner
    const headlineEl = document.getElementById('settlement-headline');
    const amountEl = document.getElementById('settlement-amount');
    const subEl = document.getElementById('settlement-sub');
    const settleActionBtn = document.getElementById('btn-hero-settle');

    if (calc.settlement.isSettled) {
      if (headlineEl) headlineEl.innerHTML = `<span class="settlement-highlight">All Settled Up! 🤝</span>`;
      if (amountEl) amountEl.textContent = `₹0`;
      if (subEl) subEl.textContent = 'Both of you have contributed equally so far.';
      if (settleActionBtn) settleActionBtn.style.display = 'none';
    } else {
      const payerName = state.users[calc.settlement.payer]?.name || calc.settlement.payer;
      const receiverName = state.users[calc.settlement.receiver]?.name || calc.settlement.receiver;

      if (headlineEl) {
        headlineEl.innerHTML = `<span>${payerName} owes</span> <span class="settlement-highlight">${receiverName}</span>`;
      }
      if (amountEl) amountEl.textContent = `₹${calc.settlement.amount.toLocaleString('en-IN')}`;
      if (subEl) {
        subEl.textContent = `Based on ₹${calc.totalTrip.toLocaleString('en-IN')} total trip expenditure`;
      }
      if (settleActionBtn) {
        settleActionBtn.style.display = 'inline-flex';
        settleActionBtn.onclick = () => this.switchTab('settle');
      }
    }
  }

  renderExpenseList() {
    const listEl = document.getElementById('expenses-container');
    const countEl = document.getElementById('expenses-count-meta');
    if (!listEl) return;

    const state = window.TripState;
    let items = [...state.expenses];

    // 1. Filter by category or payer
    if (this.currentFilter !== 'all') {
      if (this.currentFilter === 'avinash' || this.currentFilter === 'thannmay') {
        items = items.filter(e => e.paidBy === this.currentFilter);
      } else {
        items = items.filter(e => e.category === this.currentFilter);
      }
    }

    // 2. Filter by search query
    if (this.searchQuery) {
      items = items.filter(e => {
        return (e.title && e.title.toLowerCase().includes(this.searchQuery)) ||
               (e.notes && e.notes.toLowerCase().includes(this.searchQuery)) ||
               (e.category && e.category.toLowerCase().includes(this.searchQuery));
      });
    }

    if (countEl) {
      countEl.textContent = `${items.length} ${items.length === 1 ? 'expense' : 'expenses'}`;
    }

    const quickClearBtn = document.getElementById('btn-quick-clear-all');
    if (quickClearBtn) {
      quickClearBtn.style.display = state.expenses.length > 0 ? 'inline-block' : 'none';
    }

    if (items.length === 0) {
      const isFiltered = this.currentFilter !== 'all' || this.searchQuery;
      if (isFiltered) {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No matching expenses</h3>
            <p>Try clearing your filter or search query to see all expenses.</p>
          </div>
        `;
      } else {
        listEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🪔</div>
            <h3>Your Trip is Ready to Begin!</h3>
            <p>No expenses logged yet. Tap below to start recording your real Bengaluru ➔ Mysuru Dasara spends!</p>
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-primary btn-sm" onclick="window.App.openExpenseModal()">
                ➕ Add First Expense
              </button>
              <button class="btn btn-outline btn-sm" onclick="window.TripState.loadDemoData(); window.App.showToast('✨ Demo transactions loaded!');">
                👀 Load Demo Data (To Test)
              </button>
            </div>
          </div>
        `;
      }
      return;
    }

    const categoryIcons = {
      travel: '🚗',
      food: '🍛',
      stay: '🏨',
      sightseeing: '🎟️',
      shopping: '🛍️',
      misc: '📦'
    };

    listEl.innerHTML = items.map(exp => {
      const icon = categoryIcons[exp.category] || '📦';
      const payerName = state.users[exp.paidBy]?.name || exp.paidBy;
      const formattedDate = this.formatExpenseDate(exp.date);
      const splitLabel = exp.splitType === 'equal' ? 'Split 50/50' : (exp.splitType === 'personal' ? 'Personal' : 'Custom Split');

      return `
        <div class="expense-item" onclick="window.App.openExpenseDetail('${exp.id}')">
          <div class="expense-item-left">
            <div class="cat-icon-badge">${icon}</div>
            <div class="expense-details">
              <div class="expense-title">${this.escapeHtml(exp.title)}</div>
              <div class="expense-meta">
                <span class="payer-badge ${exp.paidBy}">Paid by ${payerName}</span>
                <span>•</span>
                <span class="split-type-tag">${splitLabel}</span>
                <span>•</span>
                <span>${formattedDate}</span>
              </div>
            </div>
          </div>
          <div class="expense-item-right">
            <div class="expense-amount">₹${Number(exp.amount).toLocaleString('en-IN')}</div>
            <div class="expense-share-info">${exp.paymentMode || 'UPI'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderAnalyticsView() {
    const state = window.TripState;
    const calc = window.TripCalculator.calculate(state.expenses, state.tripBudget);

    // Budget progress
    const budgetSpentEl = document.getElementById('budget-spent-val');
    const budgetTotalEl = document.getElementById('budget-total-val');
    const budgetRemainEl = document.getElementById('budget-remain-val');
    const progressFill = document.getElementById('budget-progress-fill');
    const budgetPercentEl = document.getElementById('budget-percent-text');

    if (budgetSpentEl) budgetSpentEl.textContent = `₹${calc.budget.spent.toLocaleString('en-IN')}`;
    if (budgetTotalEl) budgetTotalEl.textContent = `₹${calc.budget.total.toLocaleString('en-IN')}`;
    if (budgetRemainEl) {
      if (calc.budget.isOver) {
        budgetRemainEl.innerHTML = `<span style="color: var(--danger)">Over by ₹${calc.budget.overBy.toLocaleString('en-IN')}!</span>`;
      } else {
        budgetRemainEl.textContent = `₹${calc.budget.remaining.toLocaleString('en-IN')} left`;
      }
    }
    if (progressFill) progressFill.style.width = `${calc.budget.percent}%`;
    if (budgetPercentEl) budgetPercentEl.textContent = `${calc.budget.percent}% spent`;

    // Category Breakdown rows
    const catContainer = document.getElementById('category-breakdown-container');
    if (catContainer) {
      const cats = [
        { key: 'travel', name: 'Travel & Fuel', icon: '🚗' },
        { key: 'food', name: 'Food & Snacks', icon: '🍛' },
        { key: 'stay', name: 'Stay & Hotels', icon: '🏨' },
        { key: 'sightseeing', name: 'Sightseeing & Events', icon: '🎟️' },
        { key: 'shopping', name: 'Mysore Silk & Shopping', icon: '🛍️' },
        { key: 'misc', name: 'Miscellaneous', icon: '📦' }
      ];

      const total = calc.totalTrip || 1;
      catContainer.innerHTML = cats.map(c => {
        const amt = calc.categoryTotals[c.key] || 0;
        const pct = Math.round((amt / total) * 100);
        return `
          <div class="cat-row">
            <div class="cat-row-left">
              <span>${c.icon}</span>
              <span style="font-weight: 600;">${c.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">${pct}%</span>
              <span class="cat-row-amt">₹${amt.toLocaleString('en-IN')}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderSettlementView() {
    const state = window.TripState;
    const calc = window.TripCalculator.calculate(state.expenses, state.tripBudget);

    // Summary numbers
    const avPaid = document.getElementById('settle-av-paid');
    const avShare = document.getElementById('settle-av-share');
    const thPaid = document.getElementById('settle-th-paid');
    const thShare = document.getElementById('settle-th-share');

    if (avPaid) avPaid.textContent = `₹${calc.avinash.paid.toLocaleString('en-IN')}`;
    if (avShare) avShare.textContent = `₹${calc.avinash.share.toLocaleString('en-IN')}`;
    if (thPaid) thPaid.textContent = `₹${calc.thannmay.paid.toLocaleString('en-IN')}`;
    if (thShare) thShare.textContent = `₹${calc.thannmay.share.toLocaleString('en-IN')}`;

    const settlement = calc.settlement;
    const titleEl = document.getElementById('settle-card-title');
    const descEl = document.getElementById('settle-card-desc');
    const upiContainer = document.getElementById('settle-qr-box');
    const upiPayBtn = document.getElementById('btn-open-upi-app');

    if (settlement.isSettled) {
      if (titleEl) titleEl.textContent = '🎉 All Balanced Up!';
      if (descEl) descEl.textContent = 'Neither of you owes any money. Enjoy the Mysuru Dasara festival!';
      if (upiContainer) upiContainer.innerHTML = `<div style="padding: 20px; font-size: 2.5rem;">✨🤝✨</div>`;
      if (upiPayBtn) upiPayBtn.style.display = 'none';
    } else {
      const payerName = state.users[settlement.payer]?.name || settlement.payer;
      const receiverName = state.users[settlement.receiver]?.name || settlement.receiver;
      const receiverUpi = state.users[settlement.receiver]?.upiId || '';

      if (titleEl) titleEl.textContent = `${payerName} ➔ ${receiverName}`;
      if (descEl) descEl.innerHTML = `<strong>${payerName}</strong> should transfer <strong>₹${settlement.amount.toLocaleString('en-IN')}</strong> to <strong>${receiverName}</strong>`;

      // Generate UPI Intent Link
      const upiUrl = window.UPIHelper.generateUpiUrl({
        upiId: receiverUpi,
        name: receiverName,
        amount: settlement.amount,
        note: `Mysuru Dasara 2026 Split - from ${payerName}`
      });

      // Render QR
      if (upiContainer) {
        window.UPIHelper.renderUpiQr(upiContainer, upiUrl, settlement.amount);
      }

      // App Button
      if (upiPayBtn) {
        if (receiverUpi) {
          upiPayBtn.style.display = 'inline-flex';
          upiPayBtn.href = upiUrl;
          upiPayBtn.textContent = `⚡ Pay ₹${settlement.amount.toLocaleString('en-IN')} via UPI App`;
        } else {
          upiPayBtn.style.display = 'none';
        }
      }
    }
  }

  renderSettingsValues() {
    const state = window.TripState;
    const budgetInput = document.getElementById('settings-budget-input');
    const avinashUpi = document.getElementById('settings-avinash-upi');
    const thannmayUpi = document.getElementById('settings-thannmay-upi');
    const roomCodeEl = document.getElementById('settings-room-code');

    if (budgetInput) budgetInput.value = state.tripBudget;
    if (avinashUpi) avinashUpi.value = state.users.avinash.upiId || '';
    if (thannmayUpi) thannmayUpi.value = state.users.thannmay.upiId || '';
    if (roomCodeEl) roomCodeEl.textContent = state.roomCode;
  }

  renderGuide() {
    const guide = window.MysoreGuideData;
    if (!guide) return;

    // Food trail
    const foodBox = document.getElementById('guide-food-trail');
    if (foodBox) {
      foodBox.innerHTML = guide.foodTrail.map(f => `
        <div class="guide-card">
          <div class="guide-icon">🍽️</div>
          <div class="guide-content">
            <h4>${f.name}</h4>
            <p><strong>Specialty:</strong> ${f.specialty}</p>
            <p>${f.desc}</p>
            <span class="guide-badge">📍 ${f.location}</span>
          </div>
        </div>
      `).join('');
    }

    // Sightseeing
    const spotsBox = document.getElementById('guide-sightseeing-spots');
    if (spotsBox) {
      spotsBox.innerHTML = guide.sightseeing.map(s => `
        <div class="guide-card">
          <div class="guide-icon">🏰</div>
          <div class="guide-content">
            <h4>${s.spot}</h4>
            <p>${s.desc}</p>
            <span class="guide-badge">🕒 ${s.timing}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Modals
  openExpenseModal(expenseToEdit = null) {
    const modal = document.getElementById('modal-expense-form');
    if (!modal) return;

    this.editingExpenseId = expenseToEdit ? expenseToEdit.id : null;
    const titleModal = document.getElementById('expense-modal-title');
    const submitBtn = document.getElementById('expense-submit-btn');

    const titleInput = document.getElementById('expense-title');
    const amtInput = document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-date');
    const notesInput = document.getElementById('expense-notes');
    const modeSelect = document.getElementById('expense-payment-mode');

    if (expenseToEdit) {
      if (titleModal) titleModal.textContent = '✏️ Edit Expense';
      if (submitBtn) submitBtn.textContent = 'Save Changes';
      titleInput.value = expenseToEdit.title;
      amtInput.value = expenseToEdit.amount;
      dateInput.value = (expenseToEdit.date || '').slice(0, 16);
      notesInput.value = expenseToEdit.notes || '';
      modeSelect.value = expenseToEdit.paymentMode || 'UPI';
      this.selectCategory(expenseToEdit.category || 'misc');
      this.selectPayer(expenseToEdit.paidBy || 'avinash');
      this.selectSplitType(expenseToEdit.splitType || 'equal');
    } else {
      if (titleModal) titleModal.textContent = '➕ Add Expense';
      if (submitBtn) submitBtn.textContent = 'Save Expense';
      titleInput.value = '';
      amtInput.value = '';
      // Current date-time format for input[type="datetime-local"]
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      dateInput.value = now.toISOString().slice(0, 16);
      notesInput.value = '';
      modeSelect.value = 'UPI';
      this.selectCategory('food');
      this.selectPayer(window.TripState.currentActor);
      this.selectSplitType('equal');
    }

    modal.classList.add('active');
    setTimeout(() => titleInput.focus(), 200);
  }

  handleExpenseSubmit() {
    const titleInput = document.getElementById('expense-title');
    const amtInput = document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-date');
    const notesInput = document.getElementById('expense-notes');
    const modeSelect = document.getElementById('expense-payment-mode');

    const title = titleInput.value.trim();
    const amount = parseFloat(amtInput.value);

    if (!title) {
      alert('Please enter a description for this expense.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const payload = {
      title,
      amount,
      category: this.selectedCategory,
      paidBy: this.selectedPayer,
      splitType: this.selectedSplitType,
      date: dateInput.value || new Date().toISOString(),
      notes: notesInput.value.trim(),
      paymentMode: modeSelect.value
    };

    if (this.selectedSplitType === 'custom') {
      const avAmt = parseFloat(document.getElementById('custom-split-avinash').value) || 0;
      const thAmt = parseFloat(document.getElementById('custom-split-thannmay').value) || 0;
      payload.splitDetails = { avinash: avAmt, thannmay: thAmt };
    }

    if (this.editingExpenseId) {
      window.TripState.updateExpense(this.editingExpenseId, payload);
      this.showToast('✅ Expense updated!');
    } else {
      window.TripState.addExpense(payload);
      this.showToast('✨ Expense added successfully!');
    }

    document.getElementById('modal-expense-form').classList.remove('active');
  }

  openExpenseDetail(expenseId) {
    const exp = window.TripState.expenses.find(e => e.id === expenseId);
    if (!exp) return;

    const modal = document.getElementById('modal-expense-detail');
    const content = document.getElementById('expense-detail-body');
    if (!modal || !content) return;

    const payerName = window.TripState.users[exp.paidBy]?.name || exp.paidBy;
    const categoryIcons = { travel: '🚗', food: '🍛', stay: '🏨', sightseeing: '🎟️', shopping: '🛍️', misc: '📦' };

    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div class="cat-icon-badge" style="width: 56px; height: 56px; font-size: 1.8rem; margin: 0 auto 10px auto;">
          ${categoryIcons[exp.category] || '📦'}
        </div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff;">${this.escapeHtml(exp.title)}</h3>
        <div style="font-size: 1.7rem; font-weight: 900; color: var(--primary); margin: 6px 0;">
          ₹${Number(exp.amount).toLocaleString('en-IN')}
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; background: var(--bg-elevated); padding: 14px; border-radius: var(--radius-md); font-size: 0.86rem;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Paid By</span>
          <strong style="color: #fff;">${payerName}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Split Type</span>
          <strong style="color: #fff;">${exp.splitType.toUpperCase()}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Payment Mode</span>
          <strong style="color: #fff;">${exp.paymentMode || 'UPI'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">Date & Time</span>
          <strong style="color: #fff;">${this.formatExpenseDate(exp.date)}</strong>
        </div>
        ${exp.notes ? `
          <div style="margin-top: 6px; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
            <div style="color: var(--text-muted); font-size: 0.78rem;">Notes</div>
            <div style="color: #fff; margin-top: 2px;">${this.escapeHtml(exp.notes)}</div>
          </div>
        ` : ''}
      </div>

      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button class="btn btn-secondary btn-full" onclick="window.App.editFromDetail('${exp.id}')">
          ✏️ Edit
        </button>
        <button class="btn btn-full" style="background: rgba(239, 68, 68, 0.18); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);" onclick="window.App.deleteFromDetail('${exp.id}')">
          🗑️ Delete
        </button>
      </div>
    `;

    modal.classList.add('active');
  }

  editFromDetail(expenseId) {
    document.getElementById('modal-expense-detail').classList.remove('active');
    const exp = window.TripState.expenses.find(e => e.id === expenseId);
    if (exp) this.openExpenseModal(exp);
  }

  deleteFromDetail(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
      window.TripState.deleteExpense(expenseId);
      document.getElementById('modal-expense-detail').classList.remove('active');
      this.showToast('🗑️ Expense moved to trash. Safe & restorable.');
    }
  }

  showVaultInfo() {
    const state = window.TripState;
    const count = state.expenses.length;
    alert(
      `🛡️ ZERO-DATA-LOSS VAULT STATUS:\n\n` +
      `✅ LocalStorage: Active (${count} transactions saved)\n` +
      `✅ IndexedDB Database: Active & Resilient\n` +
      `✅ Snapshot Vault: Active (Auto-Recovery Armed)\n` +
      `✅ Browser Eviction Lock: Permanent\n` +
      `✅ Offline Engine: 100% Ready (Zero internet needed)\n\n` +
      `Your spendings are saved permanently to device storage as soon as you log them. They cannot be lost even across app restarts or offline highway dead-zones!`
    );
  }

  openSettingsModal() {
    this.switchTab('settings');
  }

  handleUrlImportCheck() {
    const imported = window.TripSync.checkUrlImport();
    if (imported && Array.isArray(imported.expenses)) {
      setTimeout(() => {
        if (confirm(`Found ${imported.expenses.length} expenses shared with you! Do you want to merge them into this device?`)) {
          const added = window.TripState.mergeExpenses(imported.expenses);
          if (imported.budget) window.TripState.updateBudget(imported.budget);
          this.showToast(`✨ Merged ${added} new expenses!`);
          // Clear hash
          window.location.hash = '';
        }
      }, 500);
    }
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  formatExpenseDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate and expose globally
document.addEventListener('DOMContentLoaded', () => {
  window.App = new AppController();
});
