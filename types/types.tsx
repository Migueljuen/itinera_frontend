
export interface ImageInfo {
    uri: string;
    name?: string;
    type?: string;
    size?: number;
}


export interface TimeSlot {
    slot_id?: number;
    availability_id?: number;
    start_time: string;
    end_time: string;
}

export interface AvailabilityDay {
    availability_id?: number;
    experience_id?: number;
    day_of_week: string;
    time_slots: TimeSlot[];
}

export interface ExperienceFormData {
    title: string;
    description: string;
    price: string;
    unit: string;
    availability: AvailabilityDay[];
    tags: number[];
    travel_companion: 'Solo' | 'Partner' | 'Family' | 'Friends' | 'Group' | 'Any' | '';
    useExistingDestination: boolean;
    destination_id: number | null;
    destination_name: string;
    city: string;
    destination_description: string;
    latitude: string;
    longitude: string;
    images: (string | ImageInfo)[];// This will store local URIs initially, then server URLs after upload
    status?: string;
}