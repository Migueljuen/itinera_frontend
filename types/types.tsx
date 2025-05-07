// types.ts

export interface AvailabilitySlot {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

export interface ExperienceFormData {
    title: string;
    description: string;
    price: string;
    unit: string;
    availability: AvailabilitySlot[];
    tags: number[];
    useExistingDestination: boolean;
    destination_id: number | null;
    destination_name: string;
    city: string;
    destination_description: string;
    latitude: string;
    longitude: string;
    images: any[]; // You can replace 'any' with a more specific image type
}
