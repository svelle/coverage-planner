// Group management

let groups = [];

// Initialize groups
function initGroups() {
    groups = loadGroups();
}

// Generate a unique ID for groups
function generateGroupId() {
    return `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add a new group
function addGroup(name, color) {
    const newGroup = {
        id: generateGroupId(),
        name: name.trim(),
        color: color || getRandomColor()
    };

    groups.push(newGroup);
    saveGroups(groups);
    return newGroup;
}

// Update a group
function updateGroup(groupId, name, color) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.name = name.trim();
        group.color = color;
        saveGroups(groups);
        return true;
    }
    return false;
}

// Delete a group
function deleteGroup(groupId) {
    groups = groups.filter(g => g.id !== groupId);
    saveGroups(groups);

    // Remove group from all engineers
    engineers.forEach(engineer => {
        if (engineer.groups) {
            engineer.groups = engineer.groups.filter(gid => gid !== groupId);
        }
    });
    saveEngineers(engineers);
}

// Get group by ID
function getGroupById(groupId) {
    return groups.find(g => g.id === groupId);
}

// Get groups for an engineer
function getEngineerGroups(engineer) {
    if (!engineer.groups || engineer.groups.length === 0) {
        return [];
    }
    return engineer.groups.map(groupId => getGroupById(groupId)).filter(g => g);
}

// Generate random color for new groups
function getRandomColor() {
    const colors = [
        '#4caf50', '#2196f3', '#ff9800', '#f44336',
        '#9c27b0', '#00bcd4', '#ff5722', '#795548',
        '#607d8b', '#3f51b5', '#009688', '#ffc107'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Assign engineer to group
function assignEngineerToGroup(engineerId, groupId) {
    const engineer = engineers.find(e => e.id === engineerId);
    if (!engineer) return false;

    if (!engineer.groups) {
        engineer.groups = [];
    }

    if (!engineer.groups.includes(groupId)) {
        engineer.groups.push(groupId);
        saveEngineers(engineers);
        return true;
    }
    return false;
}

// Remove engineer from group
function removeEngineerFromGroup(engineerId, groupId) {
    const engineer = engineers.find(e => e.id === engineerId);
    if (!engineer || !engineer.groups) return false;

    engineer.groups = engineer.groups.filter(gid => gid !== groupId);
    saveEngineers(engineers);
    return true;
}

// Render groups management UI
function renderGroupsManager() {
    const container = document.getElementById('groupsList');
    if (!container) return;

    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No groups created yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    groups.forEach(group => {
        // Count engineers in this group
        const engineerCount = engineers.filter(e =>
            e.groups && e.groups.includes(group.id)
        ).length;

        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        groupCard.innerHTML = `
            <div class="group-header">
                <div class="group-info">
                    <span class="group-color-indicator" style="background-color: ${group.color}"></span>
                    <span class="group-name">${escapeHtml(group.name)}</span>
                    <span class="group-count">(${engineerCount})</span>
                </div>
                <div class="group-actions">
                    <button class="btn-icon edit-group-btn" data-id="${group.id}" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon delete-group-btn" data-id="${group.id}" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `;

        groupCard.querySelector('.edit-group-btn').addEventListener('click', () => {
            openGroupModal(group.id);
        });

        groupCard.querySelector('.delete-group-btn').addEventListener('click', () => {
            if (confirm(`Delete group "${group.name}"?`)) {
                deleteGroup(group.id);
                renderGroupsManager();
                renderEngineersList();
            }
        });

        container.appendChild(groupCard);
    });
}

// Open group modal
function openGroupModal(groupId = null) {
    const modal = document.getElementById('groupModal');
    const modalTitle = document.getElementById('groupModalTitle');
    const nameInput = document.getElementById('groupName');
    const colorInput = document.getElementById('groupColor');

    if (groupId) {
        const group = getGroupById(groupId);
        if (!group) return;

        modalTitle.textContent = 'Edit Group';
        nameInput.value = group.name;
        colorInput.value = group.color;
        modal.dataset.editingId = groupId;
    } else {
        modalTitle.textContent = 'Add Group';
        nameInput.value = '';
        colorInput.value = getRandomColor();
        delete modal.dataset.editingId;
    }

    modal.classList.add('show');
}

// Close group modal
function closeGroupModal() {
    const modal = document.getElementById('groupModal');
    modal.classList.remove('show');
    delete modal.dataset.editingId;
}

// Save group
function saveGroup() {
    const modal = document.getElementById('groupModal');
    const nameInput = document.getElementById('groupName');
    const colorInput = document.getElementById('groupColor');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
        alert('Please enter a group name');
        return;
    }

    const editingId = modal.dataset.editingId;

    if (editingId) {
        updateGroup(editingId, name, color);
    } else {
        addGroup(name, color);
    }

    renderGroupsManager();
    renderEngineersList();
    closeGroupModal();
}
