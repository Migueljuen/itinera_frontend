//types/itineraryTypes.tsx
import {
  ActivityIntensity,
  Budget,
  Experience,
  ExploreTime,
  TravelCompanion,
  TravelDistance,
} from "@/types/experienceTypes";

export interface GuestBreakdown {
  adult: number;
  child: number;
  infant: number;
}

/** ✅ NEW: saved/generated "Places to eat" suggestion */
export interface FoodSuggestion {
  experience_id: number;

  experience_name?: string;
  title?: string;
  experience_description?: string;
  description?: string;
  experience_notes?: string;
  notes?: string;

  destination_name?: string;
  destination_city?: string;

  images?: string[];
  primary_image?: string | null;

  price?: number | null;
  price_estimate?: string | null;
  unit?: string | null;

  near_experience_name?: string | null;
  near_experience_id?: number | null;

  // optional if you later add distance/km
  latitude?: number | null;
  longitude?: number | null;
  near_latitude?: number | null;
  near_longitude?: number | null;

  sort_order?: number | null;
}

export interface ItineraryFormData {
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes?: string;
  city: string;
  items: ItineraryItem[];

  /** ✅ NEW: snapshot list to persist on save */
  foodSuggestions?: FoodSuggestion[];

  preferences?: {
    experiences: Experience[];
    travelerCount: number;
    guestBreakdown?: GuestBreakdown;
    travelCompanion?: TravelCompanion;
    travelCompanions?: TravelCompanion[];
    exploreTime?: ExploreTime;
    budget?: Budget;
    activityIntensity?: ActivityIntensity;
    travelDistance?: TravelDistance;
    includeFoodInItinerary?: boolean;
    includeFoodSuggestions?: boolean;
  };

  services?: {
    tour_guide_id?: number;
    car_service_id?: number;
  };
}

export interface ItineraryItem {
  experience_id: number;
  day_number: number;
  start_time: string;
  end_time: string;
  custom_note?: string;
  experience_notes?: string;
  experience_name?: string;
  experience_description?: string;
  destination_name?: string;
  destination_city?: string;
  images?: string[];
  primary_image?: string;
  price?: number;
  price_estimate?: string;
  unit?: string;
}

export interface GeneratedItinerary {
  itinerary_id: number;
  traveler_id: number;
  start_date: string;
  end_date: string;
  title: string;
  notes: string;
  created_at: string;
  status: string;
  travel_companions?: TravelCompanion[];
  items: ItineraryItem[];

  food_suggestions?: FoodSuggestion[];

}
