// IronTrack AI Food Scanner
// Optimized for iOS 15 Safari camera capture and client-side canvas resizing

class FoodScanner {
  constructor() {
    this.currentImageBase64 = null;
    this.scannedItems = []; // Array of detected food items
    this.selectedMealType = 'lunch';
    this.initEventListeners();
  }

  initEventListeners() {
    const cameraInput = document.getElementById('cameraInput');
    const galleryInput = document.getElementById('galleryInput');

    if (cameraInput) {
      cameraInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
    if (galleryInput) {
      galleryInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }
  }

  // Handle selected image from camera or library
  async handleFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Reset input value so user can take photo again with same file name
    event.target.value = '';

    try {
      this.showScanningState(true);
      // Resize on canvas to 1280px max for speed and memory efficiency on iOS 15 Safari
      const resizedBase64 = await this.resizeImage(file, 1280, 0.85);
      this.currentImageBase64 = resizedBase64;

      // Update image preview
      const previewImg = document.getElementById('scannerPreviewImg');
      if (previewImg) {
        previewImg.src = resizedBase64;
        previewImg.style.display = 'block';
      }

      // Check online status
      if (!navigator.onLine) {
        this.handleScanError(
          'You are currently offline. AI photo scanning requires an internet connection.',
          true // allow manual entry
        );
        return;
      }

      await this.sendToVisionApi(resizedBase64);
    } catch (err) {
      console.error('Scan capture error:', err);
      this.handleScanError(err.message || 'Could not process photo.', true);
    }
  }

