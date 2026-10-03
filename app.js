/**
 * 168 Hours Weekly Life & Time Planner - Core App Logic
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
    { id: 'leg_sleep', name: 'Sleep (8 hrs)', color: '#3b82f6' },
    { id: 'leg_routine', name: 'Routine Work (4 hrs)', color: '#f59e0b' },
    { id: 'leg_work', name: '9-to-5 Work', color: '#10b981' },
    { id: 'leg_fitness', name: 'Fitness & Health', color: '#ef4444' },
    { id: 'leg_learning', name: 'Learning & Growth', color: '#8b5cf6' },
    { id: 'leg_family', name: 'Family & Social', color: '#ec4899' },
  ];

  // 2. Application State
  let state = {
    legends: [...DEFAULT_LEGENDS],
    activeBrushId: 'leg_sleep', // Current selected legend brush
    grid: {}, // Key: `${dayIndex}_${slotIndex}`, Value: legendId
    userAge: 28,
    activeFilterId: 'all',
  };

  let isMouseDown = false;
  let editingLegendId = null;

  // 3. Initialize App
  function init() {
    loadStateFromStorage();
    renderLifePerspective();
    renderColorPalette();
    renderLegends();
    renderGridTable();
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
        if (parsed.legends && parsed.legends.length > 0) state.legends = parsed.legends;
        if (parsed.grid) state.grid = parsed.grid;
        if (parsed.userAge) state.userAge = parsed.userAge;

        // Ensure active brush exists
        if (!state.legends.find(l => l.id === state.activeBrushId)) {
          state.activeBrushId = state.legends[0].id;
        }
        return;
      }
    } catch (e) {
      console.warn('Could not load saved state, using defaults', e);
    }

    // If no storage, build pre-rendered default schedule!
    applyPreRenderedDefaults();
  }

  /**
   * Pre-rendered Defaults Config:
   * - 8 hours sleep: 10 PM to 6 AM (Slots 0 to 7) every day across all 7 days
   * - 4 hours routine work: 6 AM - 8 AM (Slots 8, 9) and 7 PM - 9 PM (Slots 21, 22) every day
   * - 9 to 5 work: 9 AM to 5 PM (Slots 11 to 18) on workdays (Sun, Mon, Tue, Wed, Thu)
   */
  function applyPreRenderedDefaults() {
    state.grid = {};
    
    // 7 days loop
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // 1. Sleep: 10 PM to 6 AM (Slots 0,1,2,3,4,5,6,7) -> 8 hours
      for (let slot = 0; slot <= 7; slot++) {
        state.grid[`${dayIndex}_${slot}`] = 'leg_sleep';
      }

      // 2. Routine Work: 6 AM to 8 AM (Slots 8, 9) and 7 PM to 9 PM (Slots 21, 22) -> 4 hours
      state.grid[`${dayIndex}_8`] = 'leg_routine';
      state.grid[`${dayIndex}_9`] = 'leg_routine';
      state.grid[`${dayIndex}_21`] = 'leg_routine';
      state.grid[`${dayIndex}_22`] = 'leg_routine';

      // 3. 9-to-5 Work: General Workdays (Sunday - Thursday, index 1 to 5)
      // Slots 11 to 18 (9:00 AM to 5:00 PM) -> 8 hours per workday (40 total)
      if (dayIndex >= 1 && dayIndex <= 5) {
        for (let slot = 11; slot <= 18; slot++) {
          state.grid[`${dayIndex}_${slot}`] = 'leg_work';
        }
      }
    }

    saveStateToStorage();
  }

  // 5. Render Functions

  // Life Perspective Calculator
  function renderLifePerspective() {
    const age = parseInt(state.userAge) || 28;
    const totalWeeks = 4000;
    const weeksLived = Math.min(totalWeeks, Math.round(age * 52.1429));
    const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
    const livedPct = ((weeksLived / totalWeeks) * 100).toFixed(1);

    document.getElementById('user-age-input').value = age;
    document.getElementById('weeks-lived-text').textContent = `${weeksLived.toLocaleString()} weeks`;
    document.getElementById('weeks-remaining-text').textContent = `${weeksRemaining.toLocaleString()} weeks`;
    document.getElementById('life-weeks-badge').textContent = `${weeksLived.toLocaleString()} / 4,000 (${livedPct}%)`;

    document.getElementById('life-perspective-text').innerHTML = `
      You have spent <strong class="text-amber-400 font-bold">${weeksLived.toLocaleString()} weeks</strong> (~${livedPct}%) of an average 4,000-week lifespan and have <strong class="text-emerald-400 font-bold">${weeksRemaining.toLocaleString()} weeks</strong> remaining. Each week holds 168 precious hours — design them intentionally!
    `;
  }

  // Legends & Active Brush Panel
  function renderLegends() {
    const container = document.getElementById('legends-list');
    const filterSelect = document.getElementById('filter-legend-select');
    
    container.innerHTML = '';
    
    // Calculate allocated hours per legend
    const hoursCount = {};
    state.legends.forEach(l => hoursCount[l.id] = 0);
    
    Object.values(state.grid).forEach(legendId => {
      if (hoursCount[legendId] !== undefined) {
        hoursCount[legendId]++;
      }
    });

    // Populate filter select options
    filterSelect.innerHTML = '<option value="all">Show All Categories</option>';

    // Render legend cards
    state.legends.forEach(legend => {
      const isSelected = state.activeBrushId === legend.id;
      const count = hoursCount[legend.id] || 0;

      // Add to filter
      const opt = document.createElement('option');
      opt.value = legend.id;
      opt.textContent = `${legend.name} (${count}h)`;
      if (state.activeFilterId === legend.id) opt.selected = true;
      filterSelect.appendChild(opt);

      const card = document.createElement('div');
      card.className = `group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected 
          ? 'bg-slate-800 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10' 
          : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
      }`;
      
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${legend.color};"></span>
            <span class="font-bold text-xs text-white truncate">${escapeHtml(legend.name)}</span>
          </div>
          
          <!-- Actions dropdown / buttons on hover -->
          <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button class="btn-edit-legend p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60" data-id="${legend.id}" title="Edit Name/Color">
              <i data-lucide="edit-3" class="w-3 h-3"></i>
            </button>
            <button class="btn-delete-legend p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700/60" data-id="${legend.id}" title="Delete Legend">
              <i data-lucide="trash" class="w-3 h-3"></i>
            </button>
          </div>
        </div>

        <div class="flex items-baseline justify-between text-xs">
          <span class="text-slate-400 font-medium">Allocated:</span>
          <span class="font-bold text-slate-100">${count} <span class="text-[10px] font-normal text-slate-400">hrs</span></span>
        </div>
      `;

      // Select brush on click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit-legend') || e.target.closest('.btn-delete-legend')) return;
        state.activeBrushId = legend.id;
        renderLegends();
        updateActiveBrushBar();
      });

      container.appendChild(card);
    });

    // Add Eraser Brush Card
    const isEraserSelected = state.activeBrushId === 'eraser';
    const eraserCard = document.createElement('div');
    eraserCard.className = `p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
      isEraserSelected 
        ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg' 
        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60'
    }`;
    eraserCard.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="w-3.5 h-3.5 rounded-full bg-slate-600 flex-shrink-0"></span>
        <span class="font-bold text-xs text-slate-300">Eraser (Unallocate)</span>
      </div>
      <div class="text-xs text-slate-500 text-right">Clear Cell</div>
    `;
    eraserCard.addEventListener('click', () => {
      state.activeBrushId = 'eraser';
      renderLegends();
      updateActiveBrushBar();
    });
    container.appendChild(eraserCard);

    updateActiveBrushBar();

    if (window.lucide) window.lucide.createIcons();
  }

  function updateActiveBrushBar() {
    const barName = document.getElementById('brush-name');
    const barSwatch = document.getElementById('brush-color-swatch');

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
    tbody.innerHTML = '';

    TIME_SLOTS.forEach((slotLabel, slotIndex) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition-colors';

      // Time Slot Column (Row Header)
      const tdTime = document.createElement('td');
      tdTime.className = 'p-2.5 text-center font-bold text-slate-300 bg-slate-850/90 border-r border-slate-700/80 time-slot-label whitespace-nowrap text-[11px]';
      tdTime.textContent = slotLabel;
      tr.appendChild(tdTime);

      // 7 Days Columns (Saturday to Friday)
      DAYS.forEach((dayName, dayIndex) => {
        const td = document.createElement('td');
        const cellKey = `${dayIndex}_${slotIndex}`;
        const legendId = state.grid[cellKey];
        const legend = state.legends.find(l => l.id === legendId);

        td.className = 'cell-slot p-2 text-center border-r border-b border-slate-800/70 transition-all font-medium text-[11px]';
        td.dataset.key = cellKey;
        td.dataset.dayIndex = dayIndex;
        td.dataset.slotIndex = slotIndex;

        // Apply background color if assigned
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

        // Apply filter dimming if active
        if (state.activeFilterId !== 'all') {
          if (legendId !== state.activeFilterId) {
            td.classList.add('cell-dimmed');
          } else {
            td.classList.remove('cell-dimmed');
          }
        }

        // Drag to paint events
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

  // Paint Cell logic
  function paintCell(tdCell) {
    const key = tdCell.dataset.key;
    if (!key) return;

    if (state.activeBrushId === 'eraser') {
      delete state.grid[key];
    } else {
      state.grid[key] = state.activeBrushId;
    }

    // Re-render cell immediately for smooth performance
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

    updateStatistics();
    saveStateToStorage();
  }

  // Update Header Counters & Percentages
  function updateStatistics() {
    let allocated = 0;
    
    // Count filled cells
    Object.values(state.grid).forEach(legendId => {
      if (legendId && state.legends.some(l => l.id === legendId)) {
        allocated++;
      }
    });

    const unallocated = 168 - allocated;
    const percent = Math.min(100, Math.round((allocated / 168) * 100));

    document.getElementById('stat-allocated').innerHTML = `${allocated} <span class="text-xs text-slate-400 font-normal">hrs</span>`;
    document.getElementById('stat-unallocated').innerHTML = `${unallocated} <span class="text-xs text-slate-400 font-normal">hrs</span>`;
    document.getElementById('stat-percent').textContent = `${percent}%`;
    document.getElementById('stat-progress-bar').style.width = `${percent}%`;

    // Re-render legend totals count in cards
    renderLegends();
  }

  // Render Color Palette in Modal
  function renderColorPalette() {
    const picker = document.getElementById('color-palette-picker');
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

  // 6. Bind Event Listeners
  function bindEvents() {
    // Mouseup globally to end dragging paint brush
    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Age Input change
    document.getElementById('user-age-input').addEventListener('input', (e) => {
      state.userAge = Math.max(1, Math.min(120, parseInt(e.target.value) || 28));
      renderLifePerspective();
      saveStateToStorage();
    });

    // Filter Select change
    document.getElementById('filter-legend-select').addEventListener('change', (e) => {
      state.activeFilterId = e.target.value;
      renderGridTable();
    });

    // Export Word Button
    document.getElementById('btn-export-word').addEventListener('click', () => {
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

    // Reset Defaults Button
    document.getElementById('btn-reset-defaults').addEventListener('click', () => {
      if (confirm('Reset your schedule to the standard pre-rendered defaults (8h Sleep, 4h Routine, 9-5 Work)?')) {
        applyPreRenderedDefaults();
        renderGridTable();
        updateStatistics();
      }
    });

    // Clear All Grid Button
    document.getElementById('btn-clear-all').addEventListener('click', () => {
      if (confirm('Clear all allocated hours from the schedule matrix?')) {
        state.grid = {};
        saveStateToStorage();
        renderGridTable();
        updateStatistics();
      }
    });

    // Add Legend Button -> Open Modal
    document.getElementById('btn-add-legend').addEventListener('click', () => {
      editingLegendId = null;
      document.getElementById('modal-legend-title').textContent = 'Add New Legend';
      document.getElementById('input-legend-name').value = '';
      const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      document.getElementById('input-color-picker').value = randomColor;
      document.getElementById('input-custom-hex').value = randomColor;

      openModal();
    });

    // Color picker inputs sync
    document.getElementById('input-color-picker').addEventListener('input', (e) => {
      document.getElementById('input-custom-hex').value = e.target.value;
    });

    document.getElementById('input-custom-hex').addEventListener('input', (e) => {
      const val = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(val)) {
        document.getElementById('input-color-picker').value = val;
      }
    });

    // Save Legend Modal Button
    document.getElementById('btn-save-legend').addEventListener('click', () => {
      const name = document.getElementById('input-legend-name').value.trim();
      const color = document.getElementById('input-custom-hex').value.trim();

      if (!name) {
        alert('Please enter a name for your legend.');
        return;
      }

      if (editingLegendId) {
        // Edit existing legend
        const legend = state.legends.find(l => l.id === editingLegendId);
        if (legend) {
          legend.name = name;
          legend.color = color;
        }
      } else {
        // Add new legend
        const newId = 'leg_' + Date.now();
        const newLegend = { id: newId, name, color };
        state.legends.push(newLegend);
        state.activeBrushId = newId; // Auto select new legend
      }

      saveStateToStorage();
      renderLegends();
      renderGridTable();
      updateStatistics();
      closeModal();
    });

    // Modal Close buttons
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    // Edit & Delete Legend Event Delegation
    document.getElementById('legends-list').addEventListener('click', (e) => {
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
          // Remove from state
          state.legends = state.legends.filter(l => l.id !== id);
          
          // Clear matching slots in grid
          Object.keys(state.grid).forEach(key => {
            if (state.grid[key] === id) {
              delete state.grid[key];
            }
          });

          // Reset active brush if deleted
          if (state.activeBrushId === id) {
            state.activeBrushId = state.legends[0]?.id || 'eraser';
          }

          saveStateToStorage();
          renderLegends();
          renderGridTable();
          updateStatistics();
        }
      }
    });
  }

  function openModal() {
    const modal = document.getElementById('modal-legend');
    modal.classList.add('active');
  }

  function closeModal() {
    const modal = document.getElementById('modal-legend');
    modal.classList.remove('active');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Launch App
  init();
});
