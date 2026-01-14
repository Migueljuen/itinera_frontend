// hooks/usePaymentSummary.ts

import { PaymentData, PaymentSummary } from '@/types/paymentTypes';
import { useMemo } from 'react';

export function usePaymentSummary(payment: PaymentData | undefined): PaymentSummary | null {
    return useMemo(() => {
        if (!payment) return null;

        const activityPayments = payment.activity_payments || [];
        const isFailed = payment.display_status === 'Failed';
        const isPaid = payment.is_payment_complete === true;

        const totalAmount = Number(payment.total_amount) || 0;
        const amountPaid = Number(payment.amount_paid) || 0;
        const totalCashCollected = Number(payment.total_creator_cash_collected) || 0;
        const totalPaid = amountPaid + totalCashCollected;
        const remainingBalance =
            Number(payment.actual_remaining_balance) || Math.max(0, totalAmount - totalPaid);

        const progressPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

        const paidCount =
            payment.paid_activities_count ||
            activityPayments.filter((ap) => ap.is_fully_paid).length;
        const totalCount = payment.total_activities_count || activityPayments.length;

        return {
            isPaid,
            isFailed,
            totalAmount,
            amountPaid,
            totalCashCollected,
            totalPaid,
            remainingBalance,
            progressPercentage,
            paidCount,
            totalCount,
        };
    }, [payment]);
}