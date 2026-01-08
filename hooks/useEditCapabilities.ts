// hooks/useEditCapabilities.ts

import { EditCapabilities, Itinerary } from "@/types/itineraryDetails";
import { getCurrentDay, getDayRange } from "../utils/itinerary-utils";

export const useEditCapabilities = (itinerary: Itinerary | null) => {
    const areAllDayActivitiesPast = (dayNumber: number): boolean => {
        if (!itinerary) return false;

        const dayItems = itinerary.items.filter((item) => item.day_number === dayNumber);
        if (dayItems.length === 0) return true;

        const now = new Date();
        const startDate = new Date(itinerary.start_date);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNumber - 1);

        return dayItems.every((item) => {
            const itemEndDateTime = new Date(dayDate);
            const [hours, minutes] = item.end_time.split(":").map(Number);
            itemEndDateTime.setHours(hours, minutes, 0, 0);
            return now > itemEndDateTime;
        });
    };

    const getEditCapabilities = (): EditCapabilities => {
        if (!itinerary) return { canEdit: false, editType: "none" };

        switch (itinerary.status) {
            case "upcoming":
                return { canEdit: true, editType: "full", message: "Edit your upcoming trip" };

            case "ongoing": {
                const currentDay = getCurrentDay(itinerary);
                const totalDays = getDayRange(itinerary);
                const todayActivitiesComplete = areAllDayActivitiesPast(currentDay);
                const firstEditableDay = todayActivitiesComplete ? currentDay + 1 : currentDay;

                if (firstEditableDay > totalDays) {
                    return {
                        canEdit: false,
                        editType: "all_activities_complete",
                        message: "All activities have been completed",
                    };
                }

                return {
                    canEdit: true,
                    editType: "current_and_future",
                    message: todayActivitiesComplete
                        ? `Edit future days only (Day ${firstEditableDay}+)`
                        : `Edit today and future days (Day ${currentDay}+)`,
                    currentDay,
                    firstEditableDay,
                    todayComplete: todayActivitiesComplete,
                    editableDays: Array.from(
                        { length: totalDays - firstEditableDay + 1 },
                        (_, i) => firstEditableDay + i
                    ),
                };
            }

            case "completed":
                return { canEdit: false, editType: "completed", message: "Completed trips cannot be edited" };

            default:
                return { canEdit: false, editType: "none" };
        }
    };

    const getDayHeaderStyle = (dayNumber: number) => {
        const capabilities = getEditCapabilities();

        if (capabilities.editType === "current_and_future") {
            const isEditable = capabilities.editableDays?.includes(dayNumber);
            const isPast = dayNumber < capabilities.currentDay!;
            const isCurrent = dayNumber === capabilities.currentDay!;
            const isCurrentButComplete = isCurrent && capabilities.todayComplete;

            if (isPast || isCurrentButComplete) {
                return { container: "bg-gray-50 border-l-4 border-gray-300", text: "text-gray-500", indicator: "✓ Completed" };
            } else if (isCurrent && !isCurrentButComplete) {
                return { container: "bg-blue-50 border-l-4 border-blue-400", text: "text-blue-700", indicator: "📍 Today - Editable" };
            } else if (isEditable) {
                return { container: "bg-white border-l-4 border-green-400", text: "text-gray-800", indicator: "✏️ Editable" };
            }
        }

        return { container: "bg-white", text: "text-gray-800", indicator: "" };
    };

    return { getEditCapabilities, getDayHeaderStyle, areAllDayActivitiesPast };
};