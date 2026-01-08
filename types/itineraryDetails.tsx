// types/itineraryDetails.ts
// 🔥 UPDATED PaymentInfo interface with new fields

export interface PaymentInfo {
    payment_id: number;
    itinerary_id: number;
    total_amount: number;
    amount_paid: number;
    payment_status: "Unpaid" | "Partial" | "Paid" | "Pending" | "Failed";
    created_at: string;
    updated_at: string;
    creator_cash_due?: number;
    creator_cash_collected?: boolean;
    creator_cash_collected_at?: string;
    actual_remaining_balance?: number;
    is_payment_complete?: boolean;
    display_status?: "Unpaid" | "Partial" | "Paid" | "Pending";
    all_cash_collected?: boolean;
    show_pay_button?: boolean;
    payment_complete_message?: string;
}

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