// Main application logic

let engineers = [];
let scheduleTypes = [];
let currentEditingId = null;
let currentScheduleType = 'regular'; // Current schedule type being edited
let activeGroupFilter = null; // Active group filter for heatmap

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Initialize the application
function init() {
    engineers = loadEngineers();
    scheduleTypes = loadScheduleTypes();
    initGroups();

    // Populate timezone selectors
    populateTimezoneSelect(document.getElementById('timezoneSelect'));
    populateTimezoneSelect(document.getElementById('engineerTimezone'));

    // Populate schedule type selectors
    populateScheduleTypeSelectors();

    // Set up event listeners
    setupEventListeners();

    // Render initial view
    renderGroupsManager();
    renderGroupFilters();
    renderEngineersList();
    renderHeatmap();

    // Restore collapse states from localStorage
    restoreCollapsedStates();
}

// Set up all event listeners
function setupEventListeners() {
    // Add engineer button
    document.getElementById('addEngineerBtn').addEventListener('click', () => {
        openEngineerModal();
    });

    // Add group button
    document.getElementById('addGroupBtn').addEventListener('click', () => {
        openGroupModal();
    });

    // Modal close buttons
    document.querySelector('.modal-close').addEventListener('click', closeEngineerModal);
    document.querySelector('.group-modal-close').addEventListener('click', closeGroupModal);

    // Modal cancel buttons
    document.getElementById('cancelBtn').addEventListener('click', closeEngineerModal);
    document.getElementById('cancelGroupBtn').addEventListener('click', closeGroupModal);

    // Save buttons
    document.getElementById('saveEngineerBtn').addEventListener('click', saveEngineer);
    document.getElementById('saveGroupBtn').addEventListener('click', saveGroup);

    // Timezone and schedule type selectors
    document.getElementById('timezoneSelect').addEventListener('change', renderHeatmap);
    document.getElementById('scheduleTypeSelect').addEventListener('change', renderHeatmap);
    document.getElementById('scheduleTypeSelector').addEventListener('change', handleScheduleTypeChange);

    // Bulk edit buttons
    document.getElementById('applyMondayFridayBtn').addEventListener('click', applyMondayFriday);
    document.getElementById('apply247Btn').addEventListener('click', apply247);
    document.getElementById('applyToCopyBtn').addEventListener('click', showCopyToDialog);
    document.getElementById('copyFromScheduleBtn').addEventListener('click', showCopyFromScheduleDialog);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllSchedule);

    // Schedule type management
    document.getElementById('manageScheduleTypesMainBtn').addEventListener('click', openScheduleTypesModal);
    document.getElementById('addScheduleTypeBtn').addEventListener('click', () => openScheduleTypeModal());
    document.getElementById('closeScheduleTypesBtn').addEventListener('click', closeScheduleTypesModal);
    document.querySelector('.schedule-types-modal-close').addEventListener('click', closeScheduleTypesModal);
    document.querySelector('.schedule-type-modal-close').addEventListener('click', closeScheduleTypeModal);
    document.getElementById('cancelScheduleTypeBtn').addEventListener('click', closeScheduleTypeModal);
    document.getElementById('saveScheduleTypeBtn').addEventListener('click', saveScheduleType);

    // Export buttons
    document.getElementById('exportJsonBtn').addEventListener('click', handleExportJson);
    document.getElementById('exportCsvBtn').addEventListener('click', handleExportCsv);
    document.getElementById('importJsonInput').addEventListener('change', handleImportJson);

    // Collapse buttons
    document.getElementById('collapseGroupsBtn').addEventListener('click', () => toggleCollapse('groups'));
    document.getElementById('collapseEngineersBtn').addEventListener('click', () => toggleCollapse('engineers'));

    // Close modals on background click
    document.getElementById('engineerModal').addEventListener('click', (e) => {
        if (e.target.id === 'engineerModal') {
            closeEngineerModal();
        }
    });

    document.getElementById('groupModal').addEventListener('click', (e) => {
        if (e.target.id === 'groupModal') {
            closeGroupModal();
        }
    });

    document.getElementById('scheduleTypesModal').addEventListener('click', (e) => {
        if (e.target.id === 'scheduleTypesModal') {
            closeScheduleTypesModal();
        }
    });

    document.getElementById('scheduleTypeModal').addEventListener('click', (e) => {
        if (e.target.id === 'scheduleTypeModal') {
            closeScheduleTypeModal();
        }
    });
}

