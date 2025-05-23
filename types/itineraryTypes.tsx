export interface ItineraryFormData {
    traveler_id: number;
    start_date: string;  // Format: 'YYYY-MM-DD'
    end_date: string;    // Format: 'YYYY-MM-DD'
    title: string;
    notes?: string;
    city: string;
    items: ItineraryItem[];
    exploreTime: string;
    experiences: number[];
}

export interface ItineraryItem {
    experience_id: number;
    day_number: number;         // Must be between 1 and total number of days in the itinerary
    start_time: string;         // Format: 'HH:mm'
    end_time: string;           // Format: 'HH:mm'
    custom_note?: string;
}
