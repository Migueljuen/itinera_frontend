// types.ts

export interface AvailabilitySlot {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

export interface ImageInfo {
    uri: string;
    name?: string;
    type?: string;
    size?: number;
}


export interface ExperienceFormData {
    title: string;
    description: string;
    price: string;
    unit: string;
    availability: {
        day_of_week: string;
        start_time: string;
        end_time: string;
    }[];
    tags: number[];  // Tag IDs
    useExistingDestination: boolean;
    destination_id: number | null;
    destination_name: string;
    city: string;
    destination_description: string;
    latitude: string;
    longitude: string;
    images: (string | ImageInfo)[];// This will store local URIs initially, then server URLs after upload
    status?: string;   // Optional status field: 'draft', 'inactive', 'active'
}