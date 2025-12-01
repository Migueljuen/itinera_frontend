// utils/calendarHelpers.js
import dayjs from 'dayjs';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/**
 * Requests calendar permission from user.
 * Returns true if granted.
 */
export async function requestCalendarPermission() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

/**
 * Find an existing calendar by title, or create a new app calendar.
 * Returns calendarId.
 */
export async function getOrCreateAppCalendar() {
  // On iOS you need source, on Android create local calendar
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Try to find an existing calendar created by the app
  const existing = calendars.find(c => c.title === 'ItineraryCalendar');

  if (existing) return existing.id;

  // Determine source for new calendar (iOS needs sourceId)
  let defaultSource =
    Platform.OS === 'ios'
      ? calendars.find(c => c.source && c.source.name === 'Default')?.source
      : { isLocalAccount: true, name: 'Expo' };

  // Fallback: pick first calendar's source
  if (!defaultSource && calendars.length > 0) {
    defaultSource = calendars[0].source || defaultSource;
  }

  const newCalendarId = await Calendar.createCalendarAsync({
    title: 'ItineraryCalendar',
    color: '#00AAFF',
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: defaultSource?.id,
    source: defaultSource,
    name: 'ItineraryCalendar',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return newCalendarId;
}

/**
 * Build Date object for an item.
 * Accepts itinerary start_date (YYYY-MM-DD) and item.start_time ("HH:mm" or "HH:mm:ss")
 */
function buildEventDate(dateString, timeString) {
  // If timeString lacks seconds, dayjs handles it
  return dayjs(`${dateString}T${timeString}`).toDate();
}

/**
 * Create a single calendar event for an itinerary item.
 * Returns the native eventId string.
 * item shape assumed: { day_number, start_time, end_time, experience_name, experience_description, destination_city, ... }
 *
 * startDateBase: itinerary start_date as 'YYYY-MM-DD'
 * day_number: 1-based day in itinerary
 */
export async function createEventForItem(calendarId, startDateBase, item, options = {}) {
  const { timezone } = options; // optional

  // compute date for the day_number
  const dayOffset = (item.day_number || 1) - 1; // day_number 1 => offset 0
  const itemDate = dayjs(startDateBase).add(dayOffset, 'day').format('YYYY-MM-DD');

  const startDate = buildEventDate(itemDate, item.start_time || '09:00:00');
  const endDate = buildEventDate(itemDate, item.end_time || '10:00:00');

  const eventDetails = {
    title: item.experience_name || 'Itinerary Item',
    notes: item.experience_description || '',
    location: item.destination_city || '',
    startDate,
    endDate,
    timeZone: timezone || undefined,
    // you may want to add alarms (relativeOffset in minutes). e.g. 30 mins before:
    alarms: [{ relativeOffset: -30 }],
  };

  // Calendar.createEventAsync(calendarId, eventDetails) on some SDK versions expects
  // createEventAsync(calendarId, eventDetails) but docs vary; expo-calendar supports both shapes.
  const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
  return eventId;
}

/**
 * Add entire itinerary to calendar.
 * itinerary = { itinerary_id, start_date, items: [...] }
 * Returns an array of { item_id, eventId } so you can persist mapping.
 */
export async function addItineraryToCalendar(itinerary) {
  const granted = await requestCalendarPermission();
  if (!granted) throw new Error('Calendar permission denied');

  const calendarId = await getOrCreateAppCalendar();

  const mappings = [];

  // iterate items sequentially to avoid race issues with createEventAsync on some devices
  for (const item of itinerary.items || []) {
    try {
      const eventId = await createEventForItem(calendarId, itinerary.start_date, item);
      mappings.push({ item_id: item.item_id, eventId });
    } catch (err) {
      console.error(`Failed to create event for item ${item.item_id}:`, err);
    }
  }

  return { calendarId, mappings };
}

/**
 * Remove events by eventIds (array of strings)
 */
export async function removeEvents(eventIds = []) {
  for (const id of eventIds) {
    try {
      await Calendar.deleteEventAsync(id);
    } catch (err) {
      console.warn('Failed to delete event', id, err.message);
    }
  }
}
