// app/(partner)/(subscription)/plans.tsx
import API_URL from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
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

interface Plan {
    plan_id: number;
    code: string;
    name: string;
    tier: string;
    price: number;
    period: string;
    features: string[];
}

const SubscriptionPlansScreen: React.FC = () => {
    const router = useRouter();
    const { user, token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

    // Plans - update IDs to match your database
    const PLANS: Plan[] = useMemo(
        () => [
            {
                plan_id: 1,
                code: 'BUSINESS_BASIC',
                name: 'Business Basic',
                tier: 'basic',
                price: 599,
                period: 'month',
                features: [
                    'Receive booking requests',
                    'Chat support',
                ],
            },
            {
                plan_id: 2,
                code: 'BUSINESS_PRO',
                name: 'Business Pro',
                tier: 'pro',
                price: 999,
                period: 'month',
                features: [
                    'Everything in Basic',
                    'Promotional badge',
                    'Priority support',

                ],
            },
        ],
        []
    );

    const selectedPlan = useMemo(
        () => PLANS.find((p) => p.plan_id === selectedPlanId),
        [PLANS, selectedPlanId]
    );

    const fetchCurrentPlan = async () => {
        if (!user?.user_id) return;

        try {
            const response = await axios.get(
                `${API_URL}/subscription/partner/${user.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const sub = response.data?.subscription;
            if (sub?.plan_id) {
                setCurrentPlanId(sub.plan_id);
            }
        } catch (error) {
            console.error('Error fetching current plan:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchCurrentPlan();
        setLoading(false);
    };

    useEffect(() => {
        if (user?.user_id) loadData();
    }, [user?.user_id]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCurrentPlan();
        setRefreshing(false);
    };

    const handleSelectPlan = (planId: number) => {
        setSelectedPlanId(planId);
    };

    const handleContinueToPayment = () => {
        if (!selectedPlanId || !selectedPlan) {
            toast.error('Please select a plan');
            return;
        }

        router.push({
            pathname: '/(partner)/(subscription)/payment',
            params: {
                plan_id: String(selectedPlanId),
                plan_name: selectedPlan.name,
                plan_price: String(selectedPlan.price),
                is_renewal: String(selectedPlanId === currentPlanId),
            },
        });
    };

    const isCurrentPlan = (planId: number) => planId === currentPlanId;
    const isSelected = (planId: number) => planId === selectedPlanId;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-black/50 font-onest">Loading plans...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
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
                    <View className="flex-row items-center">
                        <Pressable
                            onPress={() => router.back()}
                            className="mr-3 p-2 -ml-2 rounded-full"
                        >
                            <Ionicons name="arrow-back" size={24} color="#1f2937" />
                        </Pressable>
                        <View>
                            <Text className="text-2xl font-onest-semibold text-black/90">
                                Select a Plan
                            </Text>
                            <Text className="text-sm font-onest text-black/50 mt-0.5">
                                Choose the plan you want to subscribe to
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Plans List */}
                <View className="px-6 mt-24 space-y-8 gap-2">
                    {PLANS.map((plan) => (
                        <Pressable
                            key={plan.plan_id}
                            onPress={() => handleSelectPlan(plan.plan_id)}
                            className={`relative rounded-2xl p-5 border ${isSelected(plan.plan_id)
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 bg-white'
                                }`}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.04,
                                shadowRadius: 8,
                                elevation: 2,
                            }}
                        >
                            {/* Current Plan Badge */}
                            {isCurrentPlan(plan.plan_id) && (
                                <View className="absolute -top-3 left-4 px-3 py-1 bg-primary rounded-full flex-row items-center">
                                    <Ionicons name="star" size={12} color="#fff" />
                                    <Text className="ml-1 text-xs font-onest-medium text-white">
                                        Current Plan
                                    </Text>
                                </View>
                            )}

                            {/* Selected Indicator */}
                            {isSelected(plan.plan_id) && (
                                <View className="absolute top-4 right-4">
                                    <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    </View>
                                </View>
                            )}

                            {/* Plan Header */}
                            <View className="flex-row items-center pr-8">
                                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                                    <Ionicons
                                        name={plan.tier === 'pro' ? 'diamond-outline' : 'cube-outline'}
                                        size={20}
                                        color="#374151"
                                    />
                                </View>
                                <View>
                                    <Text className="text-lg font-onest-semibold text-black/90">
                                        {plan.name}
                                    </Text>
                                    <Text className="text-sm font-onest text-black/60">
                                        ₱{plan.price.toLocaleString()}/{plan.period}
                                    </Text>
                                </View>
                            </View>

                            {/* Features */}
                            <View className="mt-4 space-y-2">
                                {plan.features.map((feature, index) => (
                                    <View key={index} className="flex-row items-center">
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={16}
                                            color={isSelected(plan.plan_id) ? '#274b46' : '#9CA3AF'}
                                        />
                                        <Text className="ml-2 text-sm font-onest text-black/70">
                                            {feature}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Renewal/Change Indicator */}
                            {isSelected(plan.plan_id) && (
                                <View className="mt-4 pt-4 border-t border-gray-100">
                                    {isCurrentPlan(plan.plan_id) ? (
                                        <View className="flex-row items-center">
                                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                                            <Text className="ml-1.5 text-xs font-onest text-green-600">
                                                Renewing this plan will extend your current period
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="flex-row items-center">
                                            <Ionicons name="alert-circle" size={14} color="#D97706" />
                                            <Text className="ml-1.5 text-xs font-onest text-amber-600">
                                                Changing plans will reset your billing period
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </Pressable>
                    ))}
                </View>

                {/* Info Note */}
                <View className="px-6 mt-6">
                    <View className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                        <View className="flex-row items-start">
                            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
                            <Text className="ml-3 flex-1 text-xs font-onest text-blue-700">
                                After selecting a plan, you'll be directed to upload your payment
                                proof. Payments are reviewed by admin and your subscription will be
                                activated upon approval.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 8,
                }}
            >
                <SafeAreaView edges={['bottom']}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            {selectedPlan ? (
                                <View>
                                    <Text className="text-xs font-onest text-black/50">Selected</Text>
                                    <Text className="text-sm font-onest-semibold text-black/90">
                                        {selectedPlan.name} — ₱{selectedPlan.price.toLocaleString()}/mo
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-sm font-onest text-black/50">
                                    Select a plan to continue
                                </Text>
                            )}
                        </View>

                        <Pressable
                            onPress={handleContinueToPayment}
                            disabled={!selectedPlanId}
                            className={`flex-row items-center px-6 py-3 rounded-xl ${selectedPlanId
                                ? 'bg-primary'
                                : 'bg-gray-100'
                                }`}
                        >
                            <Text
                                className={`font-onest-medium ${selectedPlanId ? 'text-white' : 'text-black/40'
                                    }`}
                            >
                                Continue
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={18}
                                color={selectedPlanId ? '#fff' : '#9CA3AF'}
                                style={{ marginLeft: 6 }}
                            />
                        </Pressable>
                    </View>
                </SafeAreaView>
            </View>
        </SafeAreaView>
    );
};

export default SubscriptionPlansScreen;