// types/bookingPayment.ts

// types/bookingPayment.ts

export interface BookingPayment {
    booking_id: number;
    itinerary_id: number;
    item_id: number;
    experience_id: number;

    // ✅ ADD THIS
    experience_category_id: number;

    service_type: 'experience' | 'guide' | 'driver';
    service_id: number;
    creator_id: number;
    activity_price: number;

    payment_status: 'Unpaid' | 'Pending' | 'Paid';
    payment_proof: string | null;
    payment_submitted_at: string | null;
    payment_verified_at: string | null;
    payment_rejected_at: string | null;
    payment_reject_reason: string | null;

    status:
    | 'Pending'
    | 'Confirmed'
    | 'CancellationRequested'
    | 'Cancelled'
    | 'Completed'
    | 'Ongoing';

    booking_date: string;
    experience_name: string;
    creator_name?: string;

    created_at: string;
    updated_at: string;
}


export interface ItineraryPaymentSummary {
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    progressPercentage: number;
    paidCount: number;
    pendingCount: number;
    unpaidCount: number;
    totalCount: number;
    isFullyPaid: boolean;
    hasPending: boolean;
}

export interface ItineraryPaymentData {
    itinerary_id: number;
    bookings: BookingPayment[];
    summary: ItineraryPaymentSummary;
}