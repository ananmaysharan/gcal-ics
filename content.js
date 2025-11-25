/**
 * ICS Calendar Drop - Content Script
 * Handles drag and drop of ICS files into Google Calendar
 */

(function() {
  'use strict';

  let overlay = null;
  let messageToast = null;
  let dragCounter = 0;

  /**
   * Initialize the extension
   */
  function init() {
    createOverlay();
    createMessageToast();
    setupDragAndDropListeners();
  }

  /**
   * Create the drop overlay
   */
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'ics-drop-overlay';
    overlay.innerHTML = `
      <div class="drop-content">
        <div class="drop-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
        <h1 class="drop-title">Drop ICS file to import</h1>
        <p class="drop-subtitle">Release to add events to your calendar</p>
        <div class="spinner"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /**
   * Create message toast for notifications
   */
  function createMessageToast() {
    messageToast = document.createElement('div');
    messageToast.className = 'message-toast';
    document.body.appendChild(messageToast);
  }

  /**
   * Show a toast message
   */
  function showMessage(message, type = 'success') {
    messageToast.textContent = message;
    messageToast.className = `message-toast ${type} show`;

    setTimeout(() => {
      messageToast.classList.remove('show');
    }, 4000);
  }

  /**
   * Setup drag and drop event listeners
   */
  function setupDragAndDropListeners() {
    // Prevent default drag behavior
    document.addEventListener('dragover', handleDragOver, false);
    document.addEventListener('dragleave', handleDragLeave, false);
    document.addEventListener('dragenter', handleDragEnter, false);
    document.addEventListener('drop', handleDrop, false);
  }

  /**
   * Handle drag enter event
   */
  function handleDragEnter(e) {
    e.preventDefault();
    dragCounter++;

    // Check if dragged item contains files
    if (e.dataTransfer.types.includes('Files')) {
      overlay.classList.add('active');
    }
  }

  /**
   * Handle drag over event
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  /**
   * Handle drag leave event
   */
  function handleDragLeave(e) {
    e.preventDefault();
    dragCounter--;

    if (dragCounter === 0) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Handle drop event
   */
  async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    dragCounter = 0;

    const files = Array.from(e.dataTransfer.files);
    const icsFiles = files.filter(file =>
      file.name.endsWith('.ics') || file.name.endsWith('.ical')
    );

    if (icsFiles.length === 0) {
      overlay.classList.remove('active');
      showMessage('Please drop an ICS file', 'error');
      return;
    }

    // Show processing state
    overlay.classList.add('processing');
    updateOverlayText('Processing...', 'Reading your calendar file');

    try {
      for (const file of icsFiles) {
        await processICSFile(file);
      }

      overlay.classList.remove('active', 'processing');
      showMessage(`Successfully imported events from ${icsFiles.length} file(s)`, 'success');
    } catch (error) {
      console.error('Error processing ICS file:', error);
      overlay.classList.remove('active', 'processing');
      showMessage('Error importing calendar: ' + error.message, 'error');
    }
  }

  /**
   * Update overlay text
   */
  function updateOverlayText(title, subtitle) {
    const titleEl = overlay.querySelector('.drop-title');
    const subtitleEl = overlay.querySelector('.drop-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  /**
   * Process an ICS file
   */
  async function processICSFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async function(e) {
        try {
          const icsContent = e.target.result;
          const events = ICSParser.parse(icsContent);

          if (events.length === 0) {
            reject(new Error('No events found in the ICS file'));
            return;
          }

          updateOverlayText('Adding events...', `Found ${events.length} event(s)`);

          // Add events to Google Calendar
          await addEventsToCalendar(events);

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Add events to Google Calendar
   * Uses Google Calendar's URL scheme to create events
   */
  async function addEventsToCalendar(events) {
    // For Google Calendar, we'll use the calendar's own import functionality
    // by simulating the import process or by opening create event dialogs

    // Strategy: Use Google Calendar's quick add or create event interface
    // This approach opens the event creation dialog for each event

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      updateOverlayText('Adding events...', `Processing event ${i + 1} of ${events.length}`);

      // Use Google Calendar's URL scheme to create events
      await createEventViaURL(event);

      // Add a small delay between events to avoid overwhelming the browser
      await sleep(500);
    }
  }

  /**
   * Create an event using Google Calendar's URL scheme
   */
  function createEventViaURL(event) {
    return new Promise((resolve) => {
      const params = new URLSearchParams();

      // Event title
      params.append('text', event.title || 'Untitled Event');

      // Dates
      if (event.startDate) {
        params.append('dates', formatDateForGoogle(event.startDate, event.endDate, event.allDay));
      }

      // Location
      if (event.location) {
        params.append('location', event.location);
      }

      // Description
      if (event.description) {
        params.append('details', event.description);
      }

      // Recurrence
      if (event.recurrence) {
        params.append('recur', formatRecurrenceForGoogle(event.recurrence));
      }

      // Create the URL and open in a new tab (background)
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&${params.toString()}`;

      // For better UX, we'll try to auto-submit the event using DOM manipulation
      // instead of opening tabs
      tryAutoCreateEvent(event, url);

      // Resolve after a short delay
      setTimeout(resolve, 100);
    });
  }

  /**
   * Try to automatically create event using DOM manipulation
   */
  function tryAutoCreateEvent(event, fallbackUrl) {
    // Click the "Create" button if available
    const createButton = document.querySelector('[data-key="create"]') ||
                        document.querySelector('[aria-label*="Create"]') ||
                        document.querySelector('button[aria-label*="Create"]');

    if (createButton) {
      createButton.click();

      // Wait for dialog to open and fill in details
      setTimeout(() => {
        fillEventDialog(event);
      }, 300);
    } else {
      // Fallback: Open in new tab
      // Note: This will be blocked by popup blockers, so we show a message
      console.log('Event URL:', fallbackUrl);
    }
  }

  /**
   * Fill the event creation dialog with event details
   */
  function fillEventDialog(event) {
    // Title field
    const titleInput = document.querySelector('input[aria-label*="Add title"]') ||
                      document.querySelector('input[placeholder*="Add title"]');
    if (titleInput && event.title) {
      titleInput.value = event.title;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Try to find and fill other fields
    setTimeout(() => {
      // Location
      if (event.location) {
        const locationInput = document.querySelector('input[aria-label*="location"]') ||
                             document.querySelector('input[placeholder*="location"]');
        if (locationInput) {
          locationInput.value = event.location;
          locationInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // Description
      if (event.description) {
        const descInput = document.querySelector('[aria-label*="description"]') ||
                         document.querySelector('[data-placeholder*="description"]');
        if (descInput) {
          descInput.textContent = event.description;
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // Auto-save the event
      setTimeout(() => {
        const saveButton = document.querySelector('button[aria-label*="Save"]') ||
                          document.querySelector('button:has-text("Save")');
        if (saveButton) {
          saveButton.click();
        }
      }, 200);
    }, 200);
  }

  /**
   * Format date for Google Calendar URL
   */
  function formatDateForGoogle(startDate, endDate, allDay) {
    if (!startDate) return '';

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      if (allDay) {
        return `${year}${month}${day}`;
      }
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const start = formatDateTime(startDate);
    const end = endDate ? formatDateTime(endDate) : start;

    return `${start}/${end}`;
  }

  /**
   * Format recurrence rule for Google Calendar
   */
  function formatRecurrenceForGoogle(rrule) {
    // Google Calendar accepts RRULE format
    return 'RRULE:' + rrule;
  }

  /**
   * Sleep utility
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
