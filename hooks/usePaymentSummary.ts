// hooks/usePaymentSummary.ts

import { PaymentData, PaymentSummary } from '@/types/paymentTypes';
import { useMemo } from 'react';

export function usePaymentSummary(
    payment: PaymentData | undefined
): PaymentSummary | null {
    return useMemo(() => {
        if (!payment) return null;

        const activityPayments = payment.activity_payments || [];

        // -----------------------------
        // Status handling (SOURCE OF TRUTH)
        // -----------------------------
        const rawStatus =
            payment.payment_status ?? payment.display_status ?? '';

        const status = String(rawStatus).toLowerCase();

        const isPaid = status === 'paid';
        const isFailed = status === 'failed';

        const isPendingVerification =
            status === 'pending' ||
            status === 'for_verification' ||
            status === 'verification' ||
            status === 'submitted';

        // -----------------------------
        // Amount calculations
        // -----------------------------
        const totalAmount = Number(payment.total_amount) || 0;

        // Treat amount_paid as VERIFIED money only
        const verifiedAmountPaid = isPendingVerification
            ? 0
            : Number(payment.amount_paid) || 0;

        const verifiedCashCollected = isPendingVerification
            ? 0
            : Number(payment.total_creator_cash_collected) || 0;

        const totalPaid = verifiedAmountPaid + verifiedCashCollected;

        // Remaining balance should NOT be zero while pending
        const remainingBalance = Math.max(
            0,
            totalAmount - totalPaid
        );

        const progressPercentage =
            totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

        // -----------------------------
        // Activity payment progress
        // -----------------------------
        const paidCount =
            payment.paid_activities_count ??
            activityPayments.filter((ap) => ap.is_fully_paid).length;

        const totalCount =
            payment.total_activities_count ?? activityPayments.length;

        return {
            isPaid,
            isFailed,
            isPendingVerification, // 🔹 optional but useful for UI

            totalAmount,
            amountPaid: verifiedAmountPaid,
            totalCashCollected: verifiedCashCollected,
            totalPaid,
            remainingBalance,
            progressPercentage,

            paidCount,
            totalCount,
        } as PaymentSummary;
    }, [payment]);
}
