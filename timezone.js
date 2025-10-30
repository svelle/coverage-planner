// Timezone utilities for converting times between timezones

// Common timezones for the selector
const COMMON_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Stockholm',
    'Europe/Warsaw',
    'Europe/Kyiv',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Seoul',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland'
];

// Get formatted timezone name with offset
function getTimezoneDisplayName(timezone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(now);
    const tzName = parts.find(part => part.type === 'timeZoneName')?.value || '';

    // Get offset in hours
    const offset = getTimezoneOffset(timezone);
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

    return `${timezone.replace(/_/g, ' ')} (UTC${offsetStr})`;
}

// Get timezone offset in minutes from UTC
function getTimezoneOffset(timezone) {
    const now = new Date();

    // Get UTC time
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));

    // Get time in target timezone
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

    // Calculate difference in minutes
    return Math.round((tzDate - utcDate) / (1000 * 60));
}

// Convert a time from one timezone to another
// time format: "HH:MM" (24-hour format)
// dayOfWeek: 0-6 (0 = Sunday, 1 = Monday, etc.)
function convertTimeToTimezone(time, dayOfWeek, fromTimezone, toTimezone) {
    // Use a fixed week to avoid DST issues
    const year = 2025;
    const month = 0; // January
    const date = 5 + dayOfWeek; // Jan 5, 2025 is a Sunday

    const [hours, minutes] = time.split(':').map(Number);

    // Create a date in UTC first, then treat it as if it's the local time in fromTimezone
    // We'll use UTC as our reference point
    const dateInFrom = new Date(Date.UTC(year, month, date, hours, minutes, 0));

    // Now we need to adjust this. The date we created is in UTC, but we want it to represent
    // the time in fromTimezone. So we need to find what UTC time corresponds to this local time.
    // We'll get the offset of fromTimezone and adjust
    const fromOffset = getTimezoneOffsetForDate(fromTimezone, dateInFrom);

    // The UTC time that corresponds to our desired local time in fromTimezone
    const utcTime = dateInFrom.getTime() - (fromOffset * 60 * 1000);

    // Now convert this UTC time to the target timezone
    const toOffset = getTimezoneOffsetForDate(toTimezone, new Date(utcTime));
    const targetDate = new Date(utcTime + (toOffset * 60 * 1000));

    const targetHours = targetDate.getUTCHours();
    const targetMinutes = targetDate.getUTCMinutes();
    const targetDay = targetDate.getUTCDay();

    return {
        time: `${String(targetHours).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}`,
        dayOfWeek: targetDay
    };
}

// Get timezone offset for a specific date (handles DST)
function getTimezoneOffsetForDate(timezone, date) {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return Math.round((tzDate - utcDate) / (1000 * 60));
}

// Get all hours of work for a given day in a target timezone
function getWorkingHoursInTimezone(engineerSchedule, dayOfWeek, fromTimezone, toTimezone) {
    const schedule = engineerSchedule[dayOfWeek];
    if (!schedule || !schedule.working) {
        return [];
    }

    const [startHours, startMinutes] = schedule.start.split(':').map(Number);
    const [endHours, endMinutes] = schedule.end.split(':').map(Number);

    // Create timestamps for start and end in engineer's timezone
    const year = 2025;
    const month = 0; // January
    const date = 5 + dayOfWeek; // Jan 5, 2025 is a Sunday

    // Create start time in UTC, representing the time in fromTimezone
    const startDateUTC = new Date(Date.UTC(year, month, date, startHours, startMinutes, 0));
    const startTzOffset = getTimezoneOffsetForDate(fromTimezone, startDateUTC);
    const startUtc = startDateUTC.getTime() - (startTzOffset * 60 * 1000);

    // Create end time in UTC, representing the time in fromTimezone
    let endDateUTC = new Date(Date.UTC(year, month, date, endHours, endMinutes, 0));

    // Handle overnight shifts (end time is before start time)
    if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
        endDateUTC = new Date(endDateUTC.getTime() + 24 * 60 * 60 * 1000); // Add one day
    }

    const endTzOffset = getTimezoneOffsetForDate(fromTimezone, endDateUTC);
    const endUtc = endDateUTC.getTime() - (endTzOffset * 60 * 1000);

    // Convert to target timezone and generate all hours
    const hoursInTargetTz = [];

    // Iterate through each hour in UTC time
    // We need to include all hour blocks where the person is working
    // If someone works 9:00-17:00, they work during hours: 9, 10, 11, 12, 13, 14, 15, 16
    // The loop starts at 9:00 and we need to include the hour block starting at 16:00 (which ends at 17:00)
    // So we iterate while the hour start time is BEFORE the end time
    for (let utcTime = startUtc; utcTime < endUtc; utcTime += 60 * 60 * 1000) {
        const targetTzOffset = getTimezoneOffsetForDate(toTimezone, new Date(utcTime));
        const targetTime = new Date(utcTime + (targetTzOffset * 60 * 1000));

        const targetHour = targetTime.getUTCHours();
        const targetDay = targetTime.getUTCDay();

        hoursInTargetTz.push({
            day: targetDay,
            hour: targetHour
        });
    }

    return hoursInTargetTz;
}

// Get exact working time range for a given day in target timezone (with minute precision)
function getWorkingTimeRangeInTimezone(engineerSchedule, dayOfWeek, fromTimezone, toTimezone) {
    const schedule = engineerSchedule[dayOfWeek];
    if (!schedule || !schedule.working) {
        return null;
    }

    const [startHours, startMinutes] = schedule.start.split(':').map(Number);
    const [endHours, endMinutes] = schedule.end.split(':').map(Number);

    // Convert start time
    const startConverted = convertTimeToTimezone(
        schedule.start,
        dayOfWeek,
        fromTimezone,
        toTimezone
    );

    // Convert end time
    // Handle overnight shifts (end time is before start time)
    let endDayOfWeek = dayOfWeek;
    if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
        endDayOfWeek = (dayOfWeek + 1) % 7; // Next day
    }

    const endConverted = convertTimeToTimezone(
        schedule.end,
        endDayOfWeek,
        fromTimezone,
        toTimezone
    );

    // Parse converted times to get fractional hours (for positioning)
    const [startH, startM] = startConverted.time.split(':').map(Number);
    const [endH, endM] = endConverted.time.split(':').map(Number);

    const startFractional = startH + (startM / 60);
    const endFractional = endH + (endM / 60);

    return {
        startDay: startConverted.dayOfWeek,
        endDay: endConverted.dayOfWeek,
        startTime: startConverted.time,
        endTime: endConverted.time,
        startFractional: startFractional,
        endFractional: endFractional
    };
}

// Populate timezone selectors
function populateTimezoneSelect(selectElement) {
    selectElement.innerHTML = '';

    COMMON_TIMEZONES.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = getTimezoneDisplayName(tz);
        selectElement.appendChild(option);
    });

    // Set default to user's timezone if possible
    try {
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (COMMON_TIMEZONES.includes(userTz)) {
            selectElement.value = userTz;
        }
    } catch (e) {
        selectElement.value = 'UTC';
    }
}