// Open the engineer modal for adding/editing
function openEngineerModal(engineerId = null) {
    const modal = document.getElementById('engineerModal');
    const modalTitle = document.getElementById('modalTitle');
    const nameInput = document.getElementById('engineerName');
    const timezoneSelect = document.getElementById('engineerTimezone');

    currentEditingId = engineerId;
    const defaultScheduleType = getDefaultScheduleType();
    currentScheduleType = defaultScheduleType; // Reset to default schedule type

    // Reset schedule type selector to default
    document.getElementById('scheduleTypeSelector').value = defaultScheduleType;

    if (engineerId) {
        // Edit mode
        const engineer = engineers.find(e => e.id === engineerId);
        if (!engineer) return;

        modalTitle.textContent = 'Edit Engineer';
        nameInput.value = engineer.name;
        timezoneSelect.value = engineer.timezone;

        // Render groups
        renderEngineerGroupsSelect(engineer.groups || []);

        // Render schedule for current type
        const schedule = engineer.schedules[currentScheduleType] || getDefaultSchedule();
        renderScheduleInputs(schedule);
    } else {
        // Add mode
        modalTitle.textContent = 'Add Engineer';
        nameInput.value = '';
        timezoneSelect.value = timezoneSelect.options[0].value;

        // Render groups
        renderEngineerGroupsSelect([]);

        renderScheduleInputs(getDefaultSchedule());
    }

    modal.classList.add('show');
}

// Close the engineer modal
function closeEngineerModal() {
    const modal = document.getElementById('engineerModal');
    modal.classList.remove('show');
    currentEditingId = null;
}

// Get default schedule (Monday-Friday, 9-5)
function getDefaultSchedule() {
    const schedule = {};
    for (let day = 0; day < 7; day++) {
        if (day === 0 || day === 6) {
            // Weekend - not working
            schedule[day] = { working: false, start: '09:00', end: '17:00' };
        } else {
            // Weekday - working 9-5
            schedule[day] = { working: true, start: '09:00', end: '17:00' };
        }
    }
    return schedule;
}

// Render schedule inputs in the modal
// Clipboard for day schedule
let dayScheduleClipboard = null;

function renderScheduleInputs(schedule) {
    const container = document.getElementById('scheduleInputs');
    container.innerHTML = '';

    DAYS_OF_WEEK.forEach((dayName, dayIndex) => {
        const daySchedule = schedule[dayIndex] || { working: false, start: '09:00', end: '17:00' };

        const dayDiv = document.createElement('div');
        dayDiv.className = 'schedule-day-input';
        dayDiv.innerHTML = `
            <div class="schedule-day-header">
                <span class="schedule-day-label">${dayName}</span>
                <div class="schedule-day-actions">
                    <button type="button" class="btn-icon copy-day-btn" data-day="${dayIndex}" title="Copy this day's schedule">📋</button>
                    <button type="button" class="btn-icon paste-day-btn" data-day="${dayIndex}" title="Paste schedule">📄</button>
                    <div class="schedule-day-toggle">
                        <input type="checkbox" id="working-${dayIndex}" ${daySchedule.working ? 'checked' : ''}>
                        <label for="working-${dayIndex}">Working</label>
                    </div>
                </div>
            </div>
            <div class="schedule-time-inputs" id="times-${dayIndex}" style="display: ${daySchedule.working ? 'grid' : 'none'}">
                <div class="time-input-group">
                    <label for="start-${dayIndex}">Start time:</label>
                    <input type="time" id="start-${dayIndex}" value="${daySchedule.start}">
                </div>
                <div class="time-input-group">
                    <label for="end-${dayIndex}">End time:</label>
                    <input type="time" id="end-${dayIndex}" value="${daySchedule.end}">
                </div>
            </div>
        `;

        // Toggle time inputs based on working checkbox
        const workingCheckbox = dayDiv.querySelector(`#working-${dayIndex}`);
        const timeInputs = dayDiv.querySelector(`#times-${dayIndex}`);

        workingCheckbox.addEventListener('change', () => {
            timeInputs.style.display = workingCheckbox.checked ? 'grid' : 'none';
        });

        // Copy button
        dayDiv.querySelector('.copy-day-btn').addEventListener('click', () => {
            copyDaySchedule(dayIndex);
        });

        // Paste button
        dayDiv.querySelector('.paste-day-btn').addEventListener('click', () => {
            pasteDaySchedule(dayIndex);
        });

        container.appendChild(dayDiv);
    });
}

