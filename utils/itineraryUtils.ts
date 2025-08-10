import API_URL from '../constants/api';
import type { Itinerary, ItineraryItem } from '../types/itineraryTypes';
export const isDayPast = (dayNumber: number, itinerary: Itinerary | null) => {
    if (!itinerary) return false;

    const startDate = new Date(itinerary.start_date);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayNumber - 1);

    const endOfDay = new Date(dayDate);
    endOfDay.setHours(23, 59, 59, 999);

    return endOfDay < new Date();
};

export const isItemPast = (item: ItineraryItem, itinerary: Itinerary | null) => {
    if (!itinerary) return false;

    const startDate = new Date(itinerary.start_date);
    const itemDate = new Date(startDate);
    itemDate.setDate(startDate.getDate() + item.day_number - 1);

    const itemStartDate = new Date(itemDate);
    const [startHours, startMinutes] = item.start_time.split(':').map(Number);
    itemStartDate.setHours(startHours, startMinutes, 0, 0);

    return new Date() >= itemStartDate;
};

export const isItemOngoing = (item: ItineraryItem, itinerary: Itinerary | null) => {
    if (!itinerary) return false;

    const startDate = new Date(itinerary.start_date);
    const itemDate = new Date(startDate);
    itemDate.setDate(startDate.getDate() + item.day_number - 1);

    const itemStartDate = new Date(itemDate);
    const [startHours, startMinutes] = item.start_time.split(':').map(Number);
    itemStartDate.setHours(startHours, startMinutes, 0, 0);

    const itemEndDate = new Date(itemDate);
    const [endHours, endMinutes] = item.end_time.split(':').map(Number);
    itemEndDate.setHours(endHours, endMinutes, 0, 0);

    const now = new Date();
    return now >= itemStartDate && now < itemEndDate;
};

export const formatTime = (time: string | undefined | null) => {
    if (!time) return 'Invalid Time';

    const timeStr = String(time).trim();
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;

    const hours = parseInt(parts[0]) || 0;
    const minutes = parts[1] || '00';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes} ${ampm}`;
};

export const getImageUri = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
};

export const groupItemsByDay = (items: ItineraryItem[]) => {
    return items.reduce((acc, item) => {
        if (!acc[item.day_number]) acc[item.day_number] = [];
        acc[item.day_number].push(item);
        return acc;
    }, {} as Record<number, ItineraryItem[]>);
};

export const getDateForDay = (dayNumber: number, itinerary: Itinerary | null) => {
    if (!itinerary) return '';
    const startDate = new Date(itinerary.start_date);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayNumber - 1);
    return targetDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};