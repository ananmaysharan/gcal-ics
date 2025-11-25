# ICS Calendar Drop

A Chrome extension that allows you to drag and drop ICS (iCalendar) files directly into Google Calendar for seamless event import. Built with Material 3 (Material You) design principles for a beautiful, modern experience.

## Features

- 🎯 **Drag and Drop Interface** - Simply drag any `.ics` or `.ical` file anywhere on Google Calendar
- 🎨 **Material 3 Design** - Beautiful full-screen overlay and dialogs following Google's latest Material You guidelines
- ⚡ **Smart Preview** - Review all events in a confirmation dialog before importing
- 📅 **Full Event Support** - Imports titles, descriptions, locations, dates, and recurrence rules
- 🔒 **Privacy First** - All processing happens locally in your browser

## Installation

### Option 1: Install from Source (Developer Mode)

1. **Download or Clone this Repository**
   ```bash
   git clone https://github.com/yourusername/ics-calendar-drop.git
   cd ics-calendar-drop
   ```

2. **Generate Icons**
   - Open `icons/generate-icons.html` in your browser
   - Click the download buttons to generate `icon16.png`, `icon48.png`, and `icon128.png`
   - Save all three files in the `icons/` directory

3. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `ics-calendar-drop` directory

4. **Verify Installation**
   - You should see "ICS Calendar Drop" in your extensions list
   - The extension will automatically activate on Google Calendar

### Option 2: Alternative Icon Generation

If you prefer, you can use any PNG icons (16x16, 48x48, 128x128) and place them in the `icons/` directory with the names:
- `icon16.png`
- `icon48.png`
- `icon128.png`

You can also convert the included `icons/icon.svg` to PNG using an online tool or image editor.

## Usage

1. **Navigate to Google Calendar**
   - Go to [calendar.google.com](https://calendar.google.com)
   - Make sure you're logged in

2. **Drag and Drop ICS Files**
   - Obtain an ICS file (from email invites, other calendar apps, etc.)
   - Drag the ICS file anywhere on the Google Calendar page
   - A beautiful Material 3 full-screen overlay will appear

3. **Review Events**
   - Release the file to show the import dialog
   - A Material 3 dialog appears with all parsed events
   - Review event details including titles, dates, locations, and descriptions

4. **Import to Calendar**
   - Click "Import Events" to proceed
   - The extension downloads the processed ICS file
   - Follow the prompt to open Google Calendar's import settings
   - Use the downloaded file to complete the import

## How It Works

1. **Full-Screen Drop Zone** - The extension monitors drag events across the entire Google Calendar page
2. **File Parsing** - When an ICS file is dropped, it's parsed using a custom ICS parser
3. **Event Extraction** - Events are extracted with all their properties (title, time, location, etc.)
4. **Preview Dialog** - A Material 3 dialog shows all events for review
5. **Smart Import** - Downloads a clean ICS file and guides you to Google Calendar's import feature

## Supported ICS Properties

- ✅ Event Title (SUMMARY)
- ✅ Description (DESCRIPTION)
- ✅ Location (LOCATION)
- ✅ Start Date/Time (DTSTART)
- ✅ End Date/Time (DTEND)
- ✅ All-Day Events
- ✅ Recurring Events (RRULE)
- ✅ Organizer Information
- ✅ Attendees
- ✅ Event URL

## Troubleshooting

### Extension Not Working
- Make sure you're on `calendar.google.com`
- Refresh the Google Calendar page after installing
- Check that the extension is enabled in `chrome://extensions/`

### Events Not Importing
- Verify the file has a `.ics` or `.ical` extension
- Check browser console for error messages (F12 → Console)
- Ensure the ICS file is properly formatted

### Overlay Not Appearing
- Try refreshing the page
- Check that you're dragging a file (not text or links)
- Verify the extension is active in Chrome's extensions menu
- Check browser console for errors (F12 → Console)

### Dialog Not Showing
- Check browser console for errors (F12 → Console)
- Ensure popups are not blocked in your browser settings
- Try disabling other calendar extensions that might conflict

## Development

### Project Structure
```
ics-calendar-drop/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── ics-parser.js         # ICS file parser
├── styles.css            # Material Design styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon.svg
│   └── generate-icons.html
└── README.md            # This file
```

### Technologies Used
- **Manifest V3** - Latest Chrome extension format
- **Vanilla JavaScript** - No dependencies, pure JS
- **Material 3 (Material You)** - Google's latest design system with updated colors, typography, and interactions
- **ICS/iCalendar Parsing** - Custom parser implementation

### Making Changes
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload Google Calendar to test changes

## Privacy & Security

- ✅ **No Data Collection** - Extension doesn't collect or transmit any data
- ✅ **Local Processing** - All ICS parsing happens in your browser
- ✅ **No External Requests** - Doesn't connect to external servers
- ✅ **Minimal Permissions** - Only requests access to calendar.google.com

## Browser Compatibility

- ✅ Google Chrome (90+)
- ✅ Microsoft Edge (90+)
- ✅ Brave Browser
- ✅ Other Chromium-based browsers

## Known Limitations

- Requires one additional step: downloading the ICS file and using Google Calendar's import settings
- Requires Google Calendar web interface to be open
- Some complex recurrence rules may need manual adjustment after import

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built following Google's Material Design guidelines
- ICS format specification: [RFC 5545](https://tools.ietf.org/html/rfc5545)
- Inspired by the need for easier calendar event imports

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the browser console for error messages

## Roadmap

Future improvements planned:
- [ ] Direct import without download step (if Google Calendar API allows)
- [ ] Support for more ICS properties (VALARM, VTIMEZONE, etc.)
- [ ] Custom calendar selection in preview dialog
- [ ] Duplicate event detection and merging
- [ ] Dark mode support for dialog
- [ ] Event editing before import
- [ ] Export selected events back to ICS

---

Made with ❤️ for Google Calendar users