// Copy a day's schedule to clipboard
function copyDaySchedule(dayIndex) {
    const working = document.getElementById(`working-${dayIndex}`).checked;
    const start = document.getElementById(`start-${dayIndex}`).value;
    const end = document.getElementById(`end-${dayIndex}`).value;

    dayScheduleClipboard = {
        working: working,
        start: start,
        end: end
    };

    // Visual feedback
    const copyBtn = document.querySelector(`.copy-day-btn[data-day="${dayIndex}"]`);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✓';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 1000);
}

// Paste a day's schedule from clipboard
function pasteDaySchedule(dayIndex) {
    if (!dayScheduleClipboard) {
        alert('No schedule copied yet. Copy a day first using the 📋 button.');
        return;
    }

    document.getElementById(`working-${dayIndex}`).checked = dayScheduleClipboard.working;
    document.getElementById(`start-${dayIndex}`).value = dayScheduleClipboard.start;
    document.getElementById(`end-${dayIndex}`).value = dayScheduleClipboard.end;

    // Update visibility of time inputs
    const timeInputs = document.getElementById(`times-${dayIndex}`);
    timeInputs.style.display = dayScheduleClipboard.working ? 'grid' : 'none';

    // Visual feedback
    const pasteBtn = document.querySelector(`.paste-day-btn[data-day="${dayIndex}"]`);
    const originalText = pasteBtn.textContent;
    pasteBtn.textContent = '✓';
    setTimeout(() => {
        pasteBtn.textContent = originalText;
    }, 1000);
}

// Save engineer (add or update)
function saveEngineer() {
    const name = document.getElementById('engineerName').value.trim();
    const timezone = document.getElementById('engineerTimezone').value;

    if (!name) {
        alert('Please enter an engineer name');
        return;
    }

    // Collect schedule data for current schedule type
    const schedule = {};
    for (let day = 0; day < 7; day++) {
        const working = document.getElementById(`working-${day}`).checked;
        const start = document.getElementById(`start-${day}`).value;
        const end = document.getElementById(`end-${day}`).value;

        schedule[day] = { working, start, end };
    }

    // Collect selected groups
    const selectedGroups = [];
    groups.forEach(group => {
        const checkbox = document.getElementById(`group-check-${group.id}`);
        if (checkbox && checkbox.checked) {
            selectedGroups.push(group.id);
        }
    });

    if (currentEditingId) {
        // Update existing engineer
        const engineer = engineers.find(e => e.id === currentEditingId);
        if (engineer) {
            engineer.name = name;
            engineer.timezone = timezone;
            engineer.groups = selectedGroups;

            // Update schedule for current type
            if (!engineer.schedules) {
                engineer.schedules = {};
            }
            engineer.schedules[currentScheduleType] = schedule;
        }
    } else {
        // Add new engineer
        const newEngineer = {
            id: generateId(),
            name,
            timezone,
            groups: selectedGroups,
            schedules: {
                [currentScheduleType]: schedule
            }
        };
        engineers.push(newEngineer);
    }

    saveEngineers(engineers);
    renderGroupsManager();
    renderEngineersList();
    renderHeatmap();
    closeEngineerModal();
}

