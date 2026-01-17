// utils/itinerary-utils.ts

import { Itinerary, ItineraryItem } from "@/types/itineraryDetails";

// Date & Time Formatting
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
    });
};

export const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Day Calculations
export const getDayRange = (itinerary: Itinerary): number => {
    const start = new Date(itinerary.start_date);
    const end = new Date(itinerary.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
};

export const getDateForDay = (itinerary: Itinerary, dayNumber: number): string => {
    const startDate = new Date(itinerary.start_date);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayNumber - 1);
    return targetDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
};

export const getCurrentDay = (itinerary: Itinerary): number => {
    const today = new Date();
    const startDate = new Date(itinerary.start_date);
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const timeDiff = today.getTime() - startDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    return Math.max(1, dayDiff);
};

// Grouping
export const groupItemsByDay = (
    items: ItineraryItem[]
): Record<number, ItineraryItem[]> => {
    return items.reduce((acc, item) => {
        if (!acc[item.day_number]) {
            acc[item.day_number] = [];
        }
        acc[item.day_number].push(item);
        return acc;
    }, {} as Record<number, ItineraryItem[]>);
};

// Travel Time Estimation
export const estimateTravelTime = (
    item1: ItineraryItem,
    item2: ItineraryItem
): number | null => {
    if (
        !item1.destination_latitude ||
        !item1.destination_longitude ||
        !item2.destination_latitude ||
        !item2.destination_longitude
    ) {
        return null;
    }

    const R = 6371;
    const dLat =
        ((item2.destination_latitude - item1.destination_latitude) * Math.PI) / 180;
    const dLon =
        ((item2.destination_longitude - item1.destination_longitude) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((item1.destination_latitude * Math.PI) / 180) *
        Math.cos((item2.destination_latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const timeInHours = distance / 30;
    return Math.round(timeInHours * 60);
};

export const hasEnoughTimeBetween = (
    item1: ItineraryItem,
    item2: ItineraryItem
): { hasTime: boolean; message: string } => {
    const travelTime = estimateTravelTime(item1, item2);
    if (!travelTime) return { hasTime: true, message: "" };

    const end1 = new Date(`2000-01-01T${item1.end_time}`);
    const start2 = new Date(`2000-01-01T${item2.start_time}`);
    const gapMinutes = (start2.getTime() - end1.getTime()) / (1000 * 60);

    if (gapMinutes < travelTime) {
        return {
            hasTime: false,
            message: ` Only ${Math.round(gapMinutes)} min gap, ~${travelTime} min travel time`,
        };
    }

    return { hasTime: true, message: `~${travelTime} min travel` };
};

// Image URI
export const getImageUri = (imagePath: string, apiUrl: string): string => {
    if (imagePath.startsWith("http")) {
        return imagePath;
    }
    return `${apiUrl}${imagePath}`;
};