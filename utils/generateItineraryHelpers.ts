import { ItineraryItem } from "@/types/itineraryTypes";

// Utility functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const groupItemsByDay = (items: ItineraryItem[]) => {
  return items.reduce((acc, item) => {
    if (!acc[item.day_number]) acc[item.day_number] = [];
    acc[item.day_number].push(item);
    return acc;
  }, {} as { [key: number]: ItineraryItem[] });
};
