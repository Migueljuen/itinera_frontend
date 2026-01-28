// types/itineraryDetails.ts

export interface ActivityPayment {
    booking_id: number;
    item_id: number;
    experience_id: number;
    service_type: string;
    activity_name: string;
    creator_id: number;
    creator_name: string;

    // Pricing breakdown
    activity_price: number;
    platform_commission_rate: number;
    platform_commission_amount: number;
    creator_payout_amount: number;

    // Payment breakdown
    creator_prepaid_amount: number;
    activity_paid_online: number;
    creator_cash_due: number;
    creator_cash_collected: boolean;
    creator_cash_collected_at: string | null;

    // Status
    booking_status: string;
    booking_payment_status: string;
    is_fully_paid: boolean;
    remaining_cash_due: number;
}

export interface PaymentInfo {
    payment_id: number;
    itinerary_id: number;
    total_amount: number;
    amount_paid: number;
    payment_status: "Unpaid" | "Partial" | "Paid" | "Pending" | "Failed";
    created_at: string;
    updated_at: string;

    // Aggregated cash info
    total_creator_cash_due?: number;
    total_creator_cash_collected?: number;
    all_cash_collected?: boolean;

    // Computed fields
    actual_remaining_balance?: number;
    is_payment_complete?: boolean;
    display_status?: "Unpaid" | "Partial" | "Paid" | "Pending" | "Failed";

    // Activity breakdown
    activity_payments?: ActivityPayment[];
    paid_activities_count?: number;
    total_activities_count?: number;

    // UI helper flags
    show_pay_button?: boolean;
    payment_complete_message?: string;
}

/* ---------------- FOOD SUGGESTIONS ---------------- */

export interface ItineraryFoodSuggestion {
    // DB / snapshot fields
    experience_id: number;                 // the food spot experience_id
    near_experience_id: number | null;     // which generated activity it's near
    near_experience_name: string | null;   // snapshot text label
    sort_order: number;

    // Optional fields your UI may already render (safe to have if backend returns them)
    experience_name?: string;
    title?: string;
    experience_description?: string;
    description?: string;

    destination_name?: string;
    destination_city?: string;

    images?: string[];
    primary_image?: string | null;

    price?: number | null;
    price_estimate?: string | null;
    unit?: string | null;

    // Optional for "xx km away from xx" (if you return coords later)
    destination_latitude?: number | null;
    destination_longitude?: number | null;

    // Optional for precomputed distance (backend-calculated)
    distance_km?: number | null;
}

/* ---------------- MEETING POINTS ---------------- */

export interface MeetingPointRequested {
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
    requested_at: string | null;
}

export interface MeetingPointGuideResponse {
    type: "confirmed" | "suggested_alternative";
    suggested_name: string | null;
    suggested_address: string | null;
    suggested_latitude: number | null;
    suggested_longitude: number | null;
    instructions: string | null;
    responded_at: string | null;
}

export interface MeetingPoint {
    id: number;
    day_number: number;
    requested: MeetingPointRequested;
    guide_response: MeetingPointGuideResponse | null;
    traveler_accepted: boolean;
    traveler_responded_at: string | null;
    status: "pending" | "confirmed" | "negotiating";
}

/* ---------------- SERVICE ASSIGNMENTS ---------------- */

export interface ServiceProvider {
    provider_id: number;
    provider_profile_id: number;
    name: string;
    mobile_number: string | null;
    profile_pic: string | null;
    bio: string | null;
    years_of_experience: number | null;
    // Driver-specific fields
    vehicle_type?: string;
    vehicle_model?: string;
    vehicle_plate_number?: string;
}

export interface ServiceAssignment {
    assignment_id: number;
    service_type: "Guide" | "Driver";
    status: "Pending" | "Accepted" | "Declined" | "Expired" | "Cancelled";
    decline_reason:
    | "Scheduling conflict"
    | "Health reasons"
    | "Overlapping booking"
    | "Weather issues"
    | "Other"
    | null;
    price: number | null;
    responded_at: string | null;
    created_at: string;
    provider: ServiceProvider;
    meeting_points: MeetingPoint[];
    has_pending_meeting_points: boolean;
    all_meeting_points_confirmed: boolean;
}

/* ---------------- ITINERARY ITEMS ---------------- */

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
    destination_latitude?: number;
    destination_longitude?: number;
    images: string[];
    primary_image: string;
}

/* ---------------- ITINERARY ---------------- */

export interface Itinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: "pending" | "upcoming" | "ongoing" | "completed" | "cancelled";
    items: ItineraryItem[];
    payments: PaymentInfo[];
    service_assignments?: ServiceAssignment[];

    // ✅ NEW: persisted/snapshotted suggestions to display in Itinerary Details
    food_suggestions?: ItineraryFoodSuggestion[];
}

export interface EditCapabilities {
    canEdit: boolean;
    editType: string;
    message?: string;
    currentDay?: number;
    firstEditableDay?: number;
    todayComplete?: boolean;
    editableDays?: number[];
}
