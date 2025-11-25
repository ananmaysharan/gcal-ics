/**
 * Background Service Worker
 * Handles OAuth authentication and Google Calendar API calls
 */

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

/**
 * Get OAuth token for Google Calendar API
 */
async function getToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Insert a single event into Google Calendar
 */
async function insertEvent(token, eventObj) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventObj)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Convert parsed ICS event to Google Calendar API format
 */
function convertToGoogleFormat(ev) {
  const body = {
    summary: ev.title || ev.summary || "Untitled Event",
    description: ev.description || "",
    location: ev.location || ""
  };

  // Handle dates
  if (ev.allDay) {
    body.start = { date: formatDateOnly(ev.startDate) };
    body.end = { date: formatDateOnly(ev.endDate || ev.startDate) };
  } else {
    body.start = {
      dateTime: formatDateTime(ev.startDate),
      timeZone: ev.timeZone || "UTC"
    };
    body.end = {
      dateTime: formatDateTime(ev.endDate || addHour(ev.startDate)),
      timeZone: ev.timeZone || "UTC"
    };
  }

  // Preserve original iCal UID if present
  if (ev.uid) {
    body.iCalUID = ev.uid;
  }

  return body;
}

/**
 * Format Date object to YYYY-MM-DD
 */
function formatDateOnly(date) {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date object to RFC3339
 */
function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString();
}

/**
 * Add one hour to a date
 */
function addHour(date) {
  const d = new Date(date);
  d.setHours(d.getHours() + 1);
  return d;
}

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.action === "importEvents") {
    (async () => {
      try {
        const token = await getToken(true);
        const results = [];
        const errors = [];

        for (const ev of msg.events) {
          try {
            const body = convertToGoogleFormat(ev);
            const inserted = await insertEvent(token, body);
            results.push({
              success: true,
              id: inserted.id,
              summary: inserted.summary,
              htmlLink: inserted.htmlLink
            });
          } catch (err) {
            errors.push({
              success: false,
              summary: ev.title || ev.summary || "Unknown",
              error: err.message
            });
          }
        }

        sendResponse({
          success: errors.length === 0,
          results,
          errors,
          total: msg.events.length,
          imported: results.length
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message,
          total: 0,
          imported: 0
        });
      }
    })();

    // Return true to indicate async response
    return true;
  }
});
