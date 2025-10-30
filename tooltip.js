// Enhanced tooltip for heatmap cells

// Create and show tooltip
function showTooltip(cell, day, hour, targetTimezone, scheduleType) {
    // Remove any existing tooltip
    hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.id = 'heatmap-tooltip';
    tooltip.className = 'heatmap-tooltip';

    // Get engineers working at this time
    const engineersWorking = getEngineersAtTime(day, hour, targetTimezone, scheduleType);

    // Build tooltip content
    const dayName = DAYS_OF_WEEK[day];
    const timeStr = `${String(hour).padStart(2, '0')}:00`;

    let html = `
        <div class="tooltip-header">
            <strong>${timeStr} - ${dayName}</strong>
        </div>
    `;

    if (engineersWorking.length === 0) {
        html += `<div class="tooltip-body">No coverage</div>`;
    } else {
        // Group by schedule type if viewing all
        if (scheduleType === 'all') {
            const byType = {};
            engineersWorking.forEach(eng => {
                if (!byType[eng.scheduleTypeName]) {
                    byType[eng.scheduleTypeName] = [];
                }
                byType[eng.scheduleTypeName].push(eng);
            });

            html += '<div class="tooltip-body">';

            Object.keys(byType).forEach(typeName => {
                const engs = byType[typeName];
                const schedType = scheduleTypes.find(st => st.name === typeName);
                const color = schedType ? schedType.color : '#666';

                html += `
                    <div class="tooltip-section">
                        <div class="tooltip-section-header">
                            <span class="tooltip-type-indicator" style="background-color: ${color}"></span>
                            <strong>${typeName}</strong> (${engs.length})
                        </div>
                        <ul class="tooltip-engineer-list">
                `;

                engs.forEach(eng => {
                    const groupTags = getGroupTags(eng.engineer);
                    html += `
                        <li>
                            <span class="tooltip-engineer-name">${escapeHtml(eng.engineer.name)}</span>
                            ${groupTags}
                            <span class="tooltip-local-time">${eng.localTime} local</span>
                        </li>
                    `;
                });

                html += `
                        </ul>
                    </div>
                `;
            });

            html += '</div>';
        } else {
            // Single schedule type view
            html += '<div class="tooltip-body"><ul class="tooltip-engineer-list">';

            engineersWorking.forEach(eng => {
                const groupTags = getGroupTags(eng.engineer);
                html += `
                    <li>
                        <span class="tooltip-engineer-name">${escapeHtml(eng.engineer.name)}</span>
                        ${groupTags}
                        <span class="tooltip-local-time">${eng.localTime} local</span>
                    </li>
                `;
            });

            html += '</ul></div>';
        }

        html += `
            <div class="tooltip-footer">
                Total: ${engineersWorking.length} engineer${engineersWorking.length !== 1 ? 's' : ''}
            </div>
        `;
    }

    tooltip.innerHTML = html;
    document.body.appendChild(tooltip);

    // Set up hover listeners on the tooltip itself
    setupTooltipHoverListeners(tooltip);

    // Position tooltip
    positionTooltip(tooltip, cell);
}

// Get group tags HTML for an engineer
function getGroupTags(engineer) {
    if (!engineer.groups || engineer.groups.length === 0) {
        return '';
    }

    const engineerGroups = getEngineerGroups(engineer);
    if (engineerGroups.length === 0) {
        return '';
    }

    return engineerGroups.map(group =>
        `<span class="tooltip-group-tag" style="background-color: ${group.color}">${escapeHtml(group.name)}</span>`
    ).join(' ');
}

// Get engineers working at a specific time
function getEngineersAtTime(day, hour, targetTimezone, scheduleType) {
    const result = [];

    engineers.forEach(engineer => {
        // Filter by active group if set
        if (activeGroupFilter && (!engineer.groups || !engineer.groups.includes(activeGroupFilter))) {
            return;
        }

        // Check each schedule type
        const scheduleTypesToCheck = scheduleType === 'all'
            ? scheduleTypes.map(st => st.id)
            : [scheduleType];

        scheduleTypesToCheck.forEach(stId => {
            const schedule = engineer.schedules[stId];
            if (!schedule) return;

            const workingHours = getWorkingHoursInTimezone(
                schedule,
                day,
                engineer.timezone,
                targetTimezone
            );

            // Check if working at this hour
            const isWorking = workingHours.some(wh =>
                wh.day === day && wh.hour === hour
            );

            if (isWorking) {
                // Calculate local time for this engineer
                const localTime = calculateLocalTime(day, hour, targetTimezone, engineer.timezone);
                const schedType = scheduleTypes.find(st => st.id === stId);

                result.push({
                    engineer: engineer,
                    localTime: localTime,
                    scheduleType: stId,
                    scheduleTypeName: schedType ? schedType.name : stId
                });
            }
        });
    });

    return result;
}

// Calculate local time for an engineer
function calculateLocalTime(day, hour, fromTimezone, toTimezone) {
    const converted = convertTimeToTimezone(
        `${String(hour).padStart(2, '0')}:00`,
        day,
        fromTimezone,
        toTimezone
    );

    return converted.time;
}

// Position tooltip near the cell
function positionTooltip(tooltip, cell) {
    const cellRect = cell.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = cellRect.left + (cellRect.width / 2) - (tooltipRect.width / 2);
    let top = cellRect.top - tooltipRect.height - 10;

    // Keep tooltip in viewport
    const padding = 10;

    if (left < padding) {
        left = padding;
    } else if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
    }

    // If tooltip would be above viewport, show below instead
    if (top < padding) {
        top = cellRect.bottom + 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('heatmap-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Global timeout for hiding tooltips
let tooltipHideTimeout = null;

// Set up tooltip event listeners for a cell
function setupTooltipForCell(cell, day, hour, targetTimezone, scheduleType) {
    cell.addEventListener('mouseenter', () => {
        clearTimeout(tooltipHideTimeout);
        showTooltip(cell, day, hour, targetTimezone, scheduleType);
    });

    cell.addEventListener('mouseleave', () => {
        tooltipHideTimeout = setTimeout(hideTooltip, 300);
    });
}

// Set up tooltip event listeners on the tooltip itself
function setupTooltipHoverListeners(tooltip) {
    tooltip.addEventListener('mouseenter', () => {
        clearTimeout(tooltipHideTimeout);
    });

    tooltip.addEventListener('mouseleave', () => {
        tooltipHideTimeout = setTimeout(hideTooltip, 300);
    });
}
