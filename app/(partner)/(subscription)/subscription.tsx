// app/(partner)/subscription.tsx
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import API_URL from '../../../constants/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Subscription {
    subscription_id: number;
    plan_id: number;
    plan_name?: string;
    plan_code?: string;
    status: string;
    started_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    ended_at: string | null;
}

interface RegistrationPayment {
    registration_payment_id: number;
    status: string;
    amount_php: number;
    gcash_reference: string | null;
    proof_url: string | null;
    paid_at: string | null;
    created_at: string;
}

interface SubscriptionPayment {
    subscription_payment_id: number;
    status: string;
    amount_php: number;
    gcash_reference: string | null;
    proof_url: string | null;
    paid_at: string | null;
    created_at: string;
}

const SubscriptionScreen: React.FC = () => {
    const router = useRouter();
    const { user, token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [latestRegPayment, setLatestRegPayment] = useState<RegistrationPayment | null>(null);
    const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([]);

    // Pricing based on partner class (you can fetch this from backend if needed)
    const PRICING = useMemo(() => ({
        registrationFee: 1299, // or 799 for individual
        includesFreeDays: 30,
        basicMonthly: 599,
        proMonthly: 999,
    }), []);

    const fetchSubscription = async () => {
        if (!user?.user_id) return;

        try {
            const response = await axios.get(
                `${API_URL}/subscription/partner/${user.user_id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setSubscription(response.data?.subscription || null);
            setLatestRegPayment(response.data?.latest_registration_payment || null);
            setSubscriptionPayments(response.data?.subscription_payments || []);
        } catch (error) {
            console.error('Error fetching subscription:', error);
            toast.error('Failed to load subscription details');
            setSubscription(null);
            setLatestRegPayment(null);
            setSubscriptionPayments([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchSubscription();
        setLoading(false);
    };

    useEffect(() => {
        if (user?.user_id) loadData();
    }, [user?.user_id]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSubscription();
        setRefreshing(false);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Status pill component
    const StatusPill = ({ status, type }: { status: string; type: 'subscription' | 'payment' }) => {
        const s = (status || '').toLowerCase();

        let config = {
            bg: 'bg-gray-100',
            text: 'text-gray-600',
            border: 'border-gray-200',
            label: status || 'Unknown',
            icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap,
            iconColor: '#6B7280',
        };

        if (type === 'subscription') {
            if (s === 'active') {
                config = {
                    bg: 'bg-green-50',
                    text: 'text-green-700',
                    border: 'border-green-200',
                    label: 'Active',
                    icon: 'checkmark-circle',
                    iconColor: '#059669',
                };
            } else if (s === 'trialing' || s === 'trial') {
                config = {
                    bg: 'bg-blue-50',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    label: 'Trial',
                    icon: 'time',
                    iconColor: '#3B82F6',
                };
            } else if (s === 'expired' || s === 'inactive') {
                config = {
                    bg: 'bg-gray-50',
                    text: 'text-gray-700',
                    border: 'border-gray-200',
                    label: 'Expired',
                    icon: 'close-circle',
                    iconColor: '#6B7280',
                };
            } else if (s === 'canceled' || s === 'cancelled') {
                config = {
                    bg: 'bg-gray-50',
                    text: 'text-gray-700',
                    border: 'border-gray-200',
                    label: 'Canceled',
                    icon: 'close-circle',
                    iconColor: '#6B7280',
                };
            }
        } else {
            // Payment status
            if (s === 'paid') {
                config = {
                    bg: 'bg-green-50',
                    text: 'text-green-700',
                    border: 'border-green-200',
                    label: 'Paid',
                    icon: 'checkmark-circle',
                    iconColor: '#059669',
                };
            } else if (s === 'pending') {
                config = {
                    bg: 'bg-yellow-50',
                    text: 'text-yellow-700',
                    border: 'border-yellow-200',
                    label: 'Pending Review',
                    icon: 'time',
                    iconColor: '#D97706',
                };
            } else if (s === 'rejected') {
                config = {
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    label: 'Rejected',
                    icon: 'close-circle',
                    iconColor: '#DC2626',
                };
            }
        }

        return (
            <View className={`flex-row items-center px-3 py-1.5 rounded-full ${config.bg} border ${config.border}`}>
                <Ionicons name={config.icon} size={14} color={config.iconColor} />
                <Text className={`ml-1.5 text-xs font-onest-medium ${config.text}`}>
                    {config.label}
                </Text>
            </View>
        );
    };

    // Registration banner message
    const registrationBanner = useMemo(() => {
        if (!latestRegPayment) {
            return {
                show: true,
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                icon: 'alert-circle',
                iconColor: '#D97706',
                title: 'Registration payment required',
                message: 'Complete the one-time registration fee to activate your 1 month basic plan.',
            };
        }

        const s = (latestRegPayment.status || '').toLowerCase();

        if (s === 'pending') {
            return {
                show: true,
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                icon: 'time',
                iconColor: '#D97706',
                title: 'Registration payment submitted',
                message: 'Awaiting admin approval.',
            };
        }

        if (s === 'paid') {
            return {
                show: true,
                bg: 'bg-green-50',
                border: 'border-green-200',
                icon: 'checkmark-circle',
                iconColor: '#059669',
                title: 'Registration approved',
                message: `Your ${PRICING.includesFreeDays}-day basic plan is active.`,
            };
        }

        if (s === 'rejected') {
            return {
                show: true,
                bg: 'bg-red-50',
                border: 'border-red-200',
                icon: 'close-circle',
                iconColor: '#DC2626',
                title: 'Registration payment rejected',
                message: 'Please upload a new payment proof.',
            };
        }

        return { show: false };
    }, [latestRegPayment, PRICING.includesFreeDays]);

    const planLabel = useMemo(() => {
        if (!subscription?.plan_id) return 'Not set';
        if (subscription.plan_name) return subscription.plan_name;
        if (subscription.plan_code) return subscription.plan_code;
        return `Plan #${subscription.plan_id}`;
    }, [subscription]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-black/50 font-onest">Loading subscription...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#1f2937']}
                        tintColor="#1f2937"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="px-6 pt-4 pb-2">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <Pressable
                                onPress={() => router.back()}
                                className="mr-3 p-2 -ml-2 rounded-full"
                            >
                                <Ionicons name="arrow-back" size={24} color="#1f2937" />
                            </Pressable>
                            <View>
                                <Text className="text-2xl font-onest-semibold text-black/90">
                                    Subscription
                                </Text>
                                <Text className="text-sm font-onest text-black/50 mt-0.5">
                                    Manage your plan and payments
                                </Text>
                            </View>
                        </View>


                    </View>
                </View>

                {/* Registration Banner */}
                {registrationBanner?.show && (
                    <View className="px-6 mt-4">
                        <View
                            className={`p-4 rounded-xl border ${registrationBanner.bg} ${registrationBanner.border}`}
                        >
                            <View className="flex-row items-start">
                                <Ionicons
                                    name={registrationBanner.icon as any}
                                    size={20}
                                    color={registrationBanner.iconColor}
                                />
                                <View className="ml-3 flex-1">
                                    <Text className="text-sm font-onest-semibold text-black/80">
                                        {registrationBanner.title}
                                    </Text>
                                    <Text className="text-sm font-onest text-black/60 mt-0.5">
                                        {registrationBanner.message}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Current Plan Card */}
                <View className="px-6 mt-6">
                    <Text className="text-lg font-onest-semibold text-black/90 mb-3">
                        Current Plan
                    </Text>

                    <View
                        className="p-5 rounded-2xl "
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                        }}
                    >
                        {/* Plan Header */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-xl capitalize font-onest-semibold text-black/90">
                                    {planLabel} plan
                                </Text>
                            </View>
                            <StatusPill status={subscription?.status || ''} type="subscription" />
                        </View>

                        {/* Plan Details */}
                        <View className="mt-5 space-y-3">
                            <View className="flex-row justify-between">
                                <Text className="text-sm font-onest text-black/50">Started</Text>
                                <Text className="text-sm font-onest-medium text-black/80">
                                    {formatDate(subscription?.started_at)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between">
                                <Text className="text-sm font-onest text-black/50">Current period start</Text>
                                <Text className="text-sm font-onest-medium text-black/80">
                                    {formatDate(subscription?.current_period_start)}
                                </Text>
                            </View>

                            <View className="flex-row justify-between">
                                <Text className="text-sm font-onest text-black/50">Current period end</Text>
                                <Text className="text-sm font-onest-medium text-black/80">
                                    {formatDate(subscription?.current_period_end)}
                                </Text>
                            </View>

                            {subscription?.ended_at && (
                                <View className="flex-row justify-between">
                                    <Text className="text-sm font-onest text-black/50">Ended at</Text>
                                    <Text className="text-sm font-onest-medium text-black/80">
                                        {formatDate(subscription.ended_at)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* View Plans Link */}
                        <Pressable
                            onPress={() => router.push('/(partner)/(subscription)/plans')}
                            className="mt-5 flex-row items-center"
                        >
                            <Text className="text-sm font-onest text-primary">
                                See available plans
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#4F46E5" />
                        </Pressable>
                    </View>
                </View>

                {/* Billing History */}
                <View className="px-6 mt-24">
                    <Text className="text-lg font-onest-semibold text-black/90 mb-3">
                        Billing History
                    </Text>

                    {subscriptionPayments.length === 0 ? (
                        <View
                            className="p-6 rounded-2xl  items-center"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.04,
                                shadowRadius: 8,
                                elevation: 2,
                            }}
                        >
                            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
                            <Text className="mt-3 text-sm font-onest text-black/50">
                                No payments yet
                            </Text>
                        </View>
                    ) : (
                        <View className="space-y-3">
                            {subscriptionPayments.map((payment) => (
                                <View
                                    key={payment.subscription_payment_id}
                                    className="p-4 rounded-2xl "
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.04,
                                        shadowRadius: 8,
                                        elevation: 2,
                                    }}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1">
                                            <Text className="text-sm font-onest-medium text-black/80">
                                                Subscription payment
                                            </Text>
                                            <Text className="text-xs font-onest text-black/50 mt-1">
                                                {payment.paid_at
                                                    ? `Paid: ${formatDate(payment.paid_at)}`
                                                    : payment.created_at
                                                        ? `Created: ${formatDate(payment.created_at)}`
                                                        : '—'}
                                            </Text>
                                            {payment.gcash_reference && (
                                                <Text className="text-xs font-onest text-black/50 mt-0.5">
                                                    Ref: {payment.gcash_reference}
                                                </Text>
                                            )}
                                        </View>

                                        <View className="items-end">
                                            <Text className="text-base font-onest-semibold text-black/90">
                                                ₱{Number(payment.amount_php || 0).toFixed(2)}
                                            </Text>
                                            <View className="mt-1">
                                                <StatusPill status={payment.status} type="payment" />
                                            </View>
                                        </View>
                                    </View>

                                    {payment.proof_url && (
                                        <Pressable
                                            onPress={() => {
                                                // Open proof URL - you might want to use Linking or a modal
                                                toast.info('Opening proof...');
                                            }}
                                            className="mt-3 flex-row items-center justify-center py-2 rounded-lg"
                                        >
                                            <Ionicons name="document-outline" size={16} color="#6B7280" />
                                            <Text className="ml-2 text-xs font-onest text-black/60">
                                                View Proof
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Pricing Info */}
                <View className="px-6 mt-6">
                    <View className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                            <View className="ml-3 flex-1">
                                <Text className="text-sm font-onest-semibold text-blue-800">
                                    Subscription Plans
                                </Text>
                                <Text className="text-sm font-onest text-blue-700 mt-1">
                                    After your 1 month basic plan: Basic ₱{PRICING.basicMonthly}/month or Pro ₱{PRICING.proMonthly}/month
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SubscriptionScreen;