// IronTrack IndexedDB Storage Layer
// Designed for iOS 15 Safari compatibility with localStorage fallback

const DB_NAME = 'IronTrackGymDB';
const DB_VERSION = 1;

class AppDatabase {
  constructor() {
    this.db = null;
    this.isIndexedDBSupported = typeof indexedDB !== 'undefined';
  }

  // Safe unique ID generator for iOS 15 Safari
  generateId(prefix = 'item') {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return `${prefix}_${crypto.randomUUID()}`;
      } catch (e) {}
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Open / Initialize DB
  async init() {
    if (!this.isIndexedDBSupported) {
      console.warn('[DB] IndexedDB not supported; using localStorage fallback');
      return true;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Food logs store
        if (!db.objectStoreNames.contains('food_logs')) {
          const foodStore = db.createObjectStore('food_logs', { keyPath: 'id' });
          foodStore.createIndex('date', 'date', { unique: false });
          foodStore.createIndex('mealType', 'mealType', { unique: false });
        }

        // Custom foods store
        if (!db.objectStoreNames.contains('custom_foods')) {
          db.createObjectStore('custom_foods', { keyPath: 'id' });
        }

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'foodId' });
        }

        // Weight logs store
        if (!db.objectStoreNames.contains('weight_logs')) {
          const weightStore = db.createObjectStore('weight_logs', { keyPath: 'date' });
          weightStore.createIndex('date', 'date', { unique: true });
        }

        // Workout notes store
        if (!db.objectStoreNames.contains('workout_notes')) {
          db.createObjectStore('workout_notes', { keyPath: 'date' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('[DB] IndexedDB open error:', event.target.error);
        this.isIndexedDBSupported = false; // Fallback to localStorage
        resolve(false);
      };
    });
  }

  // Transaction helper
  _tx(storeName, mode = 'readonly') {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.transaction([storeName], mode).objectStore(storeName);
  }

  // --- FOOD LOGS ---
  async addFoodLog(entry) {
    const item = {
      id: entry.id || this.generateId('log'),
      date: entry.date, // format: YYYY-MM-DD
      mealType: entry.mealType || 'lunch', // 'breakfast', 'lunch', 'dinner', 'snack'
      name: entry.name,
      servingAmount: Number(entry.servingAmount) || 1,
      servingUnit: entry.servingUnit || 'serving',
      calories: Math.round(Number(entry.calories) || 0),
      protein: Math.round((Number(entry.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(entry.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(entry.fat) || 0) * 10) / 10,
      isAiEstimate: Boolean(entry.isAiEstimate),
      notes: entry.notes || '',
      createdAt: entry.createdAt || new Date().toISOString()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('food_logs', 'readwrite');
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      });
    } else {
      // LocalStorage fallback
      const all = this._lsGet('food_logs', []);
      all.push(item);
      this._lsSet('food_logs', all);
      return item;
    }
  }

  async updateFoodLog(id, updates) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('food_logs', 'readwrite');
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (!existing) return reject(new Error('Log entry not found'));
          const updated = { ...existing, ...updates };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve(updated);
          putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } else {
      const all = this._lsGet('food_logs', []);
      const idx = all.findIndex(x => x.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updates };
        this._lsSet('food_logs', all);
        return all[idx];
      }
      throw new Error('Log not found');
    }
  }

  async deleteFoodLog(id) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('food_logs', 'readwrite');
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } else {
      let all = this._lsGet('food_logs', []);
      all = all.filter(x => x.id !== id);
      this._lsSet('food_logs', all);
      return true;
    }
  }

  async getFoodLogsByDate(dateStr) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('food_logs', 'readonly');
        const index = store.index('date');
        const req = index.getAll(IDBKeyRange.only(dateStr));
        req.onsuccess = () => {
          const results = req.result || [];
          results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const all = this._lsGet('food_logs', []);
      return all.filter(x => x.date === dateStr);
    }
  }

  async getFoodLogsByDateRange(startDateStr, endDateStr) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('food_logs', 'readonly');
        const index = store.index('date');
        const range = IDBKeyRange.bound(startDateStr, endDateStr);
        const req = index.getAll(range);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } else {
      const all = this._lsGet('food_logs', []);
      return all.filter(x => x.date >= startDateStr && x.date <= endDateStr);
    }
  }

  async duplicateMeal(fromDateStr, mealType, toDateStr) {
    const logs = await this.getFoodLogsByDate(fromDateStr);
    const mealItems = logs.filter(item => item.mealType === mealType);

    const duplicated = [];
    for (const item of mealItems) {
      const copy = {
        ...item,
        id: this.generateId('log'),
        date: toDateStr,
        createdAt: new Date().toISOString()
      };
      await this.addFoodLog(copy);
      duplicated.push(copy);
    }
    return duplicated;
  }

  // --- CUSTOM FOODS ---
  async saveCustomFood(food) {
    const item = {
      id: food.id || this.generateId('cf'),
      name: food.name,
      category: food.category || 'Custom Foods',
      baseServingAmount: Number(food.baseServingAmount) || 100,
      baseUnit: food.baseUnit || 'g',
      calories: Math.round(Number(food.calories) || 0),
      protein: Math.round((Number(food.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(food.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(food.fat) || 0) * 10) / 10,
      units: food.units || [{ unit: food.baseUnit || 'g', factor: 1, label: food.baseUnit || 'g' }],
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('custom_foods', 'readwrite');
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      });
    } else {
      const all = this._lsGet('custom_foods', []);
      all.push(item);
      this._lsSet('custom_foods', all);
      return item;
    }
  }

  async getCustomFoods() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('custom_foods', 'readonly');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } else {
      return this._lsGet('custom_foods', []);
    }
  }

  async deleteCustomFood(id) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('custom_foods', 'readwrite');
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } else {
      let all = this._lsGet('custom_foods', []);
      all = all.filter(x => x.id !== id);
      this._lsSet('custom_foods', all);
      return true;
    }
  }

  // --- FAVORITES ---
  async toggleFavorite(foodId, foodSnapshot = null) {
    const isFav = await this.isFavorite(foodId);
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('favorites', 'readwrite');
        if (isFav) {
          const req = store.delete(foodId);
          req.onsuccess = () => resolve(false);
          req.onerror = () => reject(req.error);
        } else {
          const req = store.put({ foodId, foodSnapshot, savedAt: new Date().toISOString() });
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        }
      });
    } else {
      let favs = this._lsGet('favorites', []);
      if (isFav) {
        favs = favs.filter(f => f.foodId !== foodId);
        this._lsSet('favorites', favs);
        return false;
      } else {
        favs.push({ foodId, foodSnapshot, savedAt: new Date().toISOString() });
        this._lsSet('favorites', favs);
        return true;
      }
    }
  }

  async isFavorite(foodId) {
    if (this.db) {
      return new Promise((resolve) => {
        const store = this._tx('favorites', 'readonly');
        const req = store.get(foodId);
        req.onsuccess = () => resolve(Boolean(req.result));
        req.onerror = () => resolve(false);
      });
    } else {
      const favs = this._lsGet('favorites', []);
      return favs.some(f => f.foodId === foodId);
    }
  }

  async getFavorites() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('favorites', 'readonly');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } else {
      return this._lsGet('favorites', []);
    }
  }

  // --- WEIGHT LOGS ---
  async saveWeightLog(dateStr, weightKg) {
    const item = {
      date: dateStr,
      weightKg: Math.round(Number(weightKg) * 10) / 10,
      timestamp: new Date().toISOString()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('weight_logs', 'readwrite');
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      });
    } else {
      const all = this._lsGet('weight_logs', []);
      const idx = all.findIndex(w => w.date === dateStr);
      if (idx !== -1) all[idx] = item;
      else all.push(item);
      this._lsSet('weight_logs', all);
      return item;
    }
  }

  async getWeightLogs(limitDays = 90) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('weight_logs', 'readonly');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => a.date.localeCompare(b.date));
          resolve(list.slice(-limitDays));
        };
        req.onerror = () => reject(req.error);
      });
    } else {
      const all = this._lsGet('weight_logs', []);
      all.sort((a, b) => a.date.localeCompare(b.date));
      return all.slice(-limitDays);
    }
  }

  async deleteWeightLog(dateStr) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('weight_logs', 'readwrite');
        const req = store.delete(dateStr);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } else {
      let all = this._lsGet('weight_logs', []);
      all = all.filter(w => w.date !== dateStr);
      this._lsSet('weight_logs', all);
      return true;
    }
  }

  // --- WORKOUT NOTES ---
  async saveWorkoutNote(dateStr, notes) {
    const item = {
      date: dateStr,
      notes: (notes || '').trim(),
      updatedAt: new Date().toISOString()
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('workout_notes', 'readwrite');
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
      });
    } else {
      const all = this._lsGet('workout_notes', []);
      const idx = all.findIndex(n => n.date === dateStr);
      if (idx !== -1) all[idx] = item;
      else all.push(item);
      this._lsSet('workout_notes', all);
      return item;
    }
  }

  async getWorkoutNote(dateStr) {
    if (this.db) {
      return new Promise((resolve) => {
        const store = this._tx('workout_notes', 'readonly');
        const req = store.get(dateStr);
        req.onsuccess = () => resolve(req.result ? req.result.notes : '');
        req.onerror = () => resolve('');
      });
    } else {
      const all = this._lsGet('workout_notes', []);
      const match = all.find(n => n.date === dateStr);
      return match ? match.notes : '';
    }
  }

  // --- SETTINGS & GOALS ---
  async getSettings() {
    const defaults = {
      calorieTarget: 2500,
      proteinTarget: 160,
      carbsTarget: 280,
      fatTarget: 65,
      currentWeightKg: 70,
      targetWeightKg: 74,
      goalType: 'lean_bulk' // 'lean_bulk', 'maintain', 'fat_loss'
    };

    if (this.db) {
      return new Promise((resolve) => {
        const store = this._tx('settings', 'readonly');
        const req = store.get('user_goals');
        req.onsuccess = () => {
          if (req.result && req.result.value) {
            resolve({ ...defaults, ...req.result.value });
          } else {
            resolve(defaults);
          }
        };
        req.onerror = () => resolve(defaults);
      });
    } else {
      const saved = this._lsGet('settings_user_goals', null);
      return saved ? { ...defaults, ...saved } : defaults;
    }
  }

  async saveSettings(settingsObj) {
    if (this.db) {
      return new Promise((resolve, reject) => {
        const store = this._tx('settings', 'readwrite');
        const req = store.put({ key: 'user_goals', value: settingsObj });
        req.onsuccess = () => resolve(settingsObj);
        req.onerror = () => reject(req.error);
      });
    } else {
      this._lsSet('settings_user_goals', settingsObj);
      return settingsObj;
    }
  }

  // --- DATA BACKUP & RESTORE (JSON EXPORT / IMPORT) ---
  async exportAllData() {
    let foodLogs = [];
    let customFoods = [];
    let favorites = [];
    let weightLogs = [];
    let workoutNotes = [];
    const settings = await this.getSettings();

    if (this.db) {
      foodLogs = await new Promise(r => this._tx('food_logs', 'readonly').getAll().onsuccess = e => r(e.target.result || []));
      customFoods = await new Promise(r => this._tx('custom_foods', 'readonly').getAll().onsuccess = e => r(e.target.result || []));
      favorites = await new Promise(r => this._tx('favorites', 'readonly').getAll().onsuccess = e => r(e.target.result || []));
      weightLogs = await new Promise(r => this._tx('weight_logs', 'readonly').getAll().onsuccess = e => r(e.target.result || []));
      workoutNotes = await new Promise(r => this._tx('workout_notes', 'readonly').getAll().onsuccess = e => r(e.target.result || []));
    } else {
      foodLogs = this._lsGet('food_logs', []);
      customFoods = this._lsGet('custom_foods', []);
      favorites = this._lsGet('favorites', []);
      weightLogs = this._lsGet('weight_logs', []);
      workoutNotes = this._lsGet('workout_notes', []);
    }

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      appName: 'IronTrack',
      settings,
      foodLogs,
      customFoods,
      favorites,
      weightLogs,
      workoutNotes
    };
  }

  async importAllData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file format');
    }

    if (data.settings) await this.saveSettings(data.settings);

    if (Array.isArray(data.foodLogs)) {
      for (const log of data.foodLogs) {
        await this.addFoodLog(log);
      }
    }

    if (Array.isArray(data.customFoods)) {
      for (const cf of data.customFoods) {
        await this.saveCustomFood(cf);
      }
    }

    if (Array.isArray(data.weightLogs)) {
      for (const w of data.weightLogs) {
        if (w.date && w.weightKg) await this.saveWeightLog(w.date, w.weightKg);
      }
    }

    if (Array.isArray(data.workoutNotes)) {
      for (const wn of data.workoutNotes) {
        if (wn.date) await this.saveWorkoutNote(wn.date, wn.notes);
      }
    }

    return true;
  }

  // LocalStorage Fallback helpers
  _lsGet(key, defaultVal) {
    try {
      const data = localStorage.getItem(`irontrack_${key}`);
      return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  _lsSet(key, value) {
    try {
      localStorage.setItem(`irontrack_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('[DB] LocalStorage save failed:', e);
    }
  }
}

// Global Singleton
window.db = new AppDatabase();
