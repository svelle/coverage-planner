// Storage management using localStorage

const STORAGE_KEY = 'coverage-planner-engineers';
const GROUPS_KEY = 'coverage-planner-groups';
const SCHEDULE_TYPES_KEY = 'coverage-planner-schedule-types';
const DATA_VERSION_KEY = 'coverage-planner-version';
const DEFAULT_SCHEDULE_TYPE_KEY = 'coverage-planner-default-schedule-type';
const CURRENT_VERSION = 2;

// Schedule types
const DEFAULT_SCHEDULE_TYPES = [
    { id: 'regular', name: 'Regular Hours', color: '#4caf50' },
    { id: 'oncall', name: 'On-Call', color: '#ff9800' },
    { id: 'tickets', name: 'Ticket Queue', color: '#2196f3' },
    { id: 'escalation', name: 'Escalation Queue', color: '#f44336' }
];

// Load engineers from localStorage with migration
function loadEngineers() {
    try {
        const version = parseInt(localStorage.getItem(DATA_VERSION_KEY)) || 1;
        const data = localStorage.getItem(STORAGE_KEY);

        if (!data) {
            return [];
        }

        let engineers = JSON.parse(data);

        // Migrate from v1 to v2 if needed
        if (version < 2) {
            engineers = migrateEngineersV1toV2(engineers);
            saveEngineers(engineers);
            localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
        }

        return engineers;
    } catch (e) {
        console.error('Error loading engineers from localStorage:', e);
    }
    return [];
}

// Migrate v1 data structure to v2
function migrateEngineersV1toV2(engineers) {
    return engineers.map(engineer => {
        // If already migrated, return as-is
        if (engineer.schedules && typeof engineer.schedules === 'object') {
            return engineer;
        }

        // Migrate old single schedule to new multi-schedule format
        return {
            ...engineer,
            groups: engineer.groups || [],
            schedules: {
                regular: engineer.schedule || {}
            },
            schedule: undefined // Remove old field
        };
    });
}

// Save engineers to localStorage
function saveEngineers(engineers) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(engineers));
        return true;
    } catch (e) {
        console.error('Error saving engineers to localStorage:', e);
        alert('Failed to save data. Your browser storage might be full.');
        return false;
    }
}

// Clear all data
function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        console.error('Error clearing localStorage:', e);
        return false;
    }
}

// Load groups from localStorage
function loadGroups() {
    try {
        const data = localStorage.getItem(GROUPS_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading groups from localStorage:', e);
    }
    return [];
}

// Save groups to localStorage
function saveGroups(groups) {
    try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        return true;
    } catch (e) {
        console.error('Error saving groups to localStorage:', e);
        return false;
    }
}

// Load schedule types from localStorage
function loadScheduleTypes() {
    try {
        const data = localStorage.getItem(SCHEDULE_TYPES_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading schedule types from localStorage:', e);
    }
    // Return default types if none saved
    saveScheduleTypes(DEFAULT_SCHEDULE_TYPES);
    return DEFAULT_SCHEDULE_TYPES;
}

// Save schedule types to localStorage
function saveScheduleTypes(types) {
    try {
        localStorage.setItem(SCHEDULE_TYPES_KEY, JSON.stringify(types));
        return true;
    } catch (e) {
        console.error('Error saving schedule types to localStorage:', e);
        return false;
    }
}

// Add a new schedule type
function addScheduleType(name, color) {
    const types = loadScheduleTypes();
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const newType = {
        id: id,
        name: name,
        color: color
    };

    types.push(newType);
    saveScheduleTypes(types);
    return newType;
}

// Update a schedule type
function updateScheduleType(id, name, color) {
    const types = loadScheduleTypes();
    const type = types.find(t => t.id === id);

    if (type) {
        type.name = name;
        type.color = color;
        saveScheduleTypes(types);
        return true;
    }
    return false;
}

// Delete a schedule type
function deleteScheduleType(id) {
    // Don't allow deleting default types
    if (id === 'regular') {
        return false;
    }

    let types = loadScheduleTypes();
    types = types.filter(t => t.id !== id);
    saveScheduleTypes(types);

    // Remove this schedule type from all engineers
    const engs = loadEngineers();
    engs.forEach(eng => {
        if (eng.schedules && eng.schedules[id]) {
            delete eng.schedules[id];
        }
    });
    saveEngineers(engs);

    return true;
}

// Get default schedule type
function getDefaultScheduleType() {
    try {
        const defaultType = localStorage.getItem(DEFAULT_SCHEDULE_TYPE_KEY);
        return defaultType || 'regular';
    } catch (e) {
        console.error('Error getting default schedule type:', e);
        return 'regular';
    }
}

// Set default schedule type
function setDefaultScheduleType(scheduleTypeId) {
    try {
        localStorage.setItem(DEFAULT_SCHEDULE_TYPE_KEY, scheduleTypeId);
        return true;
    } catch (e) {
        console.error('Error setting default schedule type:', e);
        return false;
    }
}

// Import data (replace existing)
function importData(data) {
    try {
        // Support both old and new format
        let engineersData = data;
        let groupsData = [];
        let scheduleTypesData = DEFAULT_SCHEDULE_TYPES;
        let defaultScheduleTypeData = 'regular';

        // Check if it's new format with separate data types
        if (data.engineers) {
            engineersData = data.engineers;
            groupsData = data.groups || [];
            scheduleTypesData = data.scheduleTypes || DEFAULT_SCHEDULE_TYPES;
            defaultScheduleTypeData = data.defaultScheduleType || 'regular';
        }

        // Validate data structure
        if (!Array.isArray(engineersData)) {
            throw new Error('Invalid data format: expected an array');
        }

        // Migrate and validate engineers
        engineersData = migrateEngineersV1toV2(engineersData);

        // Validate each engineer object
        for (const engineer of engineersData) {
            if (!engineer.id || !engineer.name || !engineer.timezone || !engineer.schedules) {
                throw new Error('Invalid engineer data structure');
            }

            // Validate schedules
            if (typeof engineer.schedules !== 'object') {
                throw new Error('Invalid schedules format');
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(engineersData));
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groupsData));
        localStorage.setItem(SCHEDULE_TYPES_KEY, JSON.stringify(scheduleTypesData));
        localStorage.setItem(DEFAULT_SCHEDULE_TYPE_KEY, defaultScheduleTypeData);
        localStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);

        return { success: true };
    } catch (e) {
        console.error('Error importing data:', e);
        return { success: false, error: e.message };
    }
}

// Export data (new format includes everything)
function exportData() {
    return {
        engineers: loadEngineers(),
        groups: loadGroups(),
        scheduleTypes: loadScheduleTypes(),
        defaultScheduleType: getDefaultScheduleType(),
        version: CURRENT_VERSION
    };
}

// Get storage size info
function getStorageInfo() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const sizeInBytes = data ? new Blob([data]).size : 0;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        return {
            sizeInBytes,
            sizeInKB,
            itemCount: loadEngineers().length
        };
    } catch (e) {
        return {
            sizeInBytes: 0,
            sizeInKB: '0.00',
            itemCount: 0
        };
    }
}
