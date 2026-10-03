/**
 * 168 Hours Weekly Life & Time Planner - Core App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Constants & Configuration
  const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
    { id: 'leg_sleep', name: 'Sleep (8 hrs)', color: '#3b82f6' },
    { id: 'leg_routine', name: 'Routine Work (4 hrs)', color: '#f59e0b' },
    { id: 'leg_work', name: '9-to-5 Work', color: '#10b981' },
    { id: 'leg_fitness', name: 'Fitness & Health', color: '#ef4444' },
    { id: 'leg_learning', name: 'Learning & Growth', color: '#8b5cf6' },
    { id: 'leg_family', name: 'Family & Social', color: '#ec4899' },
  ];

  const isMobileInitial = window.innerWidth < 768;

  // 2. Application State
  let state = {
    legends: [...DEFAULT_LEGENDS],
    activeBrushId: 'leg_sleep',
    grid: {},
    userAge: 28,
    activeFilterId: 'all',
    viewMode: isMobileInitial ? 'day' : 'grid', // 'day' or 'grid'
    activeDayIndex: 0, // 0 = Saturday
    unitMinutes: 60, // Default 1 Hour (60 mins). Options: 15, 30, 60, 120, 240
  };

  let TIME_SLOTS = []; // Generated dynamically based on unitMinutes
  let isMouseDown = false;
  let editingLegendId = null;

  // 3. Dynamic Time Slots Generator
  function generateTimeSlots(unitMins) {
    const slots = [];
    const totalSlots = Math.round(1440 / unitMins);
    const startOffsetMins = 1320; // 10:00 PM = 22 * 60 = 1320 mins

    for (let i = 0; i < totalSlots; i++) {
      const startMins = (startOffsetMins + i * unitMins) % 1440;
      const endMins = (startOffsetMins + (i + 1) * unitMins) % 1440;
      const startStr = formatTime12h(startMins);
      const endStr = formatTime12h(endMins === 0 ? 0 : endMins);
      slots.push(`${startStr} - ${endStr}`);
    }
    return slots;
  }

  function formatTime12h(totalMins) {
    let h = Math.floor(totalMins / 60) % 24;
    let m = totalMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const mStr = m < 10 ? '0' + m : m;
    const hStr = h12 < 10 ? '0' + h12 : h12;
    return `${hStr}:${mStr} ${ampm}`;
  }

  // Helper: Format decimal hours nicely
  function formatHours(hrs) {
    if (hrs % 1 === 0) return hrs.toString();
    return hrs.toFixed(2).replace(/\.?0+$/, '');
  }

  // 4. Initialize App
  function init() {
    loadStateFromStorage();
    TIME_SLOTS = generateTimeSlots(state.unitMinutes);

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

  // 5. State Persistence (LocalStorage)
  function saveStateToStorage() {
    try {
      localStorage.setItem('168h_planner_state', JSON.stringify({
        legends: state.legends,
        grid: state.grid,
        userAge: state.userAge,
        unitMinutes: state.unitMinutes
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
        if (parsed.legends && parsed.legends.length > 0) state.legends = parsed.legends;
        if (parsed.grid) state.grid = parsed.grid;
        if (parsed.userAge !== undefined) state.userAge = parsed.userAge;
        if (parsed.unitMinutes) state.unitMinutes = parseInt(parsed.unitMinutes) || 60;

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

  /**
   * Pre-rendered Defaults for ANY time block unit (15m, 30m, 60m, 120m, 240m)
   */
  function applyPreRenderedDefaults() {
    state.grid = {};
    const unit = state.unitMinutes || 60;
    const totalSlots = Math.round(1440 / unit);
    const startOffsetMins = 1320; // 10 PM

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let slot = 0; slot < totalSlots; slot++) {
        const startMins = (startOffsetMins + slot * unit) % 1440;
        
        // 1. Sleep: 10 PM (1320) to 6 AM (360)
        const isSleep = (startMins >= 1320 && startMins < 1440) || (startMins >= 0 && startMins < 360);
        
        // 2. Routine Work: 6 AM - 8 AM (360-480) & 7 PM - 9 PM (1140-1260)
        const isRoutine = (startMins >= 360 && startMins < 480) || (startMins >= 1140 && startMins < 1260);

        // 3. 9-to-5 Work: Sunday to Thursday (index 1 to 5), 9 AM - 5 PM (540-1020)
        const isWork = (dayIndex >= 1 && dayIndex <= 5) && (startMins >= 540 && startMins < 1020);

        const key = `${dayIndex}_${slot}`;
        if (isSleep) {
          state.grid[key] = 'leg_sleep';
        } else if (isRoutine) {
          state.grid[key] = 'leg_routine';
        } else if (isWork) {
          state.grid[key] = 'leg_work';
        }
      }
    }

    saveStateToStorage();
  }

  // Change Time Block Unit (15m, 30m, 1h, 2h, 4h)
  function setTimeBlockUnit(newUnitMins) {
    state.unitMinutes = newUnitMins;
    TIME_SLOTS = generateTimeSlots(newUnitMins);
    applyPreRenderedDefaults(); // Re-apply pre-rendered defaults for new slot resolution

    // Update Unit Badge text
    const badge = document.getElementById('active-unit-badge');
    if (badge) {
      const labels = { 15: '15 Min Blocks', 30: '30 Min Blocks', 60: '1 Hour Blocks', 120: '2 Hour Blocks', 240: '4 Hour Blocks' };
      badge.textContent = labels[newUnitMins] || `${newUnitMins} Min Blocks`;
    }

    renderGridTable();
    renderSingleDayFeed();
    updateStatistics();
    saveStateToStorage();
  }

  // 6. Render Functions

  function renderLifePerspective() {
    const age = Math.max(1, Math.min(120, parseInt(state.userAge) || 28));
    const totalWeeks = 4000;
    const avgLifespanYears = 76.92;

    const weeksLived = Math.min(totalWeeks, Math.round(age * 52.1429));
    const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
    const livedPct = ((weeksLived / totalWeeks) * 100).toFixed(1);
    const remainingPct = (100 - parseFloat(livedPct)).toFixed(1);

    const yearsRemaining = Math.max(0, avgLifespanYears - age).toFixed(1);
    const lifetimeHoursLeft = (weeksRemaining * 168);

    const ageInput = document.getElementById('user-age-input');
    if (ageInput && ageInput.value != age) {
      ageInput.value = age;
    }

    const descText = document.getElementById('life-perspective-text');
    if (descText) {
      descText.innerHTML = `
        At age <strong class="text-white font-bold">${age}</strong>, you have spent <strong class="text-amber-400 font-bold">${weeksLived.toLocaleString()} weeks</strong> (~${livedPct}%) of an average 4,000-week lifespan and have <strong class="text-emerald-400 font-bold">${weeksRemaining.toLocaleString()} weeks</strong> remaining. Make each 168-hour week count!
      `;
    }

    const elWeeksLived = document.getElementById('metric-weeks-lived');
    const elPctLived = document.getElementById('metric-pct-lived');
    if (elWeeksLived) elWeeksLived.textContent = weeksLived.toLocaleString();
    if (elPctLived) elPctLived.textContent = `(${livedPct}%)`;

    const elWeeksRem = document.getElementById('metric-weeks-remaining');
    const elPctRem = document.getElementById('metric-pct-remaining');
    if (elWeeksRem) elWeeksRem.textContent = weeksRemaining.toLocaleString();
    if (elPctRem) elPctRem.textContent = `(${remainingPct}%)`;

    const elYearsRem = document.getElementById('metric-years-remaining');
    if (elYearsRem) elYearsRem.textContent = `${yearsRemaining} yrs`;

    const elLifetimeHours = document.getElementById('metric-lifetime-hours');
    if (elLifetimeHours) elLifetimeHours.textContent = `${lifetimeHoursLeft.toLocaleString()} hrs`;

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

    const totalSlots = TIME_SLOTS.length;
    const hoursPerSlot = state.unitMinutes / 60;

    let dayAllocatedSlots = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      const key = `${state.activeDayIndex}_${slot}`;
      if (state.grid[key] && state.legends.some(l => l.id === state.grid[key])) {
        dayAllocatedSlots++;
      }
    }

    const dayAllocatedHrs = dayAllocatedSlots * hoursPerSlot;
    const dayUnallocatedHrs = 24 - dayAllocatedHrs;

    const subTitle = document.getElementById('active-day-subtitle');
    if (subTitle) subTitle.textContent = `Allocated: ${formatHours(dayAllocatedHrs)} hrs • ${formatHours(dayUnallocatedHrs)} hrs Unallocated`;

    // Day Navigation Tabs
    const navContainer = document.getElementById('day-tabs-nav');
    if (navContainer) {
      navContainer.innerHTML = '';
      DAYS.forEach((d, index) => {
        const isSelected = index === state.activeDayIndex;
        const tab = document.createElement('button');
        tab.className = `flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
          isSelected
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
        }`;
        tab.textContent = d.substring(0, 3);
        tab.addEventListener('click', () => {
          state.activeDayIndex = index;
          renderSingleDayFeed();
        });
        navContainer.appendChild(tab);
      });
    }

    // Render Hourly Feed Cards
    const feedContainer = document.getElementById('single-day-feed');
    if (!feedContainer) return;
    feedContainer.innerHTML = '';

    TIME_SLOTS.forEach((slotLabel, slotIndex) => {
      const cellKey = `${state.activeDayIndex}_${slotIndex}`;
      const legendId = state.grid[cellKey];
      const legend = state.legends.find(l => l.id === legendId);

      const isFilteredOut = state.activeFilterId !== 'all' && legendId !== state.activeFilterId;

      const card = document.createElement('div');
      card.className = `mobile-slot-card p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none ${
        isFilteredOut ? 'opacity-30 grayscale' : ''
      } ${
        legend
          ? 'bg-slate-800/90 border-slate-700'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`;

      const leftDiv = document.createElement('div');
      leftDiv.className = 'flex items-center gap-3 min-w-0';

      const colorSwatch = document.createElement('div');
      colorSwatch.className = 'w-4 h-4 rounded-full flex-shrink-0 shadow-sm border border-white/20';
      colorSwatch.style.backgroundColor = legend ? legend.color : '#475569';

      const textDiv = document.createElement('div');
      textDiv.className = 'min-w-0';
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'text-xs font-bold text-slate-200';
      timeLabel.textContent = slotLabel;

      const statusLabel = document.createElement('div');
      statusLabel.className = 'text-[11px] font-medium truncate mt-0.5';
      if (legend) {
        statusLabel.style.color = legend.color;
        statusLabel.textContent = `${legend.name} (${formatHours(hoursPerSlot)}h)`;
      } else {
        statusLabel.className = 'text-[11px] font-medium text-slate-500 italic';
        statusLabel.textContent = `Unallocated (${formatHours(hoursPerSlot)}h block)`;
      }

      textDiv.appendChild(timeLabel);
      textDiv.appendChild(statusLabel);

      leftDiv.appendChild(colorSwatch);
      leftDiv.appendChild(textDiv);

      // Inline Quick Select Dropdown
      const select = document.createElement('select');
      select.className = 'px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500';
      
      const unallocOpt = document.createElement('option');
      unallocOpt.value = 'eraser';
      unallocOpt.textContent = 'Unallocated';
      if (!legend) unallocOpt.selected = true;
      select.appendChild(unallocOpt);

      state.legends.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.name;
        if (legend && legend.id === l.id) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', (e) => {
        e.stopPropagation();
        const val = e.target.value;
        if (val === 'eraser') {
          delete state.grid[cellKey];
        } else {
          state.grid[cellKey] = val;
        }
        saveStateToStorage();
        renderSingleDayFeed();
        renderGridTable();
        updateStatistics();
      });

      card.appendChild(leftDiv);
      card.appendChild(select);

      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'SELECT') return;
        paintSlotKey(cellKey);
        renderSingleDayFeed();
      });

      feedContainer.appendChild(card);
    });
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

  function renderLegends() {
    const container = document.getElementById('legends-list');
    const filterSelect = document.getElementById('filter-legend-select');
    if (!container || !filterSelect) return;
    
    container.innerHTML = '';
    
    const hoursPerSlot = state.unitMinutes / 60;
    const legendSlotCounts = {};
    state.legends.forEach(l => legendSlotCounts[l.id] = 0);
    
    Object.values(state.grid).forEach(legendId => {
      if (legendSlotCounts[legendId] !== undefined) {
        legendSlotCounts[legendId]++;
      }
    });

    filterSelect.innerHTML = '<option value="all">Show All Categories</option>';

    state.legends.forEach(legend => {
      const isSelected = state.activeBrushId === legend.id;
      const slotCount = legendSlotCounts[legend.id] || 0;
      const allocatedHrs = slotCount * hoursPerSlot;

      const opt = document.createElement('option');
      opt.value = legend.id;
      opt.textContent = `${legend.name} (${formatHours(allocatedHrs)}h)`;
      if (state.activeFilterId === legend.id) opt.selected = true;
      filterSelect.appendChild(opt);

      const card = document.createElement('div');
      card.className = `group relative p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected 
          ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' 
          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
      }`;
      
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${legend.color};"></span>
            <span class="font-bold text-xs text-white truncate">${escapeHtml(legend.name)}</span>
          </div>
          
          <div class="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button class="btn-edit-legend p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60" data-id="${legend.id}" title="Edit Name/Color">
              <i data-lucide="edit-3" class="w-3 h-3"></i>
            </button>
            <button class="btn-delete-legend p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700/60" data-id="${legend.id}" title="Delete Legend">
              <i data-lucide="trash" class="w-3 h-3"></i>
            </button>
          </div>
        </div>

        <div class="flex items-baseline justify-between text-xs">
          <span class="text-slate-400 font-medium text-[11px]">Allocated:</span>
          <span class="font-bold text-slate-100 text-xs">${formatHours(allocatedHrs)} <span class="text-[10px] font-normal text-slate-400">hrs</span></span>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit-legend') || e.target.closest('.btn-delete-legend')) return;
        state.activeBrushId = legend.id;
        renderLegends();
        renderMobileStickyToolbar();
        updateActiveBrushBar();
      });

      container.appendChild(card);
    });

    const isEraserSelected = state.activeBrushId === 'eraser';
    const eraserCard = document.createElement('div');
    eraserCard.className = `p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
      isEraserSelected 
        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg' 
        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60'
    }`;
    eraserCard.innerHTML = `
      <div class="flex items-center gap-2 mb-1.5">
        <span class="w-3.5 h-3.5 rounded-full bg-slate-600 flex-shrink-0"></span>
        <span class="font-bold text-xs text-slate-300">Eraser</span>
      </div>
      <div class="text-[11px] text-slate-500 text-right">Clear Cell</div>
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
      barName.textContent = currentLegend.name;
      barSwatch.style.backgroundColor = currentLegend.color;
    }
  }

  // Render 168-Hour Schedule Matrix Grid Table
  function renderGridTable() {
    const tbody = document.getElementById('grid-tbody');
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
        const legendId = state.grid[cellKey];
        const legend = state.legends.find(l => l.id === legendId);

        td.className = 'cell-slot p-2 text-center border-r border-b border-slate-800/70 transition-all font-medium text-[11px]';
        td.dataset.key = cellKey;
        td.dataset.dayIndex = dayIndex;
        td.dataset.slotIndex = slotIndex;

        if (legend) {
          td.style.backgroundColor = legend.color;
          td.style.color = '#ffffff';
          td.textContent = legend.name;
          td.title = `${dayName} @ ${slotLabel}\nCategory: ${legend.name}`;
        } else {
          td.style.backgroundColor = 'transparent';
          td.style.color = '#64748b';
          td.textContent = '';
          td.title = `${dayName} @ ${slotLabel}\nUnallocated`;
        }

        if (state.activeFilterId !== 'all') {
          if (legendId !== state.activeFilterId) {
            td.classList.add('cell-dimmed');
          } else {
            td.classList.remove('cell-dimmed');
          }
        }

        td.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isMouseDown = true;
          paintCell(td);
        });

        td.addEventListener('mouseenter', () => {
          if (isMouseDown) {
            paintCell(td);
          }
        });

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function paintSlotKey(cellKey) {
    if (state.activeBrushId === 'eraser') {
      delete state.grid[cellKey];
    } else {
      state.grid[cellKey] = state.activeBrushId;
    }
    saveStateToStorage();
    renderGridTable();
    updateStatistics();
  }

  function paintCell(tdCell) {
    const key = tdCell.dataset.key;
    if (!key) return;

    paintSlotKey(key);

    const legendId = state.grid[key];
    const legend = state.legends.find(l => l.id === legendId);
    const dayName = DAYS[tdCell.dataset.dayIndex];
    const slotLabel = TIME_SLOTS[tdCell.dataset.slotIndex];

    if (legend) {
      tdCell.style.backgroundColor = legend.color;
      tdCell.style.color = '#ffffff';
      tdCell.textContent = legend.name;
      tdCell.title = `${dayName} @ ${slotLabel}\nCategory: ${legend.name}`;
    } else {
      tdCell.style.backgroundColor = 'transparent';
      tdCell.style.color = '#64748b';
      tdCell.textContent = '';
      tdCell.title = `${dayName} @ ${slotLabel}\nUnallocated`;
    }

    tdCell.classList.add('cell-painting');
    setTimeout(() => tdCell.classList.remove('cell-painting'), 150);

    if (state.viewMode === 'day') {
      renderSingleDayFeed();
    }
  }

  function updateStatistics() {
    const hoursPerSlot = state.unitMinutes / 60;
    let filledSlots = 0;
    
    Object.values(state.grid).forEach(legendId => {
      if (legendId && state.legends.some(l => l.id === legendId)) {
        filledSlots++;
      }
    });

    const allocatedHrs = filledSlots * hoursPerSlot;
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

  // 7. Bind Event Listeners
  function bindEvents() {
    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Time Block Unit Selector Change
    const blockSelect = document.getElementById('select-block-unit');
    if (blockSelect) {
      blockSelect.value = state.unitMinutes.toString();
      blockSelect.addEventListener('change', (e) => {
        const newUnit = parseInt(e.target.value) || 60;
        setTimeBlockUnit(newUnit);
      });
    }

    // View Mode Tab Switching
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

    // Single Day Navigation Prev/Next
    const btnPrev = document.getElementById('btn-prev-day');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        state.activeDayIndex = (state.activeDayIndex - 1 + 7) % 7;
        renderSingleDayFeed();
      });
    }

    const btnNext = document.getElementById('btn-next-day');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        state.activeDayIndex = (state.activeDayIndex + 1) % 7;
        renderSingleDayFeed();
      });
    }

    // Dynamic Age Input Listeners
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

    // Filter Select
    const filterSelect = document.getElementById('filter-legend-select');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        state.activeFilterId = e.target.value;
        renderGridTable();
        renderSingleDayFeed();
      });
    }

    // Export Word Button
    const btnWord = document.getElementById('btn-export-word');
    if (btnWord) {
      btnWord.addEventListener('click', () => {
        if (window.DocxExporter) {
          window.DocxExporter.exportToWord({
            days: DAYS,
            slots: TIME_SLOTS,
            legends: state.legends,
            grid: state.grid,
            age: state.userAge,
            unitMinutes: state.unitMinutes
          });
        }
      });
    }

    // Reset Defaults Button
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

    // Clear All Grid Button
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
        document.getElementById('modal-legend-title').textContent = 'Add New Legend';
        document.getElementById('input-legend-name').value = '';
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

    const btnSaveLegend = document.getElementById('btn-save-legend');
    if (btnSaveLegend) {
      btnSaveLegend.addEventListener('click', () => {
        const name = document.getElementById('input-legend-name').value.trim();
        const color = document.getElementById('input-custom-hex').value.trim();

        if (!name) {
          alert('Please enter a name for your legend.');
          return;
        }

        if (editingLegendId) {
          const legend = state.legends.find(l => l.id === editingLegendId);
          if (legend) {
            legend.name = name;
            legend.color = color;
          }
        } else {
          const newId = 'leg_' + Date.now();
          const newLegend = { id: newId, name, color };
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
            document.getElementById('modal-legend-title').textContent = 'Edit Legend';
            document.getElementById('input-legend-name').value = legend.name;
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
              if (state.grid[key] === id) {
                delete state.grid[key];
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
  }

  function openModal() {
    const modal = document.getElementById('modal-legend');
    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('modal-legend');
    if (modal) modal.classList.remove('active');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  init();
});
