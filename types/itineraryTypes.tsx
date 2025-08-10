export interface ItineraryFormData {
    traveler_id: number;
    start_date: string;  // Format: 'YYYY-MM-DD'
    end_date: string;    // Format: 'YYYY-MM-DD'
    title: string;
    notes?: string;
    accommodation_id?: number;
    itinerary_id?: number;
    city: string;
    items: ItineraryItem[];
    exploreTime: string;
    experiences: number[];
}

// export interface ItineraryItem {
//     experience_id: number;
//     day_number: number;         // Must be between 1 and total number of days in the itinerary
//     start_time: string;         // Format: 'HH:mm'
//     end_time: string;           // Format: 'HH:mm'
//     custom_note?: string;
// }

export interface ItineraryItem {
    item_id: number;
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string;
    created_at: string;
    updated_at: string;
    experience_name: string;
    experience_description: string;
    destination_name: string;
    destination_city: string;
    images: string[];
    primary_image: string;
}

export interface Itinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    items: ItineraryItem[];
}

export interface TimeSlot {
    slot_id: number;
    availability_id: number;
    start_time: string;
    end_time: string;
}

export interface AvailableTimeSlot extends TimeSlot {
    is_available: boolean;
    conflicting_items?: ItineraryItem[];
}
