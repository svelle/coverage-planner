# Coverage Planner

A simple web application for planning and visualizing technical support team coverage across multiple timezones.

## Features

- **Engineer Management**: Add, edit, and remove engineers with custom schedules
- **Flexible Scheduling**: Support for part-time, alternating days, weekends, and custom patterns
- **Timezone Support**: View coverage in any timezone with automatic conversion
- **Visual Heatmap**: Color-coded weekly heatmap showing coverage levels (0-7+ engineers)
- **Data Persistence**: Automatic saving to browser localStorage
- **Export/Import**: Export data to JSON or CSV formats, import JSON data

## Getting Started

1. Open `index.html` in your web browser
2. Click "Add Engineer" to add your first team member
3. Configure their timezone and working hours for each day
4. View the coverage heatmap and adjust the timezone selector to see coverage from different perspectives

## Usage

### Adding an Engineer

1. Click the "Add Engineer" button
2. Enter the engineer's name
3. Select their timezone
4. For each day of the week:
   - Check "Working" if they work that day
   - Set their start and end times
5. Click "Save"

### Viewing Coverage

- The heatmap shows 7 days (rows) × 24 hours (columns)
- Color intensity indicates the number of engineers working at that time
- Hover over any cell to see the exact count
- Use the timezone selector to view coverage from different perspectives

### Exporting Data

- **Export JSON**: Full data export that can be re-imported later
- **Export CSV**: Spreadsheet-compatible format for analysis in Excel/Google Sheets

### Importing Data

- Click "Import JSON"
- Select a previously exported JSON file
- All engineers and schedules will be restored

## Technical Details

- **No build tools required**: Plain HTML, CSS, and JavaScript
- **No external dependencies**: All functionality is self-contained
- **Browser compatibility**: Works in all modern browsers
- **Storage**: Uses localStorage (data persists across sessions)
- **Data size**: Typical usage is <50KB, well within localStorage limits

## File Structure

```
coverage-planner/
├── index.html      # Main application structure
├── styles.css      # Styling and layout
├── app.js          # Engineer management logic
├── storage.js      # Data persistence
├── heatmap.js      # Visualization engine
├── timezone.js     # Timezone calculations
└── export.js       # Import/export functionality
```

## Color Legend

- White/Gray: No coverage (0 engineers)
- Light Green: Low coverage (1-2 engineers)
- Medium Green: Moderate coverage (3-4 engineers)
- Green: Good coverage (5-6 engineers)
- Dark Green: Excellent coverage (7+ engineers)

## Tips

- **Business Hours**: Quickly identify gaps in business hours coverage
- **Handoffs**: See when engineers in different timezones can overlap for handoffs
- **Planning**: Add potential hires to see how they'd impact coverage
- **Different Views**: Switch timezones to see coverage from client or stakeholder perspectives

## Privacy & Security

- All data is stored locally in your browser
- No data is sent to any server
- No tracking or analytics
- Exported files are plain JSON/CSV that you control

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Limitations

- Maximum engineers: Limited by browser localStorage (~5-10MB)
- Typical usage supports 100+ engineers without issues
- Data is per-browser (not synced across devices)

## Future Enhancements

Possible improvements for future versions:
- Holiday/vacation tracking
- Team grouping (different support tiers)
- Coverage threshold alerts
- Image export for the heatmap
- Cloud sync for multi-device access