// Generate a unique ID
function generateId() {
    return `eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Delete an engineer
function deleteEngineer(engineerId) {
    if (!confirm('Are you sure you want to delete this engineer?')) {
        return;
    }

    engineers = engineers.filter(e => e.id !== engineerId);
    saveEngineers(engineers);
    renderEngineersList();
    renderHeatmap();
}

// Render the engineers list
function renderEngineersList() {
    const container = document.getElementById('engineersList');

    if (engineers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No engineers added yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    engineers.forEach(engineer => {
        const card = document.createElement('div');
        card.className = 'engineer-card';

        // Get working days summary (from regular schedule)
        const workingDays = [];
        const regularSchedule = engineer.schedules?.regular || engineer.schedule || {};
        for (let day = 0; day < 7; day++) {
            if (regularSchedule[day]?.working) {
                workingDays.push(DAYS_OF_WEEK[day].substr(0, 3));
            }
        }

        // Get groups
        const engineerGroups = getEngineerGroups(engineer);
        const groupTags = engineerGroups.length > 0
            ? engineerGroups.map(g =>
                `<span class="tooltip-group-tag" style="background-color: ${g.color}">${escapeHtml(g.name)}</span>`
            ).join(' ')
            : '';

        card.innerHTML = `
            <div class="engineer-header">
                <span class="engineer-name">${escapeHtml(engineer.name)}</span>
                <div class="engineer-actions">
                    <button class="btn-icon edit-btn" data-id="${engineer.id}" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon delete-btn" data-id="${engineer.id}" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="engineer-timezone">${getTimezoneDisplayName(engineer.timezone)}</div>
            ${groupTags ? `<div class="engineer-groups" style="margin-top: 8px;">${groupTags}</div>` : ''}
            <div class="engineer-schedule">
                <strong>Regular hours:</strong> ${workingDays.length > 0 ? workingDays.join(', ') : 'None'}
            </div>
        `;

        // Add event listeners for edit and delete buttons
        card.querySelector('.edit-btn').addEventListener('click', () => {
            openEngineerModal(engineer.id);
        });

        card.querySelector('.delete-btn').addEventListener('click', () => {
            deleteEngineer(engineer.id);
        });

        container.appendChild(card);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle JSON export
function handleExportJson() {
    exportToJson(engineers);
}

// Handle CSV export
function handleExportCsv() {
    exportToCsv(engineers);
}

// Handle JSON import
function handleImportJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const result = importData(data);

            if (result.success) {
                engineers = loadEngineers();
                renderEngineersList();
                renderHeatmap();
                alert('Data imported successfully!');
            } else {
                alert(`Failed to import data: ${result.error}`);
            }
        } catch (error) {
            alert('Invalid JSON file');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// Populate schedule type selectors
function populateScheduleTypeSelectors() {
    const defaultScheduleType = getDefaultScheduleType();

    // Populate heatmap schedule type selector
    const heatmapSelector = document.getElementById('scheduleTypeSelect');
    heatmapSelector.innerHTML = '<option value="all">All Types</option>';
    scheduleTypes.forEach(st => {
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = st.name;
        heatmapSelector.appendChild(option);
    });

    // Set default schedule type
    heatmapSelector.value = defaultScheduleType;

    // Populate modal schedule type selector
    const modalSelector = document.getElementById('scheduleTypeSelector');
    modalSelector.innerHTML = '';
    scheduleTypes.forEach(st => {
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = st.name;
        modalSelector.appendChild(option);
    });
}

// Handle schedule type change in modal
function handleScheduleTypeChange() {
    currentScheduleType = document.getElementById('scheduleTypeSelector').value;

    // Get current engineer's schedules
    let schedules = {};
    if (currentEditingId) {
        const engineer = engineers.find(e => e.id === currentEditingId);
        if (engineer) {
            schedules = engineer.schedules;
        }
    }

    const currentSchedule = schedules[currentScheduleType] || getDefaultSchedule();
    renderScheduleInputs(currentSchedule);
}

// Render group filters
function renderGroupFilters() {
    const container = document.querySelector('.group-filter');
    if (!container) return;

    container.innerHTML = '<button id="filterAllGroups" class="group-filter-btn active">All</button>';

    // Add filter for each group
    groups.forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'group-filter-btn';
        btn.textContent = group.name;
        btn.dataset.groupId = group.id;
        btn.style.borderColor = group.color;

        btn.addEventListener('click', () => {
            // Update active state
            container.querySelectorAll('.group-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Set filter and re-render
            activeGroupFilter = group.id;
            renderHeatmap();
        });

        container.appendChild(btn);
    });

    // All button handler
    document.getElementById('filterAllGroups').addEventListener('click', () => {
        container.querySelectorAll('.group-filter-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('filterAllGroups').classList.add('active');
        activeGroupFilter = null;
        renderHeatmap();
    });
}

// Render engineer groups in modal
function renderEngineerGroupsSelect(engineerGroups = []) {
    const container = document.getElementById('engineerGroups');
    if (!container) return;

    if (groups.length === 0) {
        container.innerHTML = '<p style="color: #999;">No groups available. Create a group first.</p>';
        return;
    }

    container.innerHTML = '';

    groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'group-checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `group-check-${group.id}`;
        checkbox.value = group.id;
        checkbox.checked = engineerGroups.includes(group.id);

        const label = document.createElement('label');
        label.htmlFor = `group-check-${group.id}`;
        label.className = 'group-checkbox-label';
        label.innerHTML = `
            <span class="group-color-indicator" style="background-color: ${group.color}"></span>
            <span>${escapeHtml(group.name)}</span>
        `;

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
}

// Bulk edit: Apply Monday-Friday 9-5
function applyMondayFriday() {
    for (let day = 0; day < 7; day++) {
        const working = day !== 0 && day !== 6; // Not Sunday or Saturday
        document.getElementById(`working-${day}`).checked = working;
        document.getElementById(`start-${day}`).value = '09:00';
        document.getElementById(`end-${day}`).value = '17:00';
        document.getElementById(`times-${day}`).style.display = working ? 'grid' : 'none';
    }
}

// Bulk edit: Apply 24/7
function apply247() {
    for (let day = 0; day < 7; day++) {
        document.getElementById(`working-${day}`).checked = true;
        document.getElementById(`start-${day}`).value = '00:00';
        document.getElementById(`end-${day}`).value = '23:59';
        document.getElementById(`times-${day}`).style.display = 'grid';
    }
}

// Bulk edit: Show copy to dialog
function showCopyToDialog() {
    const sourceDay = prompt('Enter source day number (0=Sunday, 6=Saturday):');
    if (sourceDay === null || sourceDay === '') return;

    const sourceDayNum = parseInt(sourceDay);
    if (isNaN(sourceDayNum) || sourceDayNum < 0 || sourceDayNum > 6) {
        alert('Invalid day number. Please enter 0-6.');
        return;
    }

    const targetDays = prompt('Enter target days (comma-separated, e.g., 1,2,3,4,5):');
    if (targetDays === null || targetDays === '') return;

    const targetDayNums = targetDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 0 && d <= 6);

    if (targetDayNums.length === 0) {
        alert('No valid target days specified.');
        return;
    }

    // Copy schedule
    const sourceWorking = document.getElementById(`working-${sourceDayNum}`).checked;
    const sourceStart = document.getElementById(`start-${sourceDayNum}`).value;
    const sourceEnd = document.getElementById(`end-${sourceDayNum}`).value;

    targetDayNums.forEach(day => {
        document.getElementById(`working-${day}`).checked = sourceWorking;
        document.getElementById(`start-${day}`).value = sourceStart;
        document.getElementById(`end-${day}`).value = sourceEnd;
        document.getElementById(`times-${day}`).style.display = sourceWorking ? 'grid' : 'none';
    });

    alert(`Copied ${DAYS_OF_WEEK[sourceDayNum]} schedule to ${targetDayNums.length} day(s).`);
}

// Bulk edit: Clear all
function clearAllSchedule() {
    if (!confirm('Clear all working hours?')) return;

    for (let day = 0; day < 7; day++) {
        document.getElementById(`working-${day}`).checked = false;
        document.getElementById(`times-${day}`).style.display = 'none';
    }
}

// Copy from another schedule type
function showCopyFromScheduleDialog() {
    // Get current engineer's schedules
    let schedules = {};
    if (currentEditingId) {
        const engineer = engineers.find(e => e.id === currentEditingId);
        if (engineer && engineer.schedules) {
            schedules = engineer.schedules;
        }
    }

    // Build list of available schedule types
    const availableTypes = scheduleTypes.filter(st =>
        st.id !== currentScheduleType && schedules[st.id]
    );

    if (availableTypes.length === 0) {
        alert('No other schedule types available to copy from. Add schedules to other types first.');
        return;
    }

    // Show selection dialog
    let message = 'Copy schedule from:\n\n';
    availableTypes.forEach((st, idx) => {
        message += `${idx + 1}. ${st.name}\n`;
    });
    message += '\nEnter number:';

    const selection = prompt(message);
    if (!selection) return;

    const index = parseInt(selection) - 1;
    if (isNaN(index) || index < 0 || index >= availableTypes.length) {
        alert('Invalid selection');
        return;
    }

    const sourceType = availableTypes[index];
    const sourceSchedule = schedules[sourceType.id];

    // Copy the schedule to current inputs
    for (let day = 0; day < 7; day++) {
        const daySchedule = sourceSchedule[day] || { working: false, start: '09:00', end: '17:00' };
        document.getElementById(`working-${day}`).checked = daySchedule.working;
        document.getElementById(`start-${day}`).value = daySchedule.start;
        document.getElementById(`end-${day}`).value = daySchedule.end;
        document.getElementById(`times-${day}`).style.display = daySchedule.working ? 'grid' : 'none';
    }

    alert(`Copied schedule from "${sourceType.name}"`);
}

// Open schedule types management modal
function openScheduleTypesModal() {
    const modal = document.getElementById('scheduleTypesModal');
    renderScheduleTypesList();
    modal.classList.add('show');
}

// Close schedule types management modal
function closeScheduleTypesModal() {
    const modal = document.getElementById('scheduleTypesModal');
    modal.classList.remove('show');

    // Refresh selectors in case types changed
    scheduleTypes = loadScheduleTypes();
    populateScheduleTypeSelectors();
    renderHeatmap();
}

// Render schedule types list
function renderScheduleTypesList() {
    const container = document.getElementById('scheduleTypesList');
    container.innerHTML = '';

    const defaultScheduleType = getDefaultScheduleType();

    scheduleTypes.forEach(type => {
        const card = document.createElement('div');
        card.className = 'schedule-type-card';

        const isDefault = type.id === defaultScheduleType;
        if (isDefault) {
            card.classList.add('is-default');
        }

        card.innerHTML = `
            <div class="schedule-type-info">
                <div class="schedule-type-color-box" style="background-color: ${type.color}"></div>
                <div>
                    <div class="schedule-type-name">
                        ${escapeHtml(type.name)}
                        ${isDefault ? '<span class="default-badge">Default</span>' : ''}
                    </div>
                    <div class="schedule-type-id">${type.id}</div>
                </div>
            </div>
            <div class="schedule-type-actions">
                ${!isDefault ? `<button class="btn-icon set-default-btn" data-id="${type.id}" title="Set as Default">⭐</button>` : ''}
                <button class="btn-icon edit-st-btn" data-id="${type.id}" title="Edit">✏️</button>
                <button class="btn-icon delete-st-btn" data-id="${type.id}" title="Delete">🗑️</button>
            </div>
        `;

        // Set as default button
        if (!isDefault) {
            card.querySelector('.set-default-btn').addEventListener('click', () => {
                setDefaultScheduleType(type.id);
                renderScheduleTypesList();
                populateScheduleTypeSelectors();
            });
        }

        // Edit button
        card.querySelector('.edit-st-btn').addEventListener('click', () => {
            openScheduleTypeModal(type.id);
        });

        // Delete button
        card.querySelector('.delete-st-btn').addEventListener('click', () => {
            if (isDefault) {
                alert('Cannot delete the default schedule type. Please set another type as default first.');
                return;
            }
            if (confirm(`Delete schedule type "${type.name}"? This will remove it from all engineers.`)) {
                deleteScheduleType(type.id);
                scheduleTypes = loadScheduleTypes();
                renderScheduleTypesList();
            }
        });

        container.appendChild(card);
    });
}

// Open schedule type modal (add/edit)
let currentEditingScheduleTypeId = null;

function openScheduleTypeModal(typeId = null) {
    const modal = document.getElementById('scheduleTypeModal');
    const modalTitle = document.getElementById('scheduleTypeModalTitle');
    const nameInput = document.getElementById('scheduleTypeName');
    const colorInput = document.getElementById('scheduleTypeColor');

    currentEditingScheduleTypeId = typeId;

    if (typeId) {
        const type = scheduleTypes.find(t => t.id === typeId);
        if (!type) return;

        modalTitle.textContent = 'Edit Schedule Type';
        nameInput.value = type.name;
        colorInput.value = type.color;
    } else {
        modalTitle.textContent = 'Add Schedule Type';
        nameInput.value = '';
        colorInput.value = '#9c27b0';
    }

    modal.classList.add('show');
}

// Close schedule type modal
function closeScheduleTypeModal() {
    const modal = document.getElementById('scheduleTypeModal');
    modal.classList.remove('show');
    currentEditingScheduleTypeId = null;
}

// Save schedule type
function saveScheduleType() {
    const nameInput = document.getElementById('scheduleTypeName');
    const colorInput = document.getElementById('scheduleTypeColor');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
        alert('Please enter a schedule type name');
        return;
    }

    if (currentEditingScheduleTypeId) {
        // Edit existing
        updateScheduleType(currentEditingScheduleTypeId, name, color);
    } else {
        // Add new
        addScheduleType(name, color);
    }

    scheduleTypes = loadScheduleTypes();
    renderScheduleTypesList();
    closeScheduleTypeModal();
}

// Collapse/Expand functionality
function toggleCollapse(section) {
    const contentId = section === 'groups' ? 'groupsContent' : 'engineersContent';
    const btnId = section === 'groups' ? 'collapseGroupsBtn' : 'collapseEngineersBtn';

    const content = document.getElementById(contentId);
    const btn = document.getElementById(btnId);

    const isCollapsed = content.classList.contains('collapsed');

    if (isCollapsed) {
        content.classList.remove('collapsed');
        btn.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        btn.classList.add('collapsed');
    }

    // Save state to localStorage
    localStorage.setItem(`collapsed-${section}`, !isCollapsed);
}

function restoreCollapsedStates() {
    // Restore groups collapse state
    const groupsCollapsed = localStorage.getItem('collapsed-groups') === 'true';
    if (groupsCollapsed) {
        document.getElementById('groupsContent').classList.add('collapsed');
        document.getElementById('collapseGroupsBtn').classList.add('collapsed');
    }

    // Restore engineers collapse state
    const engineersCollapsed = localStorage.getItem('collapsed-engineers') === 'true';
    if (engineersCollapsed) {
        document.getElementById('engineersContent').classList.add('collapsed');
        document.getElementById('collapseEngineersBtn').classList.add('collapsed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
