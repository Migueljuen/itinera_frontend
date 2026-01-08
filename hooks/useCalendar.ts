// hooks/useCalendar.ts

import { Itinerary } from "@/types/itineraryDetails";
import * as Calendar from "expo-calendar";
import { Alert } from "react-native";

export const useCalendarIntegration = () => {
    const requestCalendarPermission = async (): Promise<boolean> => {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Calendar access is needed to add events.");
            return false;
        }
        return true;
    };

    const getDefaultCalendarId = async (): Promise<string | null> => {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find((cal) => cal.allowsModifications);
        return defaultCalendar?.id || null;
    };

    const addItineraryToCalendar = async (itinerary: Itinerary) => {
        const hasPermission = await requestCalendarPermission();
        if (!hasPermission) return;

        const calendarId = await getDefaultCalendarId();
        if (!calendarId) {
            Alert.alert("No calendar", "No editable calendar found.");
            return;
        }

        try {
            for (const item of itinerary.items) {
                if (!item.start_time || !item.end_time) continue;

                const startDate = new Date(`${itinerary.start_date}T${item.start_time}`);
                const endDate = new Date(`${itinerary.start_date}T${item.end_time}`);

                startDate.setDate(startDate.getDate() + (item.day_number - 1));
                endDate.setDate(endDate.getDate() + (item.day_number - 1));

                await Calendar.createEventAsync(calendarId, {
                    title: item.experience_name,
                    location: `${item.destination_name}, ${item.destination_city}`,
                    notes: item.custom_note || item.experience_description,
                    startDate,
                    endDate,
                    timeZone: "GMT+8",
                    alarms: [{ relativeOffset: -15 }],
                });
            }

            Alert.alert("Success", "Itinerary added to your calendar!");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to add itinerary to calendar");
        }
    };

    return { addItineraryToCalendar };
};