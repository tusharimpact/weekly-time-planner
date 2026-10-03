/**
 * 168 Hours Weekly Life & Time Planner - Core App Logic
 * Features:
 * - Uniform 24-Hour Schedule Matrix (10 PM to 9 PM)
 * - In-Cell Sub-hour Slot Breakdown (15m, 30m, 1h) with multi-legend support per cell
 * - Toggle Select / Unselect on full cells and sub-slots
 * - Dynamic Life Calculator (Weeks, Days, and Hours for Lived & Remaining)
 * - Custom Legend Notes & Goals (Add, Edit, View, Save)
 * - 100% Data Persistence in LocalStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Constants & Configuration
  const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const TIME_SLOTS = [
    '10:00 PM - 11:00 PM', // Slot 0
    '11:00 PM - 12:00 AM', // Slot 1
    '12:00 AM - 01:00 AM', // Slot 2
    '01:00 AM - 02:00 AM', // Slot 3
    '02:00 AM - 03:00 AM', // Slot 4
    '03:00 AM - 04:00 AM', // Slot 5
    '04:00 AM - 05:00 AM', // Slot 6
    '05:00 AM - 06:00 AM', // Slot 7
    '06:00 AM - 07:00 AM', // Slot 8
    '07:00 AM - 08:00 AM', // Slot 9
    '08:00 AM - 09:00 AM', // Slot 10
    '09:00 AM - 10:00 AM', // Slot 11
    '10:00 AM - 11:00 AM', // Slot 12
    '11:00 AM - 12:00 PM', // Slot 13
    '12:00 PM - 01:00 PM', // Slot 14
    '01:00 PM - 02:00 PM', // Slot 15
    '02:00 PM - 03:00 PM', // Slot 16
    '03:00 PM - 04:00 PM', // Slot 17
    '04:00 PM - 05:00 PM', // Slot 18
    '05:00 PM - 06:00 PM', // Slot 19
    '06:00 PM - 07:00 PM', // Slot 20
    '07:00 PM - 08:00 PM', // Slot 21
    '08:00 PM - 09:00 PM', // Slot 22
    '09:00 PM - 10:00 PM', // Slot 23
  ];

  const COLOR_PALETTE = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#d946ef', // Fuchsia
    '#14b8a6', // Teal
    '#64748b', // Slate
    '#a855f7', // Violet
  ];

  const DEFAULT_LEGENDS = [
    { id: 'leg_sleep', name: 'Sleep (8 hrs)', color: '#3b82f6', notes: 'Target 8 hours of restorative sleep every night (10 PM - 6 AM).' },
    { id: 'leg_routine', name: 'Routine Work (4 hrs)', color: '#f59e0b', notes: 'Morning & evening routines, meals, prep, and personal care.' },
    { id: 'leg_work', name: '9-to-5 Work', color: '#10b981', notes: 'Core professional deep work and meeting blocks.' },
    { id: 'leg_fitness', name: 'Fitness & Health', color: '#ef4444', notes: 'Workout, cardio, stretching, and active movement.' },
    { id: 'leg_learning', name: 'Learning & Growth', color: '#8b5cf6', notes: 'Reading, skills development, courses, and journaling.' },
    { id: 'leg_family', name: 'Family & Social', color: '#ec4899', notes: 'Quality time with family, friends, and social connections.' },
  ];

  const isMobileInitial = window.innerWidth < 768;

  // 2. Application State
  let state = {
    legends: [...DEFAULT_LEGENDS],
    activeBrushId: 'leg_sleep',
    grid: {}, // Key: `${dayIndex}_${slotIndex}` -> String OR Object { split: 2|4, sub: [...] }
    userAge: 28,
    activeFilterId: 'all',
    viewMode: isMobileInitial ? 'day' : 'grid',
    activeDayIndex: 0, // 0 = Saturday
  };

  let isMouseDown = false;
  let editingLegendId = null;
  let splittingCellKey = null; // Key of cell being split in modal

  // Helper: Format decimal hours nicely
  function formatHours(hrs) {
    if (hrs % 1 === 0) return hrs.toString();
    return hrs.toFixed(2).replace(/\.?0+$/, '');
  }

  // 3. Initialize App
  function init() {
    loadStateFromStorage();

    renderLifePerspective();
    renderColorPalette();
    renderLegends();
    renderViewModeToggle();
    renderSingleDayFeed();
    renderGridTable();
    renderMobileStickyToolbar();
    updateStatistics();
    bindEvents();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // 4. State Persistence (LocalStorage)
  function saveStateToStorage() {
    try {
      localStorage.setItem('168h_planner_state', JSON.stringify({
        legends: state.legends,
        grid: state.grid,
        userAge: state.userAge
      }));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  function loadStateFromStorage() {
    try {
      const saved = localStorage.getItem('168h_planner_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.legends && parsed.legends.length > 0) {
          // Preserve or migrate notes
          state.legends = parsed.legends.map(l => ({
            ...l,
            notes: l.notes || ''
          }));
        }
        if (parsed.grid) state.grid = parsed.grid;
        if (parsed.userAge !== undefined) state.userAge = parsed.userAge;

        if (!state.legends.find(l => l.id === state.activeBrushId)) {
          state.activeBrushId = state.legends[0].id;
        }
        return;
      }
    } catch (e) {
      console.warn('Could not load saved state, using defaults', e);
    }

    applyPreRenderedDefaults();
  }

  function applyPreRenderedDefaults() {
    state.grid = {};
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // 1. Sleep: 10 PM to 6 AM (Slots 0 to 7) -> 8 hours
      for (let slot = 0; slot <= 7; slot++) {
        state.grid[`${dayIndex}_${slot}`] = 'leg_sleep';
      }

      // 2. Routine Work: 6 AM to 8 AM (Slots 8, 9) & 7 PM to 9 PM (Slots 21, 22) -> 4 hours
      state.grid[`${dayIndex}_8`] = 'leg_routine';
      state.grid[`${dayIndex}_9`] = 'leg_routine';
      state.grid[`${dayIndex}_21`] = 'leg_routine';
      state.grid[`${dayIndex}_22`] = 'leg_routine';

      // 3. 9-to-5 Work: General Workdays (Sunday - Thursday, index 1 to 5)
      if (dayIndex >= 1 && dayIndex <= 5) {
        for (let slot = 11; slot <= 18; slot++) {
          state.grid[`${dayIndex}_${slot}`] = 'leg_work';
        }
      }
    }

    saveStateToStorage();
  }

  // 5. CELL PAINTING & SUB-SLOT BREAKDOWN LOGIC

  /**
   * Paint or toggle a cell or sub-slot
   * @param {string} cellKey - Key of 1-hour slot `${dayIndex}_${slotIndex}`
   * @param {number|null} subIdx - Optional index of sub-slot if cell is split
   * @param {boolean} forceAssign - If true (e.g. mouse drag), force assign active brush. If false (click), toggle!
   */
  function paintCellKey(cellKey, subIdx = null, forceAssign = false) {
    const val = state.grid[cellKey];

    if (val && typeof val === 'object' && val.split) {
      // Cell is sub-divided (e.g. 2 x 30m or 4 x 15m)
      const targetSubIdx = subIdx !== null ? subIdx : 0;
      const currentSubLegend = val.sub[targetSubIdx];

      if (!forceAssign && currentSubLegend === state.activeBrushId) {
        // Toggle off sub-slot!
        val.sub[targetSubIdx] = null;
      } else {
        val.sub[targetSubIdx] = state.activeBrushId === 'eraser' ? null : state.activeBrushId;
      }

      // Check if all sub-slots are empty -> delete cell key
      if (val.sub.every(s => !s)) {
        delete state.grid[cellKey];
      }
    } else {
      // Full 1-hour cell
      const currentLegend = typeof val === 'string' ? val : null;

      if (!forceAssign && currentLegend === state.activeBrushId) {
        // Toggle off full cell!
        delete state.grid[cellKey];
      } else {
        if (state.activeBrushId === 'eraser') {
          delete state.grid[cellKey];
        } else {
          state.grid[cellKey] = state.activeBrushId;
        }
      }
    }

    saveStateToStorage();
    renderGridTable();
    renderSingleDayFeed();
    updateStatistics();
  }

  // Split cell into sub-slots (15m or 30m) or revert to full 1h
  function splitCell(cellKey, splitType) {
    const currentVal = state.grid[cellKey];
    const defaultLegend = typeof currentVal === 'string' ? currentVal : (currentVal?.sub?.[0] || null);

    if (splitType === 1) {
      // Revert to 1-hour single slot
      if (defaultLegend) {
        state.grid[cellKey] = defaultLegend;
      } else {
        delete state.grid[cellKey];
      }
    } else if (splitType === 2) {
      // Split into 2 x 30m sub-slots
      state.grid[cellKey] = {
        split: 2,
        sub: [defaultLegend, defaultLegend]
      };
    } else if (splitType === 4) {
      // Split into 4 x 15m sub-slots
      state.grid[cellKey] = {
        split: 4,
        sub: [defaultLegend, defaultLegend, defaultLegend, defaultLegend]
      };
    }

    saveStateToStorage();
    renderGridTable();
    renderSingleDayFeed();
    updateStatistics();
  }

  // 6. RENDER FUNCTIONS

  /**
   * Render DYNAMIC Life Perspective Calculator Metrics
   * Shows Weeks, Days, and Hours for Lived & Remaining!
   */
  function renderLifePerspective() {
    const age = Math.max(1, Math.min(120, parseInt(state.userAge) || 28));
    const totalWeeks = 4000;
    const avgLifespanYears = 76.92;

    const weeksLived = Math.min(totalWeeks, Math.round(age * 52.1429));
    const daysLived = Math.round(weeksLived * 7);
    const hoursLived = Math.round(daysLived * 24);

    const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
    const daysRemaining = Math.round(weeksRemaining * 7);
    const hoursRemaining = Math.round(weeksRemaining * 168);

    const livedPct = ((weeksLived / totalWeeks) * 100).toFixed(1);
    const remainingPct = (100 - parseFloat(livedPct)).toFixed(1);

    const yearsRemaining = Math.max(0, avgLifespanYears - age).toFixed(1);

    const ageInput = document.getElementById('user-age-input');
    if (ageInput && ageInput.value != age) {
      ageInput.value = age;
    }

    const descText = document.getElementById('life-perspective-text');
    if (descText) {
      descText.innerHTML = `
        At age <strong class="text-white font-bold">${age}</strong>, you have spent <strong class="text-amber-400 font-bold">${weeksLived.toLocaleString()} weeks</strong> (${daysLived.toLocaleString()} days • ~${livedPct}%) and have <strong class="text-emerald-400 font-bold">${weeksRemaining.toLocaleString()} weeks</strong> (${daysRemaining.toLocaleString()} days) remaining. Make each 168-hour week count!
      `;
    }

    const elWeeksLived = document.getElementById('metric-weeks-lived');
    const elDaysLived = document.getElementById('metric-days-lived');
    const elHoursLived = document.getElementById('metric-hours-lived');
    if (elWeeksLived) elWeeksLived.textContent = `${weeksLived.toLocaleString()} weeks`;
    if (elDaysLived) elDaysLived.textContent = `${daysLived.toLocaleString()} days`;
    if (elHoursLived) elHoursLived.textContent = `(${hoursLived.toLocaleString()} hrs • ${livedPct}%)`;

    const elWeeksRem = document.getElementById('metric-weeks-remaining');
    const elDaysRem = document.getElementById('metric-days-remaining');
    const elPctRem = document.getElementById('metric-pct-remaining');
    if (elWeeksRem) elWeeksRem.textContent = `${weeksRemaining.toLocaleString()} weeks`;
    if (elDaysRem) elDaysRem.textContent = `${daysRemaining.toLocaleString()} days`;
    if (elPctRem) elPctRem.textContent = `(${remainingPct}% left)`;

    const elYearsRem = document.getElementById('metric-years-remaining');
    if (elYearsRem) elYearsRem.textContent = `${yearsRemaining} yrs`;

    const elLifetimeHours = document.getElementById('metric-lifetime-hours');
    if (elLifetimeHours) elLifetimeHours.textContent = `${hoursRemaining.toLocaleString()} hrs`;

    const elBarPct = document.getElementById('metric-bar-pct');
    if (elBarPct) elBarPct.textContent = `${livedPct}%`;

    const elProgressBar = document.getElementById('life-progress-bar');
    if (elProgressBar) elProgressBar.style.width = `${livedPct}%`;
  }

  function renderViewModeToggle() {
    const btnDay = document.getElementById('tab-btn-day');
    const btnGrid = document.getElementById('tab-btn-grid');
    const dayContainer = document.getElementById('view-day-container');
    const gridContainer = document.getElementById('view-grid-container');

    if (!btnDay || !btnGrid || !dayContainer || !gridContainer) return;

    if (state.viewMode === 'day') {
      btnDay.className = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md';
      btnGrid.className = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/60';
      dayContainer.classList.remove('hidden');
      gridContainer.classList.add('hidden');
    } else {
      btnGrid.className = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md';
      btnDay.className = 'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-700/60';
      gridContainer.classList.remove('hidden');
      dayContainer.classList.add('hidden');
    }
  }

  // Single Day Feed Render
  function renderSingleDayFeed() {
    const dayHeading = document.getElementById('active-day-heading');
    if (!dayHeading) return;

    const dayName = DAYS[state.activeDayIndex];
    dayHeading.textContent = dayName;

    // Calculate Daily Legend Hours
    const dayLegendHrs = {};
    state.legends.forEach(l => dayLegendHrs[l.id] = 0);

    for (let slot = 0; slot < 24; slot++) {
      const key = `${state.activeDayIndex}_${slot}`;
      const val = state.grid[key];

      if (typeof val === 'string' && dayLegendHrs[val] !== undefined) {
        dayLegendHrs[val] += 1.0;
      } else if (val && typeof val === 'object' && val.split) {
        const hPerSub = 1.0 / val.split;
        val.sub.forEach(subLegId => {
          if (subLegId && dayLegendHrs[subLegId] !== undefined) {
            dayLegendHrs[subLegId] += hPerSub;
          }
        });
      }
    }

    const dayAllocatedHrs = Object.values(dayLegendHrs).reduce((a, b) => a + b, 0);
    const dayUnallocatedHrs = Math.max(0, 24 - dayAllocatedHrs);
    const dayAllocatedPct = ((dayAllocatedHrs / 24) * 100).toFixed(1);
    const dayUnallocatedPct = (100 - parseFloat(dayAllocatedPct)).toFixed(1);

    const subTitle = document.getElementById('active-day-subtitle');
    if (subTitle) subTitle.textContent = `Allocated: ${formatHours(dayAllocatedHrs)} hrs (${dayAllocatedPct}%) • ${formatHours(dayUnallocatedHrs)} hrs Free (${dayUnallocatedPct}%)`;

    const pctText = document.getElementById('daily-planned-pct-text');
    if (pctText) pctText.textContent = `${dayAllocatedPct}% Allocated for ${dayName}`;

    // Render Daily Stacked Progress Bar & Legend Pills
    const stackedBar = document.getElementById('daily-stacked-progress-bar');
    const pillsContainer = document.getElementById('daily-legend-pills');

    if (stackedBar) stackedBar.innerHTML = '';
    if (pillsContainer) pillsContainer.innerHTML = '';

    state.legends.forEach(legend => {
      const hrs = dayLegendHrs[legend.id] || 0;
      if (hrs > 0) {
        const legendPct = ((hrs / 24) * 100).toFixed(1);

        if (stackedBar) {
          const seg = document.createElement('div');
          seg.style.width = `${legendPct}%`;
          seg.style.backgroundColor = legend.color;
          seg.title = `${legend.name}: ${formatHours(hrs)} hrs (${legendPct}% of ${dayName})`;
          seg.className = 'h-full transition-all duration-300 border-r border-slate-900/40';
          stackedBar.appendChild(seg);
        }

        if (pillsContainer) {
          const pill = document.createElement('span');
          pill.className = 'flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 font-semibold';
          pill.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${legend.color};"></span>
            <span>${escapeHtml(legend.name)}: <strong>${formatHours(hrs)}h</strong> <span class="text-slate-400 font-normal">(${legendPct}%)</span></span>
          `;
          pillsContainer.appendChild(pill);
        }
      }
    });

    if (dayUnallocatedHrs > 0 && pillsContainer) {
      const freePill = document.createElement('span');
      freePill.className = 'flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-400 font-medium';
      freePill.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-600"></span>
        <span>Free: <strong>${formatHours(dayUnallocatedHrs)}h</strong> (${dayUnallocatedPct}%)</span>
      `;
      pillsContainer.appendChild(freePill);
    }

    // Day Navigation Tabs
    const navContainer = document.getElementById('day-tabs-nav');
    if (navContainer) {
      navContainer.innerHTML = '';
      DAYS.forEach((d, index) => {
        const isSelected = index === state.activeDayIndex;

        let dHrs = 0;
        for (let s = 0; s < 24; s++) {
          const v = state.grid[`${index}_${s}`];
          if (typeof v === 'string') dHrs += 1.0;
          else if (v && typeof v === 'object' && v.split) {
            v.sub.forEach(sub => { if (sub) dHrs += (1.0 / v.split); });
          }
        }
        const dPct = ((dHrs / 24) * 100).toFixed(0);

        const tab = document.createElement('button');
        tab.className = `flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
          isSelected
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
        }`;
        tab.innerHTML = `
          <span>${d.substring(0, 3)}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}">${dPct}%</span>
        `;
        tab.addEventListener('click', () => {
          state.activeDayIndex = index;
          renderSingleDayFeed();
        });
        navContainer.appendChild(tab);
      });
    }

    // Render 24 Hourly Feed Cards
    const feedContainer = document.getElementById('single-day-feed');
    if (!feedContainer) return;
    feedContainer.innerHTML = '';

    TIME_SLOTS.forEach((slotLabel, slotIndex) => {
      const cellKey = `${state.activeDayIndex}_${slotIndex}`;
      const val = state.grid[cellKey];

      const card = document.createElement('div');
      card.className = 'mobile-slot-card p-3 rounded-xl border bg-slate-800/90 border-slate-700/80 space-y-2 select-none';

      // Top Header: Time Slot Label & Split Gear Button
      const headerDiv = document.createElement('div');
      headerDiv.className = 'flex items-center justify-between';

      const timeSpan = document.createElement('span');
      timeSpan.className = 'text-xs font-bold text-white flex items-center gap-2';
      timeSpan.innerHTML = `<i data-lucide="clock" class="w-3.5 h-3.5 text-indigo-400"></i> ${slotLabel}`;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'flex items-center gap-1.5';

      // Split button
      const btnSplit = document.createElement('button');
      btnSplit.className = 'px-2 py-1 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition';
      const isSplit = val && typeof val === 'object' && val.split;
      btnSplit.innerHTML = isSplit ? `<i data-lucide="sliders" class="w-3 h-3 text-indigo-400"></i> ${val.split === 2 ? '2 x 30m' : '4 x 15m'}` : `<i data-lucide="scissors" class="w-3 h-3 text-slate-400"></i> Split`;
      btnSplit.addEventListener('click', (e) => {
        e.stopPropagation();
        openSplitModal(cellKey);
      });

      actionsDiv.appendChild(btnSplit);
      headerDiv.appendChild(timeSpan);
      headerDiv.appendChild(actionsDiv);

      card.appendChild(headerDiv);

      // Render Slot Contents (Simple 1-hour vs Sub-divided 15m/30m)
      if (val && typeof val === 'object' && val.split) {
        // Sub-divided slot
        const subGrid = document.createElement('div');
        subGrid.className = `grid grid-cols-${val.split} gap-1.5 pt-1`;

        val.sub.forEach((subLegId, subIdx) => {
          const subLegend = state.legends.find(l => l.id === subLegId);
          const subBtn = document.createElement('button');
          subBtn.className = 'p-2 rounded-lg text-[11px] font-bold text-center border transition flex flex-col items-center justify-center';

          if (subLegend) {
            subBtn.style.backgroundColor = subLegend.color;
            subBtn.style.borderColor = subLegend.color;
            subBtn.style.color = '#ffffff';
            subBtn.textContent = subLegend.name;
          } else {
            subBtn.className += ' bg-slate-900/60 border-slate-700/80 text-slate-400 italic';
            subBtn.textContent = `Unallocated (${formatHours(1.0 / val.split)}h)`;
          }

          subBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            paintCellKey(cellKey, subIdx);
          });

          subGrid.appendChild(subBtn);
        });

        card.appendChild(subGrid);
      } else {
        // Simple 1-hour slot
        const legend = state.legends.find(l => l.id === val);

        const slotBtn = document.createElement('div');
        slotBtn.className = 'p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition';

        if (legend) {
          slotBtn.style.backgroundColor = legend.color;
          slotBtn.style.borderColor = legend.color;
          slotBtn.className += ' text-white font-bold text-xs';
          slotBtn.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-white/30"></span>
              <span>${escapeHtml(legend.name)}</span>
            </div>
            <span class="text-[10px] font-normal opacity-90">1.0 Hour Block</span>
          `;
        } else {
          slotBtn.className += ' bg-slate-900/60 border-slate-700/80 text-slate-400 text-xs italic';
          slotBtn.innerHTML = `
            <span>Unallocated Time</span>
            <span class="text-[10px] font-normal text-slate-500">Tap to assign brush</span>
          `;
        }

        slotBtn.addEventListener('click', () => {
          paintCellKey(cellKey, null);
        });

        card.appendChild(slotBtn);
      }

      feedContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderMobileStickyToolbar() {
    const chipsContainer = document.getElementById('mobile-legend-chips');
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';

    state.legends.forEach(legend => {
      const isSelected = state.activeBrushId === legend.id;
      const chip = document.createElement('button');
      chip.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
        isSelected
          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
          : 'bg-slate-800 text-slate-300 border border-slate-700'
      }`;
      chip.innerHTML = `
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${legend.color};"></span>
        <span>${escapeHtml(legend.name)}</span>
      `;
      chip.addEventListener('click', () => {
        state.activeBrushId = legend.id;
        renderLegends();
        renderMobileStickyToolbar();
        updateActiveBrushBar();
      });
      chipsContainer.appendChild(chip);
    });

    const isEraserSelected = state.activeBrushId === 'eraser';
    const eraserChip = document.createElement('button');
    eraserChip.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
      isEraserSelected
        ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400'
        : 'bg-slate-800 text-slate-400 border border-slate-700'
    }`;
    eraserChip.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
      <span>Eraser</span>
    `;
    eraserChip.addEventListener('click', () => {
      state.activeBrushId = 'eraser';
      renderLegends();
      renderMobileStickyToolbar();
      updateActiveBrushBar();
    });
    chipsContainer.appendChild(eraserChip);
  }

  // Render Legends Panel with DAILY & WEEKLY PERCENTAGES + NOTES
  function renderLegends() {
    const container = document.getElementById('legends-list');
    const filterSelect = document.getElementById('filter-legend-select');
    if (!container || !filterSelect) return;
    
    container.innerHTML = '';
    
    const weeklyLegendHrs = {};
    const activeDayLegendHrs = {};

    state.legends.forEach(l => {
      weeklyLegendHrs[l.id] = 0;
      activeDayLegendHrs[l.id] = 0;
    });
    
    Object.keys(state.grid).forEach(key => {
      const val = state.grid[key];
      const [dayIdx] = key.split('_').map(Number);
      const isActiveDay = dayIdx === state.activeDayIndex;

      if (typeof val === 'string' && weeklyLegendHrs[val] !== undefined) {
        weeklyLegendHrs[val] += 1.0;
        if (isActiveDay) activeDayLegendHrs[val] += 1.0;
      } else if (val && typeof val === 'object' && val.split) {
        const hPerSub = 1.0 / val.split;
        val.sub.forEach(subLegId => {
          if (subLegId && weeklyLegendHrs[subLegId] !== undefined) {
            weeklyLegendHrs[subLegId] += hPerSub;
            if (isActiveDay) activeDayLegendHrs[subLegId] += hPerSub;
          }
        });
      }
    });

    filterSelect.innerHTML = '<option value="all">Show All Categories</option>';

    const activeDayName = DAYS[state.activeDayIndex];

    state.legends.forEach(legend => {
      const isSelected = state.activeBrushId === legend.id;
      
      const weeklyHrs = weeklyLegendHrs[legend.id] || 0;
      const weeklyPct = ((weeklyHrs / 168) * 100).toFixed(1);

      const dayHrs = activeDayLegendHrs[legend.id] || 0;
      const dayPct = ((dayHrs / 24) * 100).toFixed(1);

      const opt = document.createElement('option');
      opt.value = legend.id;
      opt.textContent = `${legend.name} (${formatHours(weeklyHrs)}h - ${weeklyPct}%)`;
      if (state.activeFilterId === legend.id) opt.selected = true;
      filterSelect.appendChild(opt);

      const card = document.createElement('div');
      card.className = `group relative p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
        isSelected 
          ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' 
          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
      }`;
      
      const cardHeader = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${legend.color};"></span>
            <span class="font-bold text-xs text-white truncate">${escapeHtml(legend.name)}</span>
          </div>
          
          <div class="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button class="btn-edit-legend p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60" data-id="${legend.id}" title="Edit Name, Notes & Color">
              <i data-lucide="edit-3" class="w-3 h-3"></i>
            </button>
            <button class="btn-delete-legend p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700/60" data-id="${legend.id}" title="Delete Legend">
              <i data-lucide="trash" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
      `;

      // Legend Notes text
      const notesHtml = legend.notes ? `
        <div class="text-[11px] text-slate-300/90 italic bg-slate-900/90 p-2 rounded-lg border border-slate-700/60 line-clamp-2" title="${escapeHtml(legend.notes)}">
          "${escapeHtml(legend.notes)}"
        </div>
      ` : '';

      const cardStats = `
        <div class="space-y-1 text-xs">
          <div class="flex items-baseline justify-between text-[11px]">
            <span class="text-slate-400">Weekly:</span>
            <span class="font-bold text-slate-100">${formatHours(weeklyHrs)}h <span class="text-[10px] text-indigo-400 font-semibold">(${weeklyPct}%)</span></span>
          </div>

          <div class="flex items-baseline justify-between text-[10px] text-slate-400">
            <span>${activeDayName.substring(0,3)}:</span>
            <span class="font-semibold text-slate-300">${formatHours(dayHrs)}h <span class="text-emerald-400 font-semibold">(${dayPct}%)</span></span>
          </div>
        </div>

        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
          <div class="h-full rounded-full transition-all duration-300" style="width: ${weeklyPct}%; background-color: ${legend.color};"></div>
        </div>
      `;

      card.innerHTML = cardHeader + notesHtml + cardStats;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit-legend') || e.target.closest('.btn-delete-legend')) return;
        state.activeBrushId = legend.id;
        renderLegends();
        renderMobileStickyToolbar();
        updateActiveBrushBar();
      });

      container.appendChild(card);
    });

    // Eraser Card
    const isEraserSelected = state.activeBrushId === 'eraser';
    const eraserCard = document.createElement('div');
    eraserCard.className = `p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
      isEraserSelected 
        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg' 
        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60'
    }`;
    eraserCard.innerHTML = `
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-3.5 h-3.5 rounded-full bg-slate-600 flex-shrink-0"></span>
          <span class="font-bold text-xs text-slate-300">Eraser</span>
        </div>
        <div class="text-[11px] text-slate-400">Unselect / Clear Cell</div>
      </div>
      <div class="text-[10px] text-slate-500 text-right mt-2">Tap box to clear</div>
    `;
    eraserCard.addEventListener('click', () => {
      state.activeBrushId = 'eraser';
      renderLegends();
      renderMobileStickyToolbar();
      updateActiveBrushBar();
    });
    container.appendChild(eraserCard);

    updateActiveBrushBar();
    if (window.lucide) window.lucide.createIcons();
  }

  function updateActiveBrushBar() {
    const barName = document.getElementById('brush-name');
    const barSwatch = document.getElementById('brush-color-swatch');
    if (!barName || !barSwatch) return;

    if (state.activeBrushId === 'eraser') {
      barName.textContent = 'Eraser / Unallocated';
      barSwatch.style.backgroundColor = '#475569';
      return;
    }

    const currentLegend = state.legends.find(l => l.id === state.activeBrushId);
    if (currentLegend) {
      let weeklyHrs = 0;
      let dayHrs = 0;

      Object.keys(state.grid).forEach(key => {
        const val = state.grid[key];
        const [dIdx] = key.split('_').map(Number);
        const isActiveDay = dIdx === state.activeDayIndex;

        if (typeof val === 'string' && val === currentLegend.id) {
          weeklyHrs += 1.0;
          if (isActiveDay) dayHrs += 1.0;
        } else if (val && typeof val === 'object' && val.split) {
          const hPerSub = 1.0 / val.split;
          val.sub.forEach(sub => {
            if (sub === currentLegend.id) {
              weeklyHrs += hPerSub;
              if (isActiveDay) dayHrs += hPerSub;
            }
          });
        }
      });

      const weeklyPct = ((weeklyHrs / 168) * 100).toFixed(1);
      const dayPct = ((dayHrs / 24) * 100).toFixed(1);

      barName.innerHTML = `${escapeHtml(currentLegend.name)} — <span class="text-indigo-300 font-semibold">${formatHours(weeklyHrs)}h (${weeklyPct}% of wk)</span> • <span class="text-emerald-300 font-semibold">${formatHours(dayHrs)}h today (${dayPct}%)</span>`;
      barSwatch.style.backgroundColor = currentLegend.color;
    }
  }

  // Render Uniform 24-Hour Schedule Matrix Grid Table (With Sub-slot In-cell Breakdown)
  function renderGridTable() {
    const tbody = document.getElementById('grid-tbody');
    const tfoot = document.getElementById('grid-tfoot');
    if (!tbody) return;

    tbody.innerHTML = '';

    TIME_SLOTS.forEach((slotLabel, slotIndex) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition-colors';

      const tdTime = document.createElement('td');
      tdTime.className = 'p-2 text-center font-bold text-slate-300 bg-slate-850/90 border-r border-slate-700/80 time-slot-label whitespace-nowrap text-[10px] sm:text-[11px]';
      tdTime.textContent = slotLabel;
      tr.appendChild(tdTime);

      DAYS.forEach((dayName, dayIndex) => {
        const td = document.createElement('td');
        const cellKey = `${dayIndex}_${slotIndex}`;
        const val = state.grid[cellKey];

        td.className = 'cell-slot text-center border-r border-b border-slate-800/70 font-medium text-[11px] relative';
        td.dataset.key = cellKey;
        td.dataset.dayIndex = dayIndex;
        td.dataset.slotIndex = slotIndex;

        // Add Cell Split Trigger Button (Gear/Scissors icon)
        const btnSplitTrigger = document.createElement('button');
        btnSplitTrigger.className = 'cell-split-trigger p-1 bg-slate-900/90 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-slate-300 hover:text-white rounded-md shadow transition';
        btnSplitTrigger.title = 'Split slot into 15m or 30m sub-slots';
        btnSplitTrigger.innerHTML = `<i data-lucide="sliders" class="w-3 h-3"></i>`;
        btnSplitTrigger.addEventListener('click', (e) => {
          e.stopPropagation();
          openSplitModal(cellKey);
        });
        td.appendChild(btnSplitTrigger);

        if (val && typeof val === 'object' && val.split) {
          // SUB-DIVIDED CELL (2 x 30m or 4 x 15m)
          const subContainer = document.createElement('div');
          subContainer.className = 'w-full h-full flex divide-x divide-slate-900/80';

          val.sub.forEach((subLegId, subIdx) => {
            const subLegend = state.legends.find(l => l.id === subLegId);
            const subBar = document.createElement('div');
            subBar.className = 'sub-slot-bar flex-1 h-full flex items-center justify-center text-[10px] font-bold truncate px-1 transition';

            if (subLegend) {
              subBar.style.backgroundColor = subLegend.color;
              subBar.style.color = '#ffffff';
              subBar.textContent = val.split === 4 ? subLegend.name.substring(0, 3) : subLegend.name;
              subBar.title = `${dayName} @ ${slotLabel} (Sub-slot ${subIdx + 1}/${val.split}): ${subLegend.name}`;
            } else {
              subBar.style.backgroundColor = 'transparent';
              subBar.style.color = '#64748b';
              subBar.textContent = '';
              subBar.title = `${dayName} @ ${slotLabel} (Sub-slot ${subIdx + 1}/${val.split}): Unallocated`;
            }

            subBar.addEventListener('click', (e) => {
              e.stopPropagation();
              paintCellKey(cellKey, subIdx, false); // Toggle sub-slot!
            });

            subBar.addEventListener('mouseenter', () => {
              if (isMouseDown) {
                paintCellKey(cellKey, subIdx, true);
              }
            });

            subContainer.appendChild(subBar);
          });

          td.appendChild(subContainer);
        } else {
          // SIMPLE FULL 1-HOUR CELL
          const legend = state.legends.find(l => l.id === val);

          const cellContent = document.createElement('div');
          cellContent.className = 'w-full h-full flex items-center justify-center p-2 font-bold text-xs truncate';

          if (legend) {
            td.style.backgroundColor = legend.color;
            cellContent.style.color = '#ffffff';
            cellContent.textContent = legend.name;
            td.title = `${dayName} @ ${slotLabel}\nCategory: ${legend.name}\n(Click to toggle select/unselect)`;
          } else {
            td.style.backgroundColor = 'transparent';
            cellContent.style.color = '#64748b';
            cellContent.textContent = '';
            td.title = `${dayName} @ ${slotLabel}\nUnallocated (Click to assign active brush)`;
          }

          if (state.activeFilterId !== 'all') {
            if (val !== state.activeFilterId) {
              td.classList.add('cell-dimmed');
            } else {
              td.classList.remove('cell-dimmed');
            }
          }

          cellContent.addEventListener('click', (e) => {
            e.preventDefault();
            paintCellKey(cellKey, null, false); // Toggle full cell!
          });

          cellContent.addEventListener('mouseenter', () => {
            if (isMouseDown) {
              paintCellKey(cellKey, null, true);
            }
          });

          td.appendChild(cellContent);
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    // Render Table Footer Daily Summary Row
    if (tfoot) {
      tfoot.innerHTML = '';
      const trFoot = document.createElement('tr');

      const tdLabel = document.createElement('td');
      tdLabel.className = 'p-3 text-center bg-slate-850 font-bold text-slate-300 text-xs border-r border-slate-700/80';
      tdLabel.innerHTML = 'Daily Total <br/><span class="text-[10px] text-slate-400 font-normal">% of Day</span>';
      trFoot.appendChild(tdLabel);

      DAYS.forEach((dName, dIdx) => {
        let dHrs = 0;
        for (let s = 0; s < 24; s++) {
          const v = state.grid[`${dIdx}_${s}`];
          if (typeof v === 'string') dHrs += 1.0;
          else if (v && typeof v === 'object' && v.split) {
            v.sub.forEach(sub => { if (sub) dHrs += (1.0 / v.split); });
          }
        }
        const dPct = ((dHrs / 24) * 100).toFixed(1);

        const tdDaySum = document.createElement('td');
        tdDaySum.className = 'p-2 text-center border-r border-slate-700/60 bg-slate-800/80';
        tdDaySum.innerHTML = `
          <div class="text-xs font-bold text-white">${formatHours(dHrs)}h</div>
          <div class="text-[10px] font-semibold text-emerald-400">${dPct}%</div>
          <div class="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-1 border border-slate-700">
            <div class="bg-gradient-to-r from-blue-500 to-emerald-500 h-full" style="width: ${dPct}%;"></div>
          </div>
        `;
        trFoot.appendChild(tdDaySum);
      });

      tfoot.appendChild(trFoot);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function updateStatistics() {
    let allocatedHrs = 0;
    
    Object.values(state.grid).forEach(val => {
      if (typeof val === 'string' && state.legends.some(l => l.id === val)) {
        allocatedHrs += 1.0;
      } else if (val && typeof val === 'object' && val.split) {
        const hPerSub = 1.0 / val.split;
        val.sub.forEach(sub => {
          if (sub && state.legends.some(l => l.id === sub)) {
            allocatedHrs += hPerSub;
          }
        });
      }
    });

    const unallocatedHrs = Math.max(0, 168 - allocatedHrs);
    const percent = Math.min(100, Math.round((allocatedHrs / 168) * 100));

    const elAlloc = document.getElementById('stat-allocated');
    const elUnalloc = document.getElementById('stat-unallocated');
    const elPct = document.getElementById('stat-percent');
    const elBar = document.getElementById('stat-progress-bar');

    if (elAlloc) elAlloc.innerHTML = `${formatHours(allocatedHrs)} <span class="text-[10px] sm:text-xs text-slate-400 font-normal">hrs</span>`;
    if (elUnalloc) elUnalloc.innerHTML = `${formatHours(unallocatedHrs)} <span class="text-[10px] sm:text-xs text-slate-400 font-normal">hrs</span>`;
    if (elPct) elPct.textContent = `${percent}%`;
    if (elBar) elBar.style.width = `${percent}%`;

    renderLegends();
    renderMobileStickyToolbar();
  }

  function renderColorPalette() {
    const picker = document.getElementById('color-palette-picker');
    if (!picker) return;
    picker.innerHTML = '';

    COLOR_PALETTE.forEach(colorHex => {
      const swatch = document.createElement('div');
      swatch.className = 'w-7 h-7 rounded-lg cursor-pointer transition-transform hover:scale-110 shadow-sm border border-white/20';
      swatch.style.backgroundColor = colorHex;
      swatch.dataset.hex = colorHex;

      swatch.addEventListener('click', () => {
        document.querySelectorAll('#color-palette-picker div').forEach(d => d.classList.remove('palette-swatch-selected'));
        swatch.classList.add('palette-swatch-selected');
        document.getElementById('input-color-picker').value = colorHex;
        document.getElementById('input-custom-hex').value = colorHex;
      });

      picker.appendChild(swatch);
    });
  }

  // 8. BIND EVENT LISTENERS
  function bindEvents() {
    window.addEventListener('mousedown', () => { isMouseDown = true; });
    window.addEventListener('mouseup', () => { isMouseDown = false; });

    const tabBtnDay = document.getElementById('tab-btn-day');
    if (tabBtnDay) {
      tabBtnDay.addEventListener('click', () => {
        state.viewMode = 'day';
        renderViewModeToggle();
        renderSingleDayFeed();
      });
    }

    const tabBtnGrid = document.getElementById('tab-btn-grid');
    if (tabBtnGrid) {
      tabBtnGrid.addEventListener('click', () => {
        state.viewMode = 'grid';
        renderViewModeToggle();
        renderGridTable();
      });
    }

    const btnPrev = document.getElementById('btn-prev-day');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        state.activeDayIndex = (state.activeDayIndex - 1 + 7) % 7;
        renderSingleDayFeed();
        renderLegends();
      });
    }

    const btnNext = document.getElementById('btn-next-day');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        state.activeDayIndex = (state.activeDayIndex + 1) % 7;
        renderSingleDayFeed();
        renderLegends();
      });
    }

    const ageInput = document.getElementById('user-age-input');
    if (ageInput) {
      const handleAgeChange = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
          state.userAge = Math.max(1, Math.min(120, val));
          renderLifePerspective();
          saveStateToStorage();
        }
      };

      ageInput.addEventListener('input', handleAgeChange);
      ageInput.addEventListener('change', handleAgeChange);
      ageInput.addEventListener('keyup', handleAgeChange);
    }

    const filterSelect = document.getElementById('filter-legend-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        state.activeFilterId = e.target.value;
        renderGridTable();
        renderSingleDayFeed();
      });
    }

    const btnWord = document.getElementById('btn-export-word');
    if (btnWord) {
      btnWord.addEventListener('click', () => {
        if (window.DocxExporter) {
          window.DocxExporter.exportToWord({
            days: DAYS,
            slots: TIME_SLOTS,
            legends: state.legends,
            grid: state.grid,
            age: state.userAge
          });
        }
      });
    }

    const btnReset = document.getElementById('btn-reset-defaults');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset your schedule to standard pre-rendered defaults (8h Sleep, 4h Routine, 9-5 Work)?')) {
          applyPreRenderedDefaults();
          renderGridTable();
          renderSingleDayFeed();
          updateStatistics();
        }
      });
    }

    const btnClear = document.getElementById('btn-clear-all');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (confirm('Clear all allocated hours from the schedule matrix?')) {
          state.grid = {};
          saveStateToStorage();
          renderGridTable();
          renderSingleDayFeed();
          updateStatistics();
        }
      });
    }

    // Add Legend Modal Trigger
    const btnAddLegend = document.getElementById('btn-add-legend');
    if (btnAddLegend) {
      btnAddLegend.addEventListener('click', () => {
        editingLegendId = null;
        document.getElementById('modal-legend-title').textContent = 'Add New Legend & Notes';
        document.getElementById('input-legend-name').value = '';
        document.getElementById('input-legend-notes').value = '';
        const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
        document.getElementById('input-color-picker').value = randomColor;
        document.getElementById('input-custom-hex').value = randomColor;

        openModal();
      });
    }

    const picker = document.getElementById('input-color-picker');
    if (picker) {
      picker.addEventListener('input', (e) => {
        document.getElementById('input-custom-hex').value = e.target.value;
      });
    }

    const customHex = document.getElementById('input-custom-hex');
    if (customHex) {
      customHex.addEventListener('input', (e) => {
        const val = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          document.getElementById('input-color-picker').value = val;
        }
      });
    }

    // Save Legend & Notes
    const btnSaveLegend = document.getElementById('btn-save-legend');
    if (btnSaveLegend) {
      btnSaveLegend.addEventListener('click', () => {
        const name = document.getElementById('input-legend-name').value.trim();
        const notes = document.getElementById('input-legend-notes').value.trim();
        const color = document.getElementById('input-custom-hex').value.trim();

        if (!name) {
          alert('Please enter a name for your legend.');
          return;
        }

        if (editingLegendId) {
          const legend = state.legends.find(l => l.id === editingLegendId);
          if (legend) {
            legend.name = name;
            legend.notes = notes;
            legend.color = color;
          }
        } else {
          const newId = 'leg_' + Date.now();
          const newLegend = { id: newId, name, notes, color };
          state.legends.push(newLegend);
          state.activeBrushId = newId;
        }

        saveStateToStorage();
        renderLegends();
        renderMobileStickyToolbar();
        renderGridTable();
        renderSingleDayFeed();
        updateStatistics();
        closeModal();
      });
    }

    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);

    const btnCancelModal = document.getElementById('btn-cancel-modal');
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

    // Edit/Delete Legend
    const legendsList = document.getElementById('legends-list');
    if (legendsList) {
      legendsList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-legend');
        const deleteBtn = e.target.closest('.btn-delete-legend');

        if (editBtn) {
          const id = editBtn.dataset.id;
          const legend = state.legends.find(l => l.id === id);
          if (legend) {
            editingLegendId = id;
            document.getElementById('modal-legend-title').textContent = 'Edit Legend & Notes';
            document.getElementById('input-legend-name').value = legend.name;
            document.getElementById('input-legend-notes').value = legend.notes || '';
            document.getElementById('input-color-picker').value = legend.color;
            document.getElementById('input-custom-hex').value = legend.color;
            openModal();
          }
        }

        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          const legend = state.legends.find(l => l.id === id);
          if (legend && confirm(`Delete legend "${legend.name}"? Allocated hours will become unallocated.`)) {
            state.legends = state.legends.filter(l => l.id !== id);
            
            Object.keys(state.grid).forEach(key => {
              const val = state.grid[key];
              if (val === id) {
                delete state.grid[key];
              } else if (val && typeof val === 'object' && val.split) {
                val.sub = val.sub.map(s => s === id ? null : s);
                if (val.sub.every(s => !s)) delete state.grid[key];
              }
            });

            if (state.activeBrushId === id) {
              state.activeBrushId = state.legends[0]?.id || 'eraser';
            }

            saveStateToStorage();
            renderLegends();
            renderMobileStickyToolbar();
            renderGridTable();
            renderSingleDayFeed();
            updateStatistics();
          }
        }
      });
    }

    // Cell Split Modal Buttons
    const btnCloseSplit = document.getElementById('btn-close-split-modal');
    if (btnCloseSplit) btnCloseSplit.addEventListener('click', closeSplitModal);

    const btnSplitFull = document.getElementById('btn-split-full');
    if (btnSplitFull) btnSplitFull.addEventListener('click', () => { if (splittingCellKey) splitCell(splittingCellKey, 1); closeSplitModal(); });

    const btnSplit30m = document.getElementById('btn-split-30m');
    if (btnSplit30m) btnSplit30m.addEventListener('click', () => { if (splittingCellKey) splitCell(splittingCellKey, 2); closeSplitModal(); });

    const btnSplit15m = document.getElementById('btn-split-15m');
    if (btnSplit15m) btnSplit15m.addEventListener('click', () => { if (splittingCellKey) splitCell(splittingCellKey, 4); closeSplitModal(); });
  }

  function openModal() {
    const modal = document.getElementById('modal-legend');
    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('modal-legend');
    if (modal) modal.classList.remove('active');
  }

  function openSplitModal(cellKey) {
    splittingCellKey = cellKey;
    const modal = document.getElementById('modal-cell-split');
    if (modal) modal.classList.add('active');
  }

  function closeSplitModal() {
    splittingCellKey = null;
    const modal = document.getElementById('modal-cell-split');
    if (modal) modal.classList.remove('active');
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  init();
});