  // Client-side image resize via HTML5 Canvas (Safari 15 friendly)
  resizeImage(file, maxDimension, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG base64
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image into canvas'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read photo file'));
      reader.readAsDataURL(file);
    });
  }

  // Send resized base64 image to backend Express API
  async sendToVisionApi(base64Data) {
    const statusText = document.getElementById('scannerStatusText');
    if (statusText) statusText.textContent = 'Analyzing food, estimating protein & calories...';

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'NO_API_KEY') {
          this.handleScanError(
            'Backend AI Vision key not configured. Add GEMINI_API_KEY to .env on the server.',
            true
          );
        } else {
          this.handleScanError(data.message || 'Vision analysis failed.', true);
        }
        return;
      }

      this.displayResults(data);
    } catch (error) {
      console.error('API Fetch error:', error);
      this.handleScanError('Failed to connect to scan server. Ensure server is running.', true);
    }
  }

  // Render scan results with interactive multi-item selection and adjustments
  displayResults(data) {
    this.showScanningState(false);

    const resultsContainer = document.getElementById('scannerResultsContainer');
    const idleContainer = document.getElementById('scannerIdleContainer');
    const loadingContainer = document.getElementById('scannerLoadingContainer');

    if (idleContainer) idleContainer.style.display = 'none';
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'block';

    // Store scanned items
    this.scannedItems = (data.foods || []).map((food, index) => ({
      ...food,
      selected: true,
      originalGrams: food.estimatedWeightGrams || 100,
      currentGrams: food.estimatedWeightGrams || 100,
      baseCalories: food.calories,
      baseProtein: food.protein,
      baseCarbs: food.carbs,
      baseFat: food.fat
    }));

    // Update meal summary
    const summaryElem = document.getElementById('scannerMealSummary');
    if (summaryElem) summaryElem.textContent = data.summary || 'Detected Food Items';

    this.renderScannedItemList();
    this.updateResultsTotalSummary();
  }

  // Render editable list of recognized food items
  renderScannedItemList() {
    const listElem = document.getElementById('scannedItemsList');
    if (!listElem) return;

    if (this.scannedItems.length === 0) {
      listElem.innerHTML = `<div class="empty-state-card">No specific food items identified. You can enter food details manually.</div>`;
      return;
    }

    listElem.innerHTML = this.scannedItems.map((item, index) => `
      <div class="scanned-food-card ${item.selected ? 'active' : 'deselected'}" id="scanned_card_${index}">
        <div class="scanned-food-header">
          <label class="custom-checkbox-container">
            <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="window.scanner.toggleItemSelection(${index}, this.checked)">
            <span class="checkmark"></span>
            <span class="scanned-food-title-display" id="title_display_${index}">${this.escapeHtml(item.name)}</span>
          </label>
          <span class="confidence-badge ${item.confidence || 'medium'}">${(item.confidence || 'medium').toUpperCase()} CONFIDENCE</span>
        </div>

        <div class="scanned-food-body">
          <div class="scanned-input-row">
            <div class="input-col">
              <label class="field-label">Food Name</label>
              <input type="text" class="styled-input-sm" value="${this.escapeHtml(item.name)}" 
                oninput="window.scanner.updateItemName(${index}, this.value)">
            </div>
            <div class="input-col" style="max-width: 130px;">
              <label class="field-label">Est. Weight (g)</label>
              <div class="input-unit-group">
                <input type="number" class="styled-input-sm" value="${item.currentGrams}" min="1" max="2000"
                  oninput="window.scanner.updateItemGrams(${index}, this.value)">
                <span class="unit-suffix">g</span>
              </div>
            </div>
          </div>

          <div class="serving-hint-text">
            <span>Serving: ${this.escapeHtml(item.serving || '1 portion')}</span>
            ${item.notes ? `<span>• ${this.escapeHtml(item.notes)}</span>` : ''}
          </div>

          <!-- Live Nutrient Chips for this item -->
          <div class="macro-chips-row">
            <div class="macro-chip cal">
              <span class="chip-val" id="chip_cal_${index}">${item.calories}</span>
              <span class="chip-lbl">kcal</span>
            </div>
            <div class="macro-chip pro">
              <span class="chip-val" id="chip_pro_${index}">${item.protein}g</span>
              <span class="chip-lbl">protein</span>
            </div>
            <div class="macro-chip carb">
              <span class="chip-val" id="chip_carb_${index}">${item.carbs}g</span>
              <span class="chip-lbl">carbs</span>
            </div>
            <div class="macro-chip fat">
              <span class="chip-val" id="chip_fat_${index}">${item.fat}g</span>
              <span class="chip-lbl">fat</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Toggle item checkbox
  toggleItemSelection(index, isChecked) {
    if (this.scannedItems[index]) {
      this.scannedItems[index].selected = isChecked;
      const card = document.getElementById(`scanned_card_${index}`);
      if (card) {
        if (isChecked) card.classList.remove('deselected'), card.classList.add('active');
        else card.classList.remove('active'), card.classList.add('deselected');
      }
      this.updateResultsTotalSummary();
    }
  }

  // Inline edit food name
  updateItemName(index, newName) {
    if (this.scannedItems[index]) {
      this.scannedItems[index].name = newName;
      const display = document.getElementById(`title_display_${index}`);
      if (display) display.textContent = newName;
    }
  }

  // Inline edit portion grams (proportional scaling)
  updateItemGrams(index, newGrams) {
    const item = this.scannedItems[index];
    if (!item) return;

    const grams = Math.max(1, parseFloat(newGrams) || item.originalGrams || 100);
    item.currentGrams = grams;

    const ratio = grams / (item.originalGrams || 100);
    item.calories = Math.round(item.baseCalories * ratio);
    item.protein = Math.round(item.baseProtein * ratio * 10) / 10;
    item.carbs = Math.round(item.baseCarbs * ratio * 10) / 10;
    item.fat = Math.round(item.baseFat * ratio * 10) / 10;

    // Update live DOM chips
    const calElem = document.getElementById(`chip_cal_${index}`);
    const proElem = document.getElementById(`chip_pro_${index}`);
    const carbElem = document.getElementById(`chip_carb_${index}`);
    const fatElem = document.getElementById(`chip_fat_${index}`);

    if (calElem) calElem.textContent = item.calories;
    if (proElem) proElem.textContent = `${item.protein}g`;
    if (carbElem) carbElem.textContent = `${item.carbs}g`;
    if (fatElem) fatElem.textContent = `${item.fat}g`;

    this.updateResultsTotalSummary();
  }

  // Recalculate and update the totals card
  updateResultsTotalSummary() {
    let totalCals = 0;
    let totalPro = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let selectedCount = 0;

    this.scannedItems.forEach(item => {
      if (item.selected) {
        totalCals += item.calories;
        totalPro += item.protein;
        totalCarbs += item.carbs;
        totalFat += item.fat;
        selectedCount++;
      }
    });

    const totCalElem = document.getElementById('scannerTotalCals');
    const totProElem = document.getElementById('scannerTotalProtein');
    const totCarbElem = document.getElementById('scannerTotalCarbs');
    const totFatElem = document.getElementById('scannerTotalFat');
    const confirmBtn = document.getElementById('scannerConfirmBtn');

    if (totCalElem) totCalElem.textContent = Math.round(totalCals);
    if (totProElem) totProElem.textContent = `${Math.round(totalPro * 10) / 10}g`;
    if (totCarbElem) totCarbElem.textContent = `${Math.round(totalCarbs * 10) / 10}g`;
    if (totFatElem) totFatElem.textContent = `${Math.round(totalFat * 10) / 10}g`;

    if (confirmBtn) {
      confirmBtn.disabled = selectedCount === 0;
      confirmBtn.textContent = selectedCount === 0
        ? 'Select At Least 1 Item'
        : `Confirm & Add ${selectedCount} Item${selectedCount > 1 ? 's' : ''} to Log`;
    }
  }

  // Confirm and commit scanned items to local IndexedDB food log
  async confirmAddSelected() {
    const mealSelect = document.getElementById('scannerMealTypeSelect');
    const mealType = mealSelect ? mealSelect.value : 'lunch';
    const activeDate = window.app ? window.app.activeDate : new Date().toISOString().split('T')[0];

    const selectedItems = this.scannedItems.filter(i => i.selected);
    if (selectedItems.length === 0) {
      alert('Please select at least one food item to log.');
      return;
    }

    try {
      for (const item of selectedItems) {
        await window.db.addFoodLog({
          date: activeDate,
          mealType: mealType,
          name: item.name,
          servingAmount: item.currentGrams,
          servingUnit: 'g',
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          isAiEstimate: true,
          notes: `AI scan estimate (${item.serving || ''})`
        });
      }

      // Success notification
      if (window.app) {
        window.app.showToast(`Added ${selectedItems.length} item(s) to ${mealType.toUpperCase()}!`, 'success');
        window.app.refreshDashboard();
        window.app.switchTab('home');
      }

      this.resetScanner();
    } catch (err) {
      console.error('Failed to log scanned foods:', err);
      alert('Failed to save to food log: ' + err.message);
    }
  }

  // Toggle UI state between Idle, Loading, and Results
  showScanningState(isLoading) {
    const idleContainer = document.getElementById('scannerIdleContainer');
    const loadingContainer = document.getElementById('scannerLoadingContainer');
    const resultsContainer = document.getElementById('scannerResultsContainer');
    const errorBanner = document.getElementById('scannerErrorBanner');

    if (errorBanner) errorBanner.style.display = 'none';

    if (isLoading) {
      if (idleContainer) idleContainer.style.display = 'none';
      if (loadingContainer) loadingContainer.style.display = 'flex';
      if (resultsContainer) resultsContainer.style.display = 'none';
    } else {
      if (loadingContainer) loadingContainer.style.display = 'none';
    }
  }

  // Error handling with graceful fallback to manual entry
  handleScanError(message, allowManualFallback = true) {
    this.showScanningState(false);

    const idleContainer = document.getElementById('scannerIdleContainer');
    const loadingContainer = document.getElementById('scannerLoadingContainer');
    const resultsContainer = document.getElementById('scannerResultsContainer');
    const errorBanner = document.getElementById('scannerErrorBanner');
    const errorMsg = document.getElementById('scannerErrorMessage');

    if (loadingContainer) loadingContainer.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (idleContainer) idleContainer.style.display = 'block';

    if (errorBanner && errorMsg) {
      errorMsg.textContent = message;
      errorBanner.style.display = 'block';
    }

    if (allowManualFallback && window.app) {
      const fallbackBtn = document.getElementById('scannerManualFallbackBtn');
      if (fallbackBtn) {
        fallbackBtn.onclick = () => {
          window.app.openAddFoodModal();
        };
      }
    }
  }

  // Reset to initial scan screen
  resetScanner() {
    this.currentImageBase64 = null;
    this.scannedItems = [];

    const previewImg = document.getElementById('scannerPreviewImg');
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }

    const idleContainer = document.getElementById('scannerIdleContainer');
    const loadingContainer = document.getElementById('scannerLoadingContainer');
    const resultsContainer = document.getElementById('scannerResultsContainer');
    const errorBanner = document.getElementById('scannerErrorBanner');

    if (errorBanner) errorBanner.style.display = 'none';
    if (loadingContainer) loadingContainer.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (idleContainer) idleContainer.style.display = 'block';
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

// Global instance
window.scanner = new FoodScanner();
