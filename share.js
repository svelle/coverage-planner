// URL-based sharing functionality using compressed hashes

// Generate a shareable URL with compressed data
function generateShareUrl() {
    try {
        // Get all data to share
        const data = exportData();

        // Convert to JSON string
        const jsonString = JSON.stringify(data);

        // Compress the JSON using lz-string
        const compressed = LZString.compressToEncodedURIComponent(jsonString);

        // Generate the share URL
        const shareUrl = `${window.location.origin}${window.location.pathname}#s=${compressed}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showShareNotification('Link copied to clipboard! 📋');
        }).catch(err => {
            // Fallback if clipboard API fails
            console.error('Failed to copy to clipboard:', err);
            showShareNotification('Failed to copy link. Please copy manually: ' + shareUrl, true);
        });
    } catch (error) {
        console.error('Error generating share URL:', error);
        alert('Failed to generate share link. Please try again.');
    }
}

// Load data from URL hash on page load
function loadFromUrl() {
    try {
        // Check if URL has a share hash
        const hash = window.location.hash;
        if (!hash.startsWith('#s=')) {
            return; // No share data in URL
        }

        // Extract compressed data
        const compressed = hash.substring(3); // Remove '#s='

        // Decompress the data
        const jsonString = LZString.decompressFromEncodedURIComponent(compressed);

        if (!jsonString) {
            console.error('Failed to decompress URL data');
            alert('Invalid share link. The data could not be loaded.');
            return;
        }

        // Parse JSON
        const data = JSON.parse(jsonString);

        // Import the data
        const result = importData(data);

        if (result.success) {
            // Clear the hash from URL to clean up address bar
            history.replaceState(null, '', window.location.pathname + window.location.search);

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

            showShareNotification('Coverage plan loaded successfully! ✓');
        } else {
            alert('Failed to load shared data: ' + result.error);
        }
    } catch (error) {
        console.error('Error loading from URL:', error);
        alert('Failed to load shared coverage plan. The link may be invalid or corrupted.');
    }
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
