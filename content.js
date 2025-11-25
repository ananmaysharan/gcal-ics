/**
 * ICS Calendar Drop - Content Script (Material 3)
 * Handles drag and drop of ICS files into Google Calendar
 */

(function() {
  'use strict';

  let overlay = null;
  let importDialog = null;
  let dialogBackdrop = null;
  let messageToast = null;
  let dragCounter = 0;
  let parsedEvents = null;

  /**
   * Initialize the extension
   */
  function init() {
    createOverlay();
    createImportDialog();
    createMessageToast();
    setupDragAndDropListeners();
  }

  /**
   * Create the drop overlay (full screen)
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

    // Append to body for full screen coverage
    document.body.appendChild(overlay);
  }

  /**
   * Create import confirmation dialog
   */
  function createImportDialog() {
    // Backdrop
    dialogBackdrop = document.createElement('div');
    dialogBackdrop.className = 'dialog-backdrop';
    dialogBackdrop.addEventListener('click', hideImportDialog);
    document.body.appendChild(dialogBackdrop);

    // Dialog
    importDialog = document.createElement('div');
    importDialog.id = 'ics-import-dialog';
    importDialog.innerHTML = `
      <div class="dialog-header">
        <h2 class="dialog-title">Import Calendar Events</h2>
      </div>
      <div class="dialog-body" id="dialog-events">
        <!-- Events will be inserted here -->
      </div>
      <div class="dialog-actions">
        <button class="dialog-button text" id="dialog-cancel">Cancel</button>
        <button class="dialog-button filled" id="dialog-import">Import Events</button>
      </div>
    `;
    document.body.appendChild(importDialog);

    // Event listeners
    document.getElementById('dialog-cancel').addEventListener('click', hideImportDialog);
    document.getElementById('dialog-import').addEventListener('click', importEvents);
  }

  /**
   * Show import dialog with events
   */
  function showImportDialog(events) {
    parsedEvents = events;
    const eventsContainer = document.getElementById('dialog-events');
    eventsContainer.innerHTML = '';

    events.forEach((event) => {
      const eventEl = document.createElement('div');
      eventEl.className = 'event-item';

      const dateStr = event.startDate ? formatDateForDisplay(event.startDate, event.endDate, event.allDay) : 'No date';

      eventEl.innerHTML = `
        <div class="event-title">${escapeHtml(event.title || 'Untitled Event')}</div>
        <div class="event-details">📅 ${dateStr}</div>
        ${event.location ? `<div class="event-details">📍 ${escapeHtml(event.location)}</div>` : ''}
        ${event.description ? `<div class="event-details">📝 ${escapeHtml(event.description.substring(0, 100))}${event.description.length > 100 ? '...' : ''}</div>` : ''}
      `;

      eventsContainer.appendChild(eventEl);
    });

    dialogBackdrop.classList.add('show');
    importDialog.classList.add('show');
  }

  /**
   * Hide import dialog
   */
  function hideImportDialog() {
    dialogBackdrop.classList.remove('show');
    importDialog.classList.remove('show');
    parsedEvents = null;
  }

  /**
   * Import events using Google Calendar API via background script
   */
  async function importEvents() {
    if (!parsedEvents || parsedEvents.length === 0) return;

    const events = parsedEvents;
    hideImportDialog();

    // Show importing message
    showMessage(`Importing ${events.length} event(s)...`, 'success');

    try {
      // Send to background script
      chrome.runtime.sendMessage(
        { action: "importEvents", events },
        (response) => {
          if (!response) {
            showMessage('No response from extension. Please check permissions.', 'error');
            return;
          }

          if (response.success) {
            showMessage(`✓ Successfully imported ${response.imported} event(s)!`, 'success');
            // Refresh calendar page after a delay
            setTimeout(() => location.reload(), 2000);
          } else {
            if (response.imported > 0) {
              showMessage(`Imported ${response.imported} of ${response.total} events. Some failed.`, 'error');
            } else {
              showMessage(`Import failed: ${response.error || 'Unknown error'}`, 'error');
            }
          }
        }
      );
    } catch (error) {
      console.error('Error importing events:', error);
      showMessage('Error importing events: ' + error.message, 'error');
    }
  }

  /**
   * Format date for display
   */
  function formatDateForDisplay(startDate, endDate, allDay) {
    if (!startDate) return 'No date';

    const options = allDay
      ? { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
      : { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    const start = new Date(startDate).toLocaleDateString('en-US', options);

    if (endDate && new Date(endDate).getTime() !== new Date(startDate).getTime()) {
      const end = new Date(endDate).toLocaleDateString('en-US', options);
      return `${start} → ${end}`;
    }

    return start;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    }, 5000);
  }

  /**
   * Setup drag and drop event listeners on document
   */
  function setupDragAndDropListeners() {
    // Attach to document for full screen drag and drop
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
    e.stopPropagation();
    dragCounter++;

    // Check if dragged item contains files
    if (e.dataTransfer.types.includes('Files')) {
      if (overlay) {
        overlay.classList.add('active');
      }
    }
  }

  /**
   * Handle drag over event
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }

  /**
   * Handle drag leave event
   */
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;

    if (dragCounter === 0) {
      if (overlay) {
        overlay.classList.remove('active');
      }
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
      if (overlay) {
        overlay.classList.remove('active');
      }
      showMessage('Please drop an ICS calendar file', 'error');
      return;
    }

    // Show processing state
    if (overlay) {
      overlay.classList.add('processing');
      updateOverlayText('Processing...', 'Reading your calendar file');
    }

    try {
      const allEvents = [];

      for (const file of icsFiles) {
        const events = await processICSFile(file);
        allEvents.push(...events);
      }

      if (overlay) {
        overlay.classList.remove('active', 'processing');
      }

      if (allEvents.length === 0) {
        showMessage('No events found in the file', 'error');
        return;
      }

      // Show import dialog
      showImportDialog(allEvents);

    } catch (error) {
      console.error('Error processing ICS file:', error);
      if (overlay) {
        overlay.classList.remove('active', 'processing');
      }
      showMessage('Error reading calendar file: ' + error.message, 'error');
    }
  }

  /**
   * Update overlay text
   */
  function updateOverlayText(title, subtitle) {
    if (!overlay) return;
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

      reader.onload = function(e) {
        try {
          const icsContent = e.target.result;
          const events = ICSParser.parse(icsContent);
          resolve(events);
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize if overlay gets removed from DOM
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        if (overlay && !document.contains(overlay)) {
          init();
        }
      }, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();
