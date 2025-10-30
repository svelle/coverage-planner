// Export and import functionality

// Export data to JSON file
function exportToJson() {
    const data = exportData(); // Gets all data including groups and schedule types
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coverage-planner-${timestamp}.json`;

    downloadFile(url, filename);
}

// Export data to CSV file
function exportToCsv() {
    if (engineers.length === 0) {
        alert('No data to export');
        return;
    }

    // CSV header - include groups and regular schedule only (for simplicity)
    const headers = ['Name', 'Timezone', 'Groups'];

    // Add headers for regular schedule
    for (let day = 0; day < 7; day++) {
        const dayName = DAYS_OF_WEEK[day];
        headers.push(`${dayName} Working`);
        headers.push(`${dayName} Start`);
        headers.push(`${dayName} End`);
    }

    const rows = [headers];

    // Add each engineer as a row
    engineers.forEach(engineer => {
        const row = [
            escapeCsvValue(engineer.name),
            escapeCsvValue(engineer.timezone)
        ];

        // Add groups
        const engineerGroups = getEngineerGroups(engineer);
        row.push(escapeCsvValue(engineerGroups.map(g => g.name).join('; ')));

        // Add schedule for regular schedule
        const schedule = engineer.schedules?.regular || engineer.schedule || {};

        for (let day = 0; day < 7; day++) {
            const daySchedule = schedule[day];
            if (daySchedule) {
                row.push(daySchedule.working ? 'Yes' : 'No');
                row.push(daySchedule.working ? daySchedule.start : '');
                row.push(daySchedule.working ? daySchedule.end : '');
            } else {
                row.push('No', '', '');
            }
        }

        rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coverage-planner-${timestamp}.csv`;

    downloadFile(url, filename);
}

// Escape CSV values (handle commas, quotes, newlines)
function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

// Download a file
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Export coverage statistics to CSV
function exportCoverageStats(targetTimezone) {
    const stats = getCoverageStats(targetTimezone);
    const coverage = calculateCoverage(targetTimezone);

    // Create detailed coverage CSV
    const headers = ['Day', 'Hour', 'Coverage Count'];
    const rows = [headers];

    DAYS_OF_WEEK.forEach((dayName, dayIndex) => {
        for (let hour = 0; hour < 24; hour++) {
            const count = coverage[dayIndex][hour];
            rows.push([
                dayName,
                String(hour).padStart(2, '0') + ':00',
                count
            ]);
        }
    });

    // Add summary statistics at the end
    rows.push([]);
    rows.push(['Summary Statistics']);
    rows.push(['Total Hours', stats.totalHours]);
    rows.push(['Covered Hours', stats.coveredHours]);
    rows.push(['Coverage Percentage', stats.coveragePercentage + '%']);
    rows.push(['Average Coverage', stats.avgCoverage]);
    rows.push(['Maximum Coverage', stats.maxCoverage]);
    rows.push(['Minimum Coverage (when covered)', stats.minCoverage]);

    const csvContent = rows.map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coverage-stats-${timestamp}.csv`;

    downloadFile(url, filename);
}
