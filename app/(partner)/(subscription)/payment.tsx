// app/(partner)/(subscription)/payment.tsx
import API_URL from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const SubscriptionPaymentScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, token } = useAuth();

    // Plan info from navigation params
    const planId = params.plan_id as string;
    const planName = params.plan_name as string;
    const planPrice = params.plan_price as string;
    const isRenewal = params.is_renewal === 'true';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [subscriptionId, setSubscriptionId] = useState<number | null>(null);

    // Form state
    const [proofUri, setProofUri] = useState<string | null>(null);
    const [proofFileName, setProofFileName] = useState<string | null>(null);
    const [gcashReference, setGcashReference] = useState('');

    // Fetch subscription ID
    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user?.user_id) return;

            try {
                setLoading(true);
                const response = await axios.get(
                    `${API_URL}/subscription/partner/${user.user_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const sub = response.data?.subscription;
                if (sub?.subscription_id) {
                    setSubscriptionId(sub.subscription_id);
                }
            } catch (error) {
                console.error('Error fetching subscription:', error);
                toast.error('Failed to load subscription info');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [user?.user_id, token]);

    // Redirect if no plan selected
    useEffect(() => {
        if (!planId && !loading) {
            toast.error('Please select a plan first');
            router.back();
        }
    }, [planId, loading]);

    const handlePickImage = () => {
        Alert.alert(
            'Upload Payment Proof',
            'Choose an option',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Take Photo', onPress: openCamera },
                { text: 'Choose from Gallery', onPress: openGallery },
            ],
            { cancelable: true }
        );
    };

    const openCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setProofUri(result.assets[0].uri);
            setProofFileName('payment_proof.jpg');
        }
    };

    const openGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permission is required.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            const fileName = uri.split('/').pop() || 'payment_proof.jpg';
            setProofUri(uri);
            setProofFileName(fileName);
        }
    };

    const handleRemoveImage = () => {
        setProofUri(null);
        setProofFileName(null);
    };

    const handleSubmit = async () => {
        if (!proofUri) {
            toast.error('Please upload payment proof');
            return;
        }

        if (!subscriptionId) {
            toast.error('Subscription not found. Please try again.');
            return;
        }

        if (!planId) {
            toast.error('No plan selected. Please go back and select a plan.');
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('proof', {
                uri: proofUri,
                type: 'image/jpeg',
                name: proofFileName || 'proof.jpg',
            } as any);
            formData.append('plan_id', planId);
            formData.append('amount_php', planPrice || '0');
            if (gcashReference.trim()) {
                formData.append('gcash_reference', gcashReference.trim());
            }

            await axios.post(
                `${API_URL}/subscription/subscriptions/${subscriptionId}/upload-proof`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            toast.success('Payment proof submitted!');
            router.replace('/(partner)/(subscription)/subscription');
        } catch (error: any) {
            console.error('Error uploading proof:', error);
            const message = error.response?.data?.message || 'Failed to submit payment proof';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-black/50 font-onest">Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
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
                                    Upload Payment
                                </Text>
                                <Text className="text-sm font-onest text-black/50 mt-0.5">
                                    Complete your subscription via GCash
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Selected Plan Summary */}
                    <View className="px-6 mt-6">
                        <View className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-xs font-onest text-black/50">
                                        Selected Plan
                                    </Text>
                                    <Text className="text-lg font-onest-semibold text-black/90 mt-0.5">
                                        {planName || 'Unknown Plan'}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-xs font-onest text-black/50">Amount</Text>
                                    <Text className="text-lg font-onest-semibold text-black/90 mt-0.5">
                                        ₱{Number(planPrice || 0).toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            {/* Renewal vs Change Notice */}
                            <View className="mt-4 pt-4 border-t border-gray-200">
                                {isRenewal ? (
                                    <View className="flex-row items-start">
                                        <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                        <Text className="ml-2 flex-1 text-sm font-onest text-green-700">
                                            This is a <Text className="font-onest-semibold">renewal</Text>.
                                            Your subscription will be extended from your current end date.
                                        </Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-start">
                                        <Ionicons name="alert-circle" size={16} color="#D97706" />
                                        <Text className="ml-2 flex-1 text-sm font-onest text-amber-700">
                                            This is a <Text className="font-onest-semibold">plan change</Text>.
                                            Your new period will start from approval date.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Payment Instructions */}
                    <View className="px-6 mt-6">
                        <Text className="text-lg font-onest-semibold text-black/90 mb-4">
                            How to Pay
                        </Text>

                        <View className="space-y-4 gap-8">
                            {/* Step 1 */}
                            <View className="flex-row">
                                <View className="w-7 h-7 bg-primary rounded-full items-center justify-center mr-3">
                                    <Text className="text-xs font-onest-semibold text-white">1</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-onest-medium text-black/90">
                                        Open GCash App
                                    </Text>
                                    <Text className="text-sm font-onest text-black/50 mt-0.5">
                                        Go to "Send Money" or "Pay Bills"
                                    </Text>
                                </View>
                            </View>

                            {/* Step 2 */}
                            <View className="flex-row">
                                <View className="w-7 h-7 bg-primary rounded-full items-center justify-center mr-3">
                                    <Text className="text-xs font-onest-semibold text-white">2</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-onest-medium text-black/90">
                                        Send to Our GCash
                                    </Text>
                                    <View className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <Text className="text-xs font-onest text-black/50">
                                            GCash Number
                                        </Text>
                                        <Text className="text-sm font-onest-semibold text-black/90 mt-0.5">
                                            0956 607 2777
                                        </Text>
                                        <Text className="text-xs font-onest text-black/50 mt-2">
                                            Account Name
                                        </Text>
                                        <Text className="text-sm font-onest-semibold text-black/90 mt-0.5">
                                            Itinera Travel Inc.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Step 3 */}
                            <View className="flex-row">
                                <View className="w-7 h-7 bg-primary rounded-full items-center justify-center mr-3">
                                    <Text className="text-xs font-onest-semibold text-white">3</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-onest-medium text-black/90">
                                        Enter Amount
                                    </Text>
                                    <Text className="text-sm font-onest text-black/50 mt-0.5">
                                        Send exactly{' '}
                                        <Text className="font-onest-semibold text-black/90">
                                            ₱{Number(planPrice || 0).toLocaleString()}
                                        </Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Step 4 */}
                            <View className="flex-row">
                                <View className="w-7 h-7 bg-primary rounded-full items-center justify-center mr-3">
                                    <Text className="text-xs font-onest-semibold text-white">4</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-onest-medium text-black/90">
                                        Screenshot & Upload
                                    </Text>
                                    <Text className="text-sm font-onest text-black/50 mt-0.5">
                                        Take a screenshot of the confirmation and upload below
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* GCash Reference Input */}
                    <View className="px-6 mt-8">
                        <Text className="text-sm font-onest-medium text-black/80 mb-2">
                            GCash Reference Number{' '}
                            <Text className="text-black/40">(optional)</Text>
                        </Text>
                        <TextInput
                            value={gcashReference}
                            onChangeText={setGcashReference}
                            placeholder="e.g., 1234567890"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-onest text-black/90"
                        />
                        <Text className="text-xs font-onest text-black/40 mt-1.5">
                            Enter the reference number from your GCash transaction
                        </Text>
                    </View>

                    {/* Proof Upload */}
                    <View className="px-6 mt-6">
                        <Text className="text-sm font-onest-medium text-black/80 mb-2">
                            Payment Screenshot <Text className="text-red-500">*</Text>
                        </Text>

                        {!proofUri ? (
                            <Pressable
                                onPress={handlePickImage}
                                className="h-48 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center bg-gray-50"
                            >
                                <Ionicons name="cloud-upload-outline" size={36} color="#9CA3AF" />
                                <Text className="text-sm font-onest text-black/60 mt-2">
                                    Tap to upload
                                </Text>
                                <Text className="text-xs font-onest text-black/40 mt-1">
                                    PNG, JPG up to 5MB
                                </Text>
                            </Pressable>
                        ) : (
                            <View className="relative">
                                <View className="border border-gray-200 rounded-2xl overflow-hidden">
                                    <Image
                                        source={{ uri: proofUri }}
                                        className="w-full h-64"
                                        resizeMode="contain"
                                        style={{ backgroundColor: '#F9FAFB' }}
                                    />
                                </View>

                                {/* Remove Button */}
                                <Pressable
                                    onPress={handleRemoveImage}
                                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full items-center justify-center"
                                >
                                    <Ionicons name="close" size={18} color="#fff" />
                                </Pressable>

                                {/* File Name */}
                                <View className="flex-row items-center mt-2">
                                    <Ionicons name="image-outline" size={14} color="#6B7280" />
                                    <Text className="ml-1.5 text-xs font-onest text-black/50">
                                        {proofFileName}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Note */}
                    <View className="px-6 mt-6">
                        <View className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <View className="flex-row items-start">
                                <Ionicons name="information-circle" size={18} color="#D97706" />
                                <Text className="ml-2 flex-1 text-xs font-onest text-amber-800">
                                    <Text className="font-onest-semibold">Note:</Text> Your payment
                                    will be reviewed by our team. Subscription will be activated
                                    within 24 hours of approval.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Submit Button */}
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
                        <Pressable
                            onPress={handleSubmit}
                            disabled={submitting || !proofUri}
                            className={`flex-row items-center justify-center py-4 rounded-xl ${submitting || !proofUri ? 'bg-gray-100' : 'bg-primary'
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <ActivityIndicator size="small" color="#9CA3AF" />
                                    <Text className="ml-2 font-onest-medium text-black/40">
                                        Submitting...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons
                                        name="card-outline"
                                        size={20}
                                        color={proofUri ? '#fff' : '#9CA3AF'}
                                    />
                                    <Text
                                        className={`ml-2 font-onest-medium ${proofUri ? 'text-white' : 'text-black/40'
                                            }`}
                                    >
                                        Submit Payment Proof
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SubscriptionPaymentScreen;