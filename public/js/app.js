// IronTrack Core Application Controller
// Optimized for iOS 15 Safari on iPhone 7 Plus (5.5" screen, 414px width)

class IronTrackApp {
  constructor() {
    this.activeTab = 'home';
    this.activeDate = this.getTodayDateString();
    this.userSettings = null;
    this.customFoods = [];
    this.selectedFoodForModal = null;
    this.activeMealForAdd = 'lunch';
    this.editingLogId = null;

    this.init();
  }

  getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async init() {
    await window.db.init();
    this.userSettings = await window.db.getSettings();
    this.customFoods = await window.db.getCustomFoods();

    this.initNavigation();
    this.initDateControls();
    this.initModals();
    this.initSettingsForm();

    // Initial render
    this.updateDateDisplay();
    await this.refreshDashboard();
  }

  // --- NAVIGATION (5 TABS) ---
  initNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update nav icons
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update tab view panels
    document.querySelectorAll('.tab-view').forEach(view => {
      if (view.id === `view-${tabName}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Specific tab triggers
    if (tabName === 'progress' && window.progressTracker) {
      window.progressTracker.loadProgressView();
    } else if (tabName === 'foodlog') {
      this.renderFoodLogView();
    } else if (tabName === 'home') {
      this.refreshDashboard();
    } else if (tabName === 'settings') {
      this.populateSettingsForm();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // --- DATE PICKER & NAVIGATION ---
  initDateControls() {
    const dateInput = document.getElementById('globalDateInput');
    const prevBtn = document.getElementById('prevDateBtn');
    const nextBtn = document.getElementById('nextDateBtn');
    const todayBtn = document.getElementById('todayDateBtn');

    if (dateInput) {
      dateInput.value = this.activeDate;
      dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          this.setActiveDate(e.target.value);
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.shiftActiveDate(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.shiftActiveDate(1);
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.setActiveDate(this.getTodayDateString());
      });
    }
  }

  shiftActiveDate(offsetDays) {
    const d = new Date(this.activeDate + 'T00:00:00');
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.setActiveDate(`${year}-${month}-${day}`);
  }

  setActiveDate(dateStr) {
    this.activeDate = dateStr;
    const dateInput = document.getElementById('globalDateInput');
    if (dateInput) dateInput.value = dateStr;
    this.updateDateDisplay();

    // Refresh current view
    if (this.activeTab === 'home') this.refreshDashboard();
    else if (this.activeTab === 'foodlog') this.renderFoodLogView();
    else if (this.activeTab === 'progress' && window.progressTracker) window.progressTracker.loadProgressView();
  }

  updateDateDisplay() {
    const label = document.getElementById('activeDateLabel');
    const todayStr = this.getTodayDateString();

    if (label) {
      if (this.activeDate === todayStr) {
        label.textContent = 'Today';
      } else {
        const d = new Date(this.activeDate + 'T00:00:00');
        const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        label.textContent = formatted;
      }
    }
  }

  // --- DASHBOARD & NUTRITION CALCULATIONS ---
  async refreshDashboard() {
    if (!this.userSettings) {
      this.userSettings = await window.db.getSettings();
    }

    const logs = await window.db.getFoodLogsByDate(this.activeDate);

    // Sum nutrients
    let calsConsumed = 0;
    let proConsumed = 0;
    let carbsConsumed = 0;
    let fatConsumed = 0;

    const mealsMap = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    logs.forEach(item => {
      calsConsumed += item.calories;
      proConsumed += item.protein;
      carbsConsumed += item.carbs;
      fatConsumed += item.fat;

      const mType = item.mealType || 'lunch';
      if (mealsMap[mType]) {
        mealsMap[mType].push(item);
      } else {
        mealsMap.lunch.push(item);
      }
    });

    const targetCals = this.userSettings.calorieTarget || 2500;
    const targetPro = this.userSettings.proteinTarget || 160;
    const targetCarbs = this.userSettings.carbsTarget || 280;
    const targetFat = this.userSettings.fatTarget || 65;

    const calsRemaining = targetCals - calsConsumed;
    const proRemaining = targetPro - proConsumed;

    // Render numbers on dashboard
    this.setElemText('dashCaloriesConsumed', calsConsumed);
    this.setElemText('dashCaloriesTarget', targetCals);
    this.setElemText('dashCaloriesRemaining', Math.abs(calsRemaining));

    const calRemLabel = document.getElementById('dashCaloriesRemLabel');
    if (calRemLabel) {
      calRemLabel.textContent = calsRemaining >= 0 ? 'calories left' : 'calories over target (bulking)';
      calRemLabel.className = calsRemaining >= 0 ? 'rem-label' : 'rem-label surplus';
    }

    this.setElemText('dashProteinConsumed', Math.round(proConsumed));
    this.setElemText('dashProteinTarget', targetPro);
    this.setElemText('dashProteinRemaining', Math.max(0, Math.round(proRemaining)));

    this.setElemText('dashCarbsConsumed', Math.round(carbsConsumed));
    this.setElemText('dashCarbsTarget', targetCarbs);

    this.setElemText('dashFatConsumed', Math.round(fatConsumed));
    this.setElemText('dashFatTarget', targetFat);

    // Render Progress Bars
    const calPct = Math.min(100, Math.round((calsConsumed / targetCals) * 100));
    const proPct = Math.min(100, Math.round((proConsumed / targetPro) * 100));
    const carbPct = Math.min(100, Math.round((carbsConsumed / targetCarbs) * 100));
    const fatPct = Math.min(100, Math.round((fatConsumed / targetFat) * 100));

    this.setBarWidth('barCaloriesFill', calPct);
    this.setBarWidth('barProteinFill', proPct);
    this.setBarWidth('barCarbsFill', carbPct);
    this.setBarWidth('barFatFill', fatPct);

    // Render meal cards on Dashboard
    this.renderDashboardMeals(mealsMap);
  }

  renderDashboardMeals(mealsMap) {
    const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    const titles = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snacks'
    };

    mealOrder.forEach(mealKey => {
      const items = mealsMap[mealKey] || [];
      const mealCals = items.reduce((sum, i) => sum + i.calories, 0);
      const mealPro = items.reduce((sum, i) => sum + i.protein, 0);

      this.setElemText(`dash_${mealKey}_cals`, mealCals);
      this.setElemText(`dash_${mealKey}_pro`, Math.round(mealPro * 10) / 10);

      const itemsListElem = document.getElementById(`dash_${mealKey}_items`);
      if (!itemsListElem) return;

      if (items.length === 0) {
        itemsListElem.innerHTML = `<div class="empty-meal-hint">No items logged yet</div>`;
      } else {
        itemsListElem.innerHTML = items.map(item => `
          <div class="meal-item-row" onclick="window.app.openEditFoodModal('${item.id}')">
            <div class="item-name-group">
              <span class="item-title">${this.escapeHtml(item.name)}</span>
              <span class="item-portion">${item.servingAmount} ${item.servingUnit} ${item.isAiEstimate ? '• <span class="ai-tag">AI</span>' : ''}</span>
            </div>
            <div class="item-macros">
              <span class="macro-cal">${item.calories} kcal</span>
              <span class="macro-pro">${Math.round(item.protein)}g pro</span>
            </div>
          </div>
        `).join('');
      }
    });
  }

  // --- DETAILED FOOD LOG VIEW ---
  async renderFoodLogView() {
    const logs = await window.db.getFoodLogsByDate(this.activeDate);
    const container = document.getElementById('foodLogMealContainers');
    if (!container) return;

    const mealsMap = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    logs.forEach(item => {
      const mType = item.mealType || 'lunch';
      if (mealsMap[mType]) mealsMap[mType].push(item);
      else mealsMap.lunch.push(item);
    });

    const mealDefs = [
      { key: 'breakfast', title: 'Breakfast', icon: '🍳' },
      { key: 'lunch', title: 'Lunch', icon: '🍗' },
      { key: 'dinner', title: 'Dinner', icon: '🍲' },
      { key: 'snack', title: 'Snacks & Supplements', icon: '🍌' }
    ];

    container.innerHTML = mealDefs.map(def => {
      const items = mealsMap[def.key] || [];
      const mealCals = items.reduce((s, i) => s + i.calories, 0);
      const mealPro = items.reduce((s, i) => s + i.protein, 0);

      return `
        <div class="meal-block-card">
          <div class="meal-block-header">
            <div class="meal-block-title">
              <span class="meal-icon">${def.icon}</span>
              <h3>${def.title}</h3>
            </div>
            <div class="meal-block-summary">
              <span class="mb-cals">${mealCals} kcal</span>
              <span class="mb-pro">${Math.round(mealPro * 10) / 10}g pro</span>
            </div>
          </div>

          <div class="meal-block-items">
            ${items.length === 0 ? `
              <div class="empty-block-state">No foods logged for this meal</div>
            ` : items.map(item => `
              <div class="food-log-item">
                <div class="fli-info" onclick="window.app.openEditFoodModal('${item.id}')">
                  <div class="fli-name">
                    ${this.escapeHtml(item.name)}
                    ${item.isAiEstimate ? '<span class="ai-tag">AI Estimate</span>' : ''}
                  </div>
                  <div class="fli-detail">
                    ${item.servingAmount} ${item.servingUnit} • ${item.calories} kcal • <strong>${item.protein}g protein</strong> • ${item.carbs}g C • ${item.fat}g F
                  </div>
                </div>
                <div class="fli-actions">
                  <button class="icon-action-btn" title="Edit" onclick="window.app.openEditFoodModal('${item.id}')">✏️</button>
                  <button class="icon-action-btn delete" title="Delete" onclick="window.app.deleteFoodEntry('${item.id}')">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="meal-block-footer">
            <button class="btn-subtle-add" onclick="window.app.openAddFoodModal('${def.key}')">
              <span>+ Add Food to ${def.title}</span>
            </button>
            ${items.length > 0 ? `
              <button class="btn-subtle-duplicate" title="Duplicate entire meal" onclick="window.app.promptDuplicateMeal('${def.key}')">
                <span>Copy Meal</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- FOOD SEARCH & LOG MODAL ---
  initModals() {
    // Search input listener
    const searchInput = document.getElementById('foodSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderFoodSearchResults(e.target.value);
      });
    }

    // Filter tags (All, Staples, Filipino, Favorites)
    document.querySelectorAll('.food-filter-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        document.querySelectorAll('.food-filter-tag').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.dataset.filter;
        this.applyFoodFilter(filter);
      });
    });

    // Close buttons for modals
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.style.display = 'none';
      });
    });

    // Serving amount & unit adjuster live calculation
    const amountInput = document.getElementById('servingAdjustAmount');
    const unitSelect = document.getElementById('servingAdjustUnit');

    if (amountInput) {
      amountInput.addEventListener('input', () => this.updateAdjusterNutritionPreview());
    }
    if (unitSelect) {
      unitSelect.addEventListener('change', () => this.updateAdjusterNutritionPreview());
    }
  }

  openAddFoodModal(mealType = 'lunch') {
    this.activeMealForAdd = mealType;
    this.editingLogId = null;

    const modal = document.getElementById('addFoodModal');
    const searchInput = document.getElementById('foodSearchInput');
    const mealSelect = document.getElementById('modalMealSelect');
    const adjuster = document.getElementById('foodAdjusterSection');

    if (mealSelect) mealSelect.value = mealType;
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 150);
    }
    if (adjuster) adjuster.style.display = 'none';

    this.renderFoodSearchResults('');
    if (modal) modal.style.display = 'flex';
  }

  async renderFoodSearchResults(query = '', filter = 'all') {
    const listElem = document.getElementById('foodSearchResultsList');
    if (!listElem) return;

    this.customFoods = await window.db.getCustomFoods();
    const favs = await window.db.getFavorites();
    const favIds = new Set(favs.map(f => f.foodId));

    let results = window.searchFoods(query, this.customFoods);

    // Apply category tag filter
    if (filter === 'staples') {
      results = results.filter(f => f.category === 'Protein Staples' || f.category === 'Carb Staples');
    } else if (filter === 'filipino') {
      results = results.filter(f => f.category === 'Filipino Favorites' || f.category === 'Carinderia Meals');
    } else if (filter === 'favorites') {
      results = results.filter(f => favIds.has(f.id));
    } else if (filter === 'custom') {
      results = results.filter(f => f.isCustom);
    }

    if (results.length === 0) {
      listElem.innerHTML = `
        <div class="empty-search-state">
          <p>No food items found matching "<strong>${this.escapeHtml(query)}</strong>"</p>
          <button class="btn-primary-sm" onclick="window.app.openCustomFoodModal('${this.escapeHtml(query)}')">
            + Create Custom Food
          </button>
        </div>
      `;
      return;
    }

    listElem.innerHTML = results.map(food => {
      const isFav = favIds.has(food.id);
      return `
        <div class="food-search-card" onclick="window.app.selectFoodForAdjuster('${food.id}')">
          <div class="fsc-left">
            <div class="fsc-name">
              ${this.escapeHtml(food.name)}
              ${food.isCustom ? '<span class="custom-badge">Custom</span>' : ''}
            </div>
            <div class="fsc-serving">
              Base: ${food.baseServingAmount} ${food.baseUnit} • ${food.category || 'General'}
            </div>
          </div>
          <div class="fsc-right">
            <div class="fsc-macros">
              <span class="fsc-cal">${food.calories} kcal</span>
              <span class="fsc-pro">${food.protein}g P</span>
            </div>
            <button class="star-fav-btn ${isFav ? 'starred' : ''}" 
              onclick="event.stopPropagation(); window.app.toggleFoodFavorite('${food.id}')"
              title="Favorite">★</button>
          </div>
        </div>
      `;
    }).join('');
  }

  applyFoodFilter(filter) {
    const searchInput = document.getElementById('foodSearchInput');
    const query = searchInput ? searchInput.value : '';
    this.renderFoodSearchResults(query, filter);
  }

  // Select food from list and show serving adjustment section
  selectFoodForAdjuster(foodId) {
    const all = [...this.customFoods, ...window.FOOD_DATABASE];
    const food = all.find(f => f.id === foodId);
    if (!food) return;

    this.selectedFoodForModal = food;

    const adjuster = document.getElementById('foodAdjusterSection');
    const nameElem = document.getElementById('adjusterFoodName');
    const amountInput = document.getElementById('servingAdjustAmount');
    const unitSelect = document.getElementById('servingAdjustUnit');

    if (nameElem) nameElem.textContent = food.name;
    if (amountInput) amountInput.value = food.baseServingAmount || 1;

    // Populate unit dropdown
    if (unitSelect) {
      const availableUnits = food.units && food.units.length > 0
        ? food.units
        : [{ unit: food.baseUnit || 'g', label: food.baseUnit || 'g', factor: 1 }];

      unitSelect.innerHTML = availableUnits.map(u => `
        <option value="${u.unit}" ${u.unit === food.baseUnit ? 'selected' : ''}>${u.label || u.unit}</option>
      `).join('');
    }

    this.updateAdjusterNutritionPreview();

    if (adjuster) {
      adjuster.style.display = 'block';
      adjuster.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  updateAdjusterNutritionPreview() {
    if (!this.selectedFoodForModal) return;

    const amountInput = document.getElementById('servingAdjustAmount');
    const unitSelect = document.getElementById('servingAdjustUnit');
    const amount = parseFloat(amountInput.value) || 0;
    const unit = unitSelect ? unitSelect.value : (this.selectedFoodForModal.baseUnit || 'g');

    const calculated = window.calculateNutrients(this.selectedFoodForModal, amount, unit);

    this.setElemText('adjusterCalVal', calculated.calories);
    this.setElemText('adjusterProVal', `${calculated.protein}g`);
    this.setElemText('adjusterCarbVal', `${calculated.carbs}g`);
    this.setElemText('adjusterFatVal', `${calculated.fat}g`);
  }

  // Commit selected food to log
  async commitAdjustedFoodToLog() {
    if (!this.selectedFoodForModal) return;

    const amountInput = document.getElementById('servingAdjustAmount');
    const unitSelect = document.getElementById('servingAdjustUnit');
    const mealSelect = document.getElementById('modalMealSelect');

    const amount = parseFloat(amountInput.value) || 1;
    const unit = unitSelect ? unitSelect.value : (this.selectedFoodForModal.baseUnit || 'g');
    const mealType = mealSelect ? mealSelect.value : this.activeMealForAdd;

    const nutrition = window.calculateNutrients(this.selectedFoodForModal, amount, unit);

    if (this.editingLogId) {
      // Update existing
      await window.db.updateFoodLog(this.editingLogId, {
        mealType: mealType,
        name: this.selectedFoodForModal.name,
        servingAmount: amount,
        servingUnit: unit,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat
      });
      this.showToast('Food entry updated!', 'success');
    } else {
      // Add new
      await window.db.addFoodLog({
        date: this.activeDate,
        mealType: mealType,
        name: this.selectedFoodForModal.name,
        servingAmount: amount,
        servingUnit: unit,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        isAiEstimate: false
      });
      this.showToast(`Logged ${this.selectedFoodForModal.name} (${amount} ${unit})!`, 'success');
    }

    // Close modal & refresh
    const modal = document.getElementById('addFoodModal');
    if (modal) modal.style.display = 'none';

    await this.refreshDashboard();
    if (this.activeTab === 'foodlog') this.renderFoodLogView();
  }

  // Edit an existing food log entry
  async openEditFoodModal(logId) {
    const logs = await window.db.getFoodLogsByDate(this.activeDate);
    const item = logs.find(l => l.id === logId);
    if (!item) return;

    this.editingLogId = logId;
    this.activeMealForAdd = item.mealType;

    // Construct mock food object for adjuster
    this.selectedFoodForModal = {
      id: item.id,
      name: item.name,
      baseServingAmount: item.servingAmount,
      baseUnit: item.servingUnit,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      units: [{ unit: item.servingUnit, factor: 1, label: item.servingUnit }]
    };

    const modal = document.getElementById('addFoodModal');
    const adjuster = document.getElementById('foodAdjusterSection');
    const mealSelect = document.getElementById('modalMealSelect');
    const nameElem = document.getElementById('adjusterFoodName');
    const amountInput = document.getElementById('servingAdjustAmount');
    const unitSelect = document.getElementById('servingAdjustUnit');

    if (mealSelect) mealSelect.value = item.mealType;
    if (nameElem) nameElem.textContent = item.name;
    if (amountInput) amountInput.value = item.servingAmount;

    if (unitSelect) {
      unitSelect.innerHTML = `<option value="${item.servingUnit}" selected>${item.servingUnit}</option>`;
    }

    this.updateAdjusterNutritionPreview();

    if (adjuster) adjuster.style.display = 'block';
    if (modal) modal.style.display = 'flex';
  }

  async deleteFoodEntry(id) {
    if (!confirm('Remove this food entry from your log?')) return;
    await window.db.deleteFoodLog(id);
    this.showToast('Entry removed', 'info');
    await this.refreshDashboard();
    if (this.activeTab === 'foodlog') this.renderFoodLogView();
  }

  async promptDuplicateMeal(mealType) {
    const targetDate = prompt(`Duplicate ${mealType.toUpperCase()} to another date (YYYY-MM-DD):`, this.getTodayDateString());
    if (!targetDate) return;

    try {
      const duplicated = await window.db.duplicateMeal(this.activeDate, mealType, targetDate.trim());
      this.showToast(`Copied ${duplicated.length} item(s) to ${targetDate}!`, 'success');
      if (targetDate === this.activeDate) {
        await this.refreshDashboard();
        if (this.activeTab === 'foodlog') this.renderFoodLogView();
      }
    } catch (e) {
      alert('Could not duplicate meal: ' + e.message);
    }
  }

  async toggleFoodFavorite(foodId) {
    const isNowFav = await window.db.toggleFavorite(foodId);
    this.showToast(isNowFav ? 'Saved to Favorites' : 'Removed from Favorites', 'info');
    const searchInput = document.getElementById('foodSearchInput');
    this.renderFoodSearchResults(searchInput ? searchInput.value : '');
  }

  // --- CUSTOM FOOD MODAL ---
  openCustomFoodModal(prefillName = '') {
    const modal = document.getElementById('customFoodModal');
    const nameInput = document.getElementById('cfNameInput');
    if (nameInput && prefillName) nameInput.value = prefillName;
    if (modal) modal.style.display = 'flex';
  }

  async saveCustomFoodForm(event) {
    event.preventDefault();

    const name = document.getElementById('cfNameInput').value.trim();
    const servingAmount = parseFloat(document.getElementById('cfServingAmountInput').value) || 100;
    const servingUnit = document.getElementById('cfServingUnitInput').value.trim() || 'g';
    const calories = parseFloat(document.getElementById('cfCaloriesInput').value) || 0;
    const protein = parseFloat(document.getElementById('cfProteinInput').value) || 0;
    const carbs = parseFloat(document.getElementById('cfCarbsInput').value) || 0;
    const fat = parseFloat(document.getElementById('cfFatInput').value) || 0;

    if (!name) {
      alert('Please enter a food name');
      return;
    }

    const saved = await window.db.saveCustomFood({
      name,
      baseServingAmount: servingAmount,
      baseUnit: servingUnit,
      calories,
      protein,
      carbs,
      fat,
      category: 'Custom Foods',
      units: [{ unit: servingUnit, factor: 1, label: `${servingAmount} ${servingUnit}` }]
    });

    this.showToast(`Custom food "${name}" saved!`, 'success');

    // Close custom modal and open adjuster with it
    const modal = document.getElementById('customFoodModal');
    if (modal) modal.style.display = 'none';

    this.customFoods = await window.db.getCustomFoods();
    this.selectFoodForAdjuster(saved.id);
  }

  // --- SETTINGS & MACRO CALCULATOR ---
  initSettingsForm() {
    const form = document.getElementById('settingsGoalsForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const settings = {
          calorieTarget: parseInt(document.getElementById('setCalorieTarget').value, 10) || 2500,
          proteinTarget: parseInt(document.getElementById('setProteinTarget').value, 10) || 160,
          carbsTarget: parseInt(document.getElementById('setCarbsTarget').value, 10) || 280,
          fatTarget: parseInt(document.getElementById('setFatTarget').value, 10) || 65,
          currentWeightKg: parseFloat(document.getElementById('setCurrentWeight').value) || 70,
          targetWeightKg: parseFloat(document.getElementById('setTargetWeight').value) || 74,
          goalType: document.getElementById('setGoalType').value
        };

        await window.db.saveSettings(settings);
        this.userSettings = settings;
        this.showToast('Nutrition goals updated!', 'success');
        await this.refreshDashboard();
      });
    }

    // Export JSON Backup
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        const backup = await window.db.exportAllData();
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IronTrack-Backup-${this.getTodayDateString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Backup JSON downloaded!', 'success');
      });
    }

    // Import JSON Backup
    const importInput = document.getElementById('importDataInput');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            await window.db.importAllData(data);
            this.userSettings = await window.db.getSettings();
            this.showToast('Backup restored successfully!', 'success');
            await this.refreshDashboard();
            this.populateSettingsForm();
          } catch (err) {
            alert('Failed to import backup: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  async populateSettingsForm() {
    this.userSettings = await window.db.getSettings();
    const s = this.userSettings;

    const setVal = (id, val) => {
      const elem = document.getElementById(id);
      if (elem) elem.value = val;
    };

    setVal('setCalorieTarget', s.calorieTarget);
    setVal('setProteinTarget', s.proteinTarget);
    setVal('setCarbsTarget', s.carbsTarget);
    setVal('setFatTarget', s.fatTarget);
    setVal('setCurrentWeight', s.currentWeightKg);
    setVal('setTargetWeight', s.targetWeightKg);
    setVal('setGoalType', s.goalType);
  }

  // Smart Macro Calculator Helper
  calculateRecommendedMacros() {
    const weight = parseFloat(document.getElementById('setCurrentWeight').value) || 70;
    const goalType = document.getElementById('setGoalType').value;

    // High protein rule of thumb: 2.0g - 2.2g per kg bodyweight
    const proteinGrams = Math.round(weight * 2.2);

    // Approximate Maintenance TDEE: weight * 32
    const maintenanceCals = Math.round(weight * 33);

    let targetCals = maintenanceCals;
    if (goalType === 'lean_bulk') {
      targetCals = maintenanceCals + 300; // Lean surplus
    } else if (goalType === 'fat_loss') {
      targetCals = maintenanceCals - 400; // Modest deficit
    }

    // Fat: ~0.9g per kg bodyweight
    const fatGrams = Math.round(weight * 0.9);

    // Carbs: Remaining calories (1g P = 4 kcal, 1g F = 9 kcal, 1g C = 4 kcal)
    const proCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remCals = Math.max(0, targetCals - proCals - fatCals);
    const carbsGrams = Math.round(remCals / 4);

    const setVal = (id, val) => {
      const elem = document.getElementById(id);
      if (elem) elem.value = val;
    };

    setVal('setCalorieTarget', targetCals);
    setVal('setProteinTarget', proteinGrams);
    setVal('setCarbsTarget', carbsGrams);
    setVal('setFatTarget', fatGrams);

    this.showToast(`Calculated: ${targetCals} kcal / ${proteinGrams}g Protein! Review & Save below.`, 'info');
  }

  // Toast notification helper
  showToast(message, type = 'info') {
    const toast = document.getElementById('appToast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `app-toast toast-${type} show`;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.className = 'app-toast';
    }, 2800);
  }

  // Safe DOM utilities
  setElemText(id, val) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = val;
  }

  setBarWidth(id, pct) {
    const elem = document.getElementById(id);
    if (elem) elem.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Global bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.app = new IronTrackApp();
});
