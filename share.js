// Share functionality using compressed hashes in a modal

// Open the share modal
function openShareModal() {
    const modal = document.getElementById('shareModal');
    const textarea = document.getElementById('shareHashInput');

    // Generate the hash
    const hash = generateShareHash();

    if (hash) {
        // Populate the textarea with the hash
        textarea.value = hash;

        // Show the modal
        modal.classList.add('show');

        // Auto-select the text for easy copying
        textarea.select();
    }
}

// Generate a shareable hash with compressed data
function generateShareHash() {
    try {
        // Get all data to share
        const data = exportData();

        // Convert to JSON string
        const jsonString = JSON.stringify(data);

        // Compress the JSON using lz-string
        const compressed = LZString.compressToEncodedURIComponent(jsonString);

        return compressed;
    } catch (error) {
        console.error('Error generating share hash:', error);
        alert('Failed to generate share hash. Please try again.');
        return null;
    }
}

// Copy the hash to clipboard
function copyShareHash() {
    const textarea = document.getElementById('shareHashInput');

    textarea.select();

    navigator.clipboard.writeText(textarea.value).then(() => {
        showShareNotification('Hash copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        // Fallback: the text is already selected, user can manually copy
        showShareNotification('Please press Ctrl+C (or Cmd+C) to copy', true);
    });
}

// Load data from the pasted hash
function loadFromHash() {
    const textarea = document.getElementById('shareHashInput');
    const hash = textarea.value.trim();

    if (!hash) {
        alert('Please paste a share hash first.');
        return;
    }

    try {
        // Decompress the data
        const jsonString = LZString.decompressFromEncodedURIComponent(hash);

        if (!jsonString) {
            alert('Invalid share hash. The data could not be loaded.');
            return;
        }

        // Parse JSON
        const data = JSON.parse(jsonString);

        // Import the data
        const result = importData(data);

        if (result.success) {
            // Reload the data in the UI
            engineers = loadEngineers();
            scheduleTypes = loadScheduleTypes();
            initGroups();

            // Re-render everything
            renderGroupsManager();
            renderGroupFilters();
            renderEngineersList();
            populateScheduleTypeSelectors();
            renderHeatmap();
            renderBarChart();

            // Close the modal
            closeShareModal();

            showShareNotification('Coverage plan loaded successfully!');
        } else {
            alert('Failed to load shared data: ' + result.error);
        }
    } catch (error) {
        console.error('Error loading from hash:', error);
        alert('Failed to load coverage plan. The hash may be invalid or corrupted.');
    }
}

// Close the share modal
function closeShareModal() {
    const modal = document.getElementById('shareModal');
    modal.classList.remove('show');
}

// Show a temporary notification message
function showShareNotification(message, isError = false) {
    // Remove any existing notification
    const existing = document.getElementById('shareNotification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'shareNotification';
    notification.className = 'share-notification' + (isError ? ' error' : '');
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
