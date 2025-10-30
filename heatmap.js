// Heatmap visualization

// Render the coverage heatmap
function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    const selectedTimezone = document.getElementById('timezoneSelect').value;
    const scheduleType = document.getElementById('scheduleTypeSelect').value;

    if (engineers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Add engineers to see coverage visualization</p>
            </div>
        `;
        return;
    }

    // Calculate coverage for each day/hour
    const coverage = calculateCoverage(selectedTimezone, scheduleType);

    // Create heatmap table
    const table = document.createElement('table');
    table.className = 'heatmap';

    // Header row with hours
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th class="day-label">Day</th>';
    for (let hour = 0; hour < 24; hour++) {
        const th = document.createElement('th');
        th.textContent = String(hour).padStart(2, '0');
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Data rows for each day
    DAYS_OF_WEEK.forEach((dayName, dayIndex) => {
        const row = document.createElement('tr');

        // Day label
        const dayCell = document.createElement('td');
        dayCell.className = 'day-label';
        dayCell.textContent = dayName;
        row.appendChild(dayCell);

        // Hour cells
        for (let hour = 0; hour < 24; hour++) {
            const cell = document.createElement('td');
            const count = coverage[dayIndex][hour];
            const coverageClass = getCoverageClass(count);

            cell.className = `hour-cell ${coverageClass}`;
            cell.textContent = count > 0 ? count : '';

            // Add tooltip
            setupTooltipForCell(cell, dayIndex, hour, selectedTimezone, scheduleType);

            row.appendChild(cell);
        }

        table.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(table);
}

// Calculate coverage for each day/hour in the selected timezone
function calculateCoverage(targetTimezone, scheduleType = 'all') {
    // Initialize coverage matrix (7 days x 24 hours)
    const coverage = Array(7).fill(null).map(() => Array(24).fill(0));

    // Determine which schedule types to check
    const typesToCheck = scheduleType === 'all'
        ? scheduleTypes.map(st => st.id)
        : [scheduleType];

    // For each engineer, calculate their working hours in the target timezone
    engineers.forEach(engineer => {
        // Filter by active group if set
        if (activeGroupFilter && (!engineer.groups || !engineer.groups.includes(activeGroupFilter))) {
            return;
        }

        // Check each schedule type
        typesToCheck.forEach(stId => {
            const schedule = engineer.schedules?.[stId] || (stId === 'regular' ? engineer.schedule : null);
            if (!schedule) return;

            for (let day = 0; day < 7; day++) {
                const daySchedule = schedule[day];
                if (!daySchedule || !daySchedule.working) {
                    continue;
                }

                // Get working hours converted to target timezone
                const workingHours = getWorkingHoursInTimezone(
                    schedule,
                    day,
                    engineer.timezone,
                    targetTimezone
                );

                // Increment coverage for each working hour
                workingHours.forEach(({ day: targetDay, hour }) => {
                    if (targetDay >= 0 && targetDay < 7 && hour >= 0 && hour < 24) {
                        coverage[targetDay][hour]++;
                    }
                });
            }
        });
    });

    return coverage;
}

// Get CSS class for coverage level
function getCoverageClass(count) {
    if (count === 0) return 'coverage-0';
    if (count === 1) return 'coverage-1';
    if (count === 2) return 'coverage-2';
    if (count === 3) return 'coverage-3';
    if (count === 4) return 'coverage-4';
    if (count === 5) return 'coverage-5';
    if (count === 6) return 'coverage-6';
    if (count === 7) return 'coverage-7';
    return 'coverage-8';
}

// Get coverage statistics
function getCoverageStats(targetTimezone) {
    const coverage = calculateCoverage(targetTimezone);

    let totalHours = 0;
    let coveredHours = 0;
    let totalCoverage = 0;
    let maxCoverage = 0;
    let minCoverage = Infinity;

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const count = coverage[day][hour];
            totalHours++;
            if (count > 0) coveredHours++;
            totalCoverage += count;
            maxCoverage = Math.max(maxCoverage, count);
            if (count > 0) minCoverage = Math.min(minCoverage, count);
        }
    }

    const coveragePercentage = ((coveredHours / totalHours) * 100).toFixed(1);
    const avgCoverage = coveredHours > 0 ? (totalCoverage / coveredHours).toFixed(1) : 0;

    return {
        totalHours: totalHours,
        coveredHours: coveredHours,
        coveragePercentage: coveragePercentage,
        avgCoverage: avgCoverage,
        maxCoverage: maxCoverage,
        minCoverage: minCoverage === Infinity ? 0 : minCoverage
    };
}
