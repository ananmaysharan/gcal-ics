/**
 * ICS File Parser
 * Parses .ics files and extracts event data
 */

class ICSParser {
  /**
   * Parse an ICS file content
   * @param {string} icsContent - The raw ICS file content
   * @returns {Array} Array of event objects
   */
  static parse(icsContent) {
    const events = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent = null;
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Handle line continuation (lines starting with space or tab)
      while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
        line += lines[i + 1].trim();
        i++;
      }

      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        if (currentEvent) {
          events.push(currentEvent);
        }
        currentEvent = null;
        inEvent = false;
      } else if (inEvent && currentEvent) {
        this.parseEventLine(line, currentEvent);
      }
    }

    return events;
  }

  /**
   * Parse a single line of an event
   */
  static parseEventLine(line, event) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const fullKey = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    // Split key and parameters
    const [key, ...params] = fullKey.split(';');

    switch (key) {
      case 'SUMMARY':
        event.title = this.decodeValue(value);
        break;

      case 'DESCRIPTION':
        event.description = this.decodeValue(value);
        break;

      case 'LOCATION':
        event.location = this.decodeValue(value);
        break;

      case 'DTSTART':
        event.startDate = this.parseDate(value, params);
        event.allDay = params.some(p => p.includes('VALUE=DATE'));
        break;

      case 'DTEND':
        event.endDate = this.parseDate(value, params);
        break;

      case 'RRULE':
        event.recurrence = value;
        break;

      case 'UID':
        event.uid = value;
        break;

      case 'STATUS':
        event.status = value;
        break;

      case 'URL':
        event.url = value;
        break;

      case 'ORGANIZER':
        event.organizer = this.parseOrganizer(value, params);
        break;

      case 'ATTENDEE':
        if (!event.attendees) event.attendees = [];
        event.attendees.push(this.parseAttendee(value, params));
        break;
    }
  }

  /**
   * Parse date from ICS format
   */
  static parseDate(dateStr, params = []) {
    // Remove any timezone info for simplicity
    dateStr = dateStr.split('T')[0] + (dateStr.includes('T') ? 'T' + dateStr.split('T')[1].split('Z')[0] : '');

    if (dateStr.length === 8) {
      // Date only (YYYYMMDD)
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(year, month - 1, day);
    } else {
      // DateTime (YYYYMMDDTHHMMSS)
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(9, 11);
      const minute = dateStr.substring(11, 13);
      const second = dateStr.substring(13, 15);
      return new Date(year, month - 1, day, hour, minute, second);
    }
  }

  /**
   * Decode ICS value (handle escaping)
   */
  static decodeValue(value) {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Parse organizer information
   */
  static parseOrganizer(value, params) {
    let name = '';
    for (const param of params) {
      if (param.startsWith('CN=')) {
        name = param.substring(3).replace(/"/g, '');
      }
    }
    return {
      email: value.replace('mailto:', ''),
      name: name
    };
  }

  /**
   * Parse attendee information
   */
  static parseAttendee(value, params) {
    let name = '';
    let role = 'REQ-PARTICIPANT';
    let status = 'NEEDS-ACTION';

    for (const param of params) {
      if (param.startsWith('CN=')) {
        name = param.substring(3).replace(/"/g, '');
      } else if (param.startsWith('ROLE=')) {
        role = param.substring(5);
      } else if (param.startsWith('PARTSTAT=')) {
        status = param.substring(9);
      }
    }

    return {
      email: value.replace('mailto:', ''),
      name: name,
      role: role,
      status: status
    };
  }

  /**
   * Format event for Google Calendar
   */
  static formatForGoogleCalendar(event) {
    return {
      title: event.title || 'Untitled Event',
      description: event.description || '',
      location: event.location || '',
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay || false,
      recurrence: event.recurrence,
      url: event.url
    };
  }
}
