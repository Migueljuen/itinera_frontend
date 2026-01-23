// types/payment.ts

export interface ActivityPayment {
    booking_id: number;
    item_id: number;
    experience_id: number;
    service_type: string;
    activity_name: string;
    creator_id: number;
    creator_name: string;
    activity_price: number;
    platform_commission_rate: number;
    platform_commission_amount: number;
    creator_payout_amount: number;
    creator_prepaid_amount: number;
    activity_paid_online: number;
    creator_cash_due: number;
    creator_cash_collected: boolean;
    creator_cash_collected_at: string | null;
    booking_status: string;
    booking_payment_status: string;
    is_fully_paid: boolean;
    remaining_cash_due: number;
}

export interface PaymentData {
    payment_id: number;
    itinerary_id: number;
    total_amount: number;
    amount_paid: number;
    payment_status: string;
    total_creator_cash_due?: number;
    total_creator_cash_collected?: number;
    all_cash_collected?: boolean;
    actual_remaining_balance?: number;
    is_payment_complete?: boolean;
    display_status?: string;
    activity_payments?: ActivityPayment[];
    paid_activities_count?: number;
    total_activities_count?: number;
    show_pay_button?: boolean;
    payment_complete_message?: string;
    created_at: string;
    updated_at: string;
}

// Computed payment info for UI
export interface PaymentSummary {
    isPaid: boolean;
    isFailed: boolean;
    totalAmount: number;
    amountPaid: number;
    totalCashCollected: number;
    totalPaid: number;
    remainingBalance: number;
    progressPercentage: number;
    paidCount: number;
    totalCount: number;
}

// Refund types
export interface Refund {
    refund_id: number;
    booking_id: number;
    itinerary_id: number;
    traveler_id: number;
    activity_price: number;
    payment_status_at_cancel: 'Unpaid' | 'Partial' | 'Paid';
    refund_amount: number;
    gcash_number: string | null;
    gcash_name: string | null;
    cancellation_reason: string | null;
    admin_notes: string | null;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    requested_at: string;
    processed_at: string | null;
    completed_at: string | null;
    processed_by: number | null;
    // Joined fields from queries
    experience_name?: string;
    itinerary_title?: string;
}

// Refund summary for UI
export interface RefundSummary {
    totalRefunds: number;
    pendingCount: number;
    completedCount: number;
    totalPendingAmount: number;
    totalRefundedAmount: number;
}