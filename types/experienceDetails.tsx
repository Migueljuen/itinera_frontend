export type Creator = {
    user_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    profile_pic: string | null;
    role?: 'Traveler' | 'Creator' | 'Guide' | 'Driver' | 'Admin';
};

export type ExperienceStep = {
    step_id: number;
    experience_id: number;
    step_order: number;
    title: string;
    description: string;
    created_at: string;
};
export type Inclusions = {
    inclusion_id: number;
    experience_id: number;
    inclusion_order: number;
    title: string;
    created_at: string;
};

export type ExperienceImage = {
    image_id: number;
    image_url: string;
    experience_id: number;
};

export type Destination = {
    destination_id: number;
    name: string;
    city: string;
    longitude: number;
    latitude: number;
    description: string;
};

export type Experience = {
    id: number;
    title: string;
    description: string;
    notes: string;
    price: string;
    price_estimate: string;
    unit: string;
    destination_name: string;
    location: string;
    tags: string[];
    images: ExperienceImage[];
    steps?: ExperienceStep[];
    inclusions?: Inclusions[];
    is_saved?: boolean;
    destination: Destination;
    creator: Creator;
};

export type Review = {
    id: number;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    date: string;
    helpful: number;
};