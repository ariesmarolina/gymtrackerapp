// IronTrack Gym Progress & Analytics Module
// Pure Canvas charts and weekly adherence metrics designed for iOS 15 Safari

class GymProgressTracker {
  constructor() {
    this.selectedRangeDays = 14; // Default 14 days chart view
    this.initEventListeners();
  }

  initEventListeners() {
    // Range selector buttons for weight chart (7d, 14d, 30d)
    const rangeBtns = document.querySelectorAll('.chart-range-btn');
    rangeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        rangeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedRangeDays = parseInt(e.target.dataset.days, 10) || 14;
        this.renderWeightChart();
      });
    });

    // Workout note auto-save
    const workoutInput = document.getElementById('workoutNotesTextarea');
    if (workoutInput) {
      let timeout = null;
      workoutInput.addEventListener('input', () => {
        clearTimeout(timeout);
        const saveIndicator = document.getElementById('workoutSaveStatus');
        if (saveIndicator) saveIndicator.textContent = 'Saving...';

        timeout = setTimeout(async () => {
          const date = window.app ? window.app.activeDate : new Date().toISOString().split('T')[0];
          await window.db.saveWorkoutNote(date, workoutInput.value);
          if (saveIndicator) {
            saveIndicator.textContent = 'Saved';
            setTimeout(() => { if (saveIndicator) saveIndicator.textContent = ''; }, 1500);
          }
        }, 600);
      });
    }

    // Weight input submit
    const weightForm = document.getElementById('quickWeightForm');
    if (weightForm) {
      weightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const weightInput = document.getElementById('quickWeightInput');
        const weightVal = parseFloat(weightInput.value);
        if (isNaN(weightVal) || weightVal <= 0) return;

        const date = window.app ? window.app.activeDate : new Date().toISOString().split('T')[0];
        await window.db.saveWeightLog(date, weightVal);

        if (window.app) {
          window.app.showToast(`Logged ${weightVal.toFixed(1)} kg for ${date}`, 'success');
        }

        weightInput.blur();
        this.loadProgressView();
      });
    }
  }

  // Load and refresh the complete Progress view
  async loadProgressView() {
    const activeDate = window.app ? window.app.activeDate : new Date().toISOString().split('T')[0];

    // Load workout note for active date
    const note = await window.db.getWorkoutNote(activeDate);
    const workoutInput = document.getElementById('workoutNotesTextarea');
    if (workoutInput) workoutInput.value = note || '';

    // Load active date weight input value
    const weightLogs = await window.db.getWeightLogs(90);
    const activeWeightEntry = weightLogs.find(w => w.date === activeDate);
    const quickWeightInput = document.getElementById('quickWeightInput');
    if (quickWeightInput) {
      quickWeightInput.value = activeWeightEntry ? activeWeightEntry.weightKg : '';
    }

    // Render Canvas chart & averages
    this.renderWeightChart(weightLogs);

    // Render 7-day adherence scorecard & history
    await this.renderWeeklyConsistency();
  }

  // Render high-DPI canvas chart for iOS Safari
  renderWeightChart(preloadedLogs = null) {
    const canvas = document.getElementById('weightProgressCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 2;
    const rect = canvas.getBoundingClientRect();

    // Set physical canvas pixels for sharp Retina display on iPhone 7 Plus
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Fetch data if not passed
    const executeRender = (logs) => {
      ctx.clearRect(0, 0, width, height);

      // Filter to selected range
      const daysCount = this.selectedRangeDays;
      const recentLogs = logs.slice(-daysCount);

      // Compute weekly average weight
      this.calculateWeeklyAverages(logs);

      if (recentLogs.length < 2) {
        // Empty state on canvas
        ctx.fillStyle = '#6b7280';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Log weight for at least 2 days to view progress trend', width / 2, height / 2);
        return;
      }

      // Min/Max weights with padding
      const weights = recentLogs.map(l => l.weightKg);
      let minW = Math.min(...weights) - 1.0;
      let maxW = Math.max(...weights) + 1.0;
      if (maxW - minW < 1) {
        minW -= 1;
        maxW += 1;
      }

      const paddingLeft = 36;
      const paddingRight = 20;
      const paddingTop = 20;
      const paddingBottom = 30;

      const chartW = width - paddingLeft - paddingRight;
      const chartH = height - paddingTop - paddingBottom;

      // Draw horizontal grid lines & labels
      ctx.strokeStyle = '#262a34';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';

      const gridSteps = 3;
      for (let i = 0; i <= gridSteps; i++) {
        const val = minW + (i / gridSteps) * (maxW - minW);
        const y = height - paddingBottom - (i / gridSteps) * chartH;

        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        ctx.fillText(val.toFixed(1), paddingLeft - 6, y + 3);
      }

      // Coordinates for points
      const points = recentLogs.map((item, idx) => {
        const x = paddingLeft + (idx / (recentLogs.length - 1)) * chartW;
        const normY = (item.weightKg - minW) / (maxW - minW);
        const y = height - paddingBottom - (normY * chartH);
        return { x, y, date: item.date, weight: item.weightKg };
      });

      // Draw subtle green gradient under line
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - paddingBottom);
      ctx.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw main line
      ctx.beginPath();
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // Draw circular dots and labels
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'center';
      points.forEach((pt, idx) => {
        // Dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#121316';
        ctx.lineWidth = 2;
        ctx.stroke();

        // X-axis date labels (show every few days to avoid clutter on 5.5-inch screen)
        if (idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 4) === 0) {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
          const shortDate = pt.date.slice(5); // MM-DD
          ctx.fillText(shortDate, pt.x, height - 10);
        }
      });
    };

    if (preloadedLogs) {
      executeRender(preloadedLogs);
    } else {
      window.db.getWeightLogs(90).then(logs => executeRender(logs));
    }
  }

  // Calculate moving weekly average weight & rate of gain/loss
  calculateWeeklyAverages(logs) {
    const avgElem = document.getElementById('weeklyAverageWeightDisplay');
    const changeElem = document.getElementById('weeklyWeightChangeDisplay');
    if (!avgElem) return;

    if (!logs || logs.length === 0) {
      avgElem.textContent = '-- kg';
      if (changeElem) changeElem.textContent = 'No weight logged yet';
      return;
    }

    // Last 7 days logs
    const last7Logs = logs.slice(-7);
    const sum7 = last7Logs.reduce((acc, curr) => acc + curr.weightKg, 0);
    const avg7 = sum7 / last7Logs.length;

    avgElem.textContent = `${avg7.toFixed(1)} kg`;

    // Prior 7 days for delta
    if (logs.length >= 8) {
      const priorLogs = logs.slice(-14, -7);
      if (priorLogs.length > 0) {
        const priorAvg = priorLogs.reduce((acc, curr) => acc + curr.weightKg, 0) / priorLogs.length;
        const diff = avg7 - priorAvg;
        const sign = diff >= 0 ? '+' : '';
        if (changeElem) {
          changeElem.textContent = `${sign}${diff.toFixed(2)} kg vs last week`;
          changeElem.className = diff >= 0 ? 'trend-positive' : 'trend-neutral';
        }
        return;
      }
    }

    if (changeElem) changeElem.textContent = `Based on ${last7Logs.length} entries`;
  }

  // Render 7-day consistency scorecard (Calorie and Protein goal adherence)
  async renderWeeklyConsistency() {
    const container = document.getElementById('weeklyConsistencyContainer');
    const scorecardElem = document.getElementById('goalAdherenceScorecard');
    if (!container) return;

    const settings = await window.db.getSettings();
    const targetCals = settings.calorieTarget || 2500;
    const targetProtein = settings.proteinTarget || 160;

    // Build last 7 dates
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    let proteinHitCount = 0;
    let calorieHitCount = 0;
    let daysWithLogs = 0;

    const dayRows = [];

    for (const dateStr of dates) {
      const logs = await window.db.getFoodLogsByDate(dateStr);
      let dayCals = 0;
      let dayPro = 0;

      logs.forEach(item => {
        dayCals += item.calories;
        dayPro += item.protein;
      });

      const hasLogs = logs.length > 0;
      if (hasLogs) daysWithLogs++;

      // Lifter protein criteria: within 90% or above target
      const hitProtein = hasLogs && dayPro >= (targetProtein * 0.9);
      // Bulking calorie criteria: within ±10% or above target
      const hitCal = hasLogs && dayCals >= (targetCals * 0.9) && dayCals <= (targetCals * 1.15);

      if (hitProtein) proteinHitCount++;
      if (hitCal) calorieHitCount++;

      const dateObj = new Date(dateStr + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = dateObj.getDate();

      const calPct = Math.min(100, Math.round((dayCals / targetCals) * 100));
      const proPct = Math.min(100, Math.round((dayPro / targetProtein) * 100));

      dayRows.push(`
        <div class="consistency-day-row">
          <div class="consistency-day-date">
            <span class="day-name">${dayName}</span>
            <span class="day-num">${dayNum}</span>
          </div>

          <div class="consistency-bars">
            <!-- Calorie Bar -->
            <div class="consistency-bar-group">
              <div class="bar-header-mini">
                <span>Calories: <strong>${dayCals}</strong> / ${targetCals}</span>
                <span class="${hitCal ? 'text-green' : 'text-muted'}">${calPct}%</span>
              </div>
              <div class="mini-progress-track">
                <div class="mini-progress-fill cal-fill" style="width: ${calPct}%;"></div>
              </div>
            </div>

            <!-- Protein Bar -->
            <div class="consistency-bar-group">
              <div class="bar-header-mini">
                <span>Protein: <strong>${Math.round(dayPro)}g</strong> / ${targetProtein}g</span>
                <span class="${hitProtein ? 'text-green' : 'text-muted'}">${proPct}%</span>
              </div>
              <div class="mini-progress-track">
                <div class="mini-progress-fill pro-fill" style="width: ${proPct}%;"></div>
              </div>
            </div>
          </div>

          <div class="consistency-status-badge ${hitProtein ? 'badge-hit' : (hasLogs ? 'badge-miss' : 'badge-none')}">
            ${hitProtein ? '💪 PRO HIT' : (hasLogs ? 'INCOMPLETE' : 'NO LOG')}
          </div>
        </div>
      `);
    }

    container.innerHTML = dayRows.join('');

    // Update Top Scorecard
    if (scorecardElem) {
      const proteinPct = Math.round((proteinHitCount / 7) * 100);
      const caloriePct = Math.round((calorieHitCount / 7) * 100);

      scorecardElem.innerHTML = `
        <div class="scorecard-metric">
          <div class="metric-val text-green">${proteinHitCount}/7 <span class="metric-unit">days</span></div>
          <div class="metric-lbl">Protein Goal (${proteinPct}%)</div>
        </div>
        <div class="scorecard-metric">
          <div class="metric-val text-amber">${calorieHitCount}/7 <span class="metric-unit">days</span></div>
          <div class="metric-lbl">Calorie Goal (${caloriePct}%)</div>
        </div>
        <div class="scorecard-metric">
          <div class="metric-val text-cyan">${daysWithLogs}/7 <span class="metric-unit">days</span></div>
          <div class="metric-lbl">Logged Meals</div>
        </div>
      `;
    }
  }

  // Quick workout tag adder
  appendWorkoutTag(tagName) {
    const workoutInput = document.getElementById('workoutNotesTextarea');
    if (!workoutInput) return;

    const current = workoutInput.value.trim();
    if (current.includes(tagName)) return;

    workoutInput.value = current ? `${current}\n• ${tagName}: ` : `• ${tagName}: `;
    workoutInput.dispatchEvent(new Event('input'));
    workoutInput.focus();
  }
}

// Global instance
window.progressTracker = new GymProgressTracker();
