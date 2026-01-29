// app/(partner)/PartnerProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from '../../../constants/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRefresh } from '../../../contexts/RefreshContext';

type PartnerType = 'Guide' | 'Driver' | 'Creator';

interface UserData {
  user_id?: number;
  first_name: string;
  last_name: string;
  profile_pic: string;
  email: string;
  mobile_number?: string;
  created_at: string;
}

interface PartnerProfile {
  profile_id: number;
  verification_status: string;
  short_description?: string;
  city?: string;
  price_per_day?: number;
  expertise_category_id?: number;
  languages?: string[];
  areas_covered?: string;
  experience_years?: number;
  service_area?: string;
  is_multi_day?: boolean;
  vehicles?: Vehicle[];
  stats: {
    completed_trips: number;
    total_trips: number;
    average_rating: number | null;
    total_reviews: number;
  };
}

interface Vehicle {
  vehicle_id: number;
  plate_number: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  passenger_capacity: number;
  price_per_day: number;
}

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
  pending: number;
}

interface Subscription {
  subscription_id: number;
  plan_id: number;
  plan_name?: string;
  plan_code?: string;
  status: 'active' | 'trialing' | 'trial' | 'expired' | 'inactive' | 'canceled' | 'cancelled';
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  ended_at: string | null;
}

interface RegistrationPayment {
  registration_payment_id: number;
  status: 'pending' | 'paid' | 'rejected';
  amount_php: number;
  gcash_reference: string | null;
  proof_url: string | null;
  paid_at: string | null;
  created_at: string;
}

const PARTNER_CONFIG: Record<PartnerType, {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  Guide: {
    label: 'Tour Guide',
    icon: 'walk-outline',
  },
  Driver: {
    label: 'Driver',
    icon: 'car-outline',
  },
  Creator: {
    label: 'Experience Creator',
    icon: 'sparkles-outline',
  },
};

const PartnerProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { profileUpdated, triggerProfileUpdate } = useRefresh();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const SUPPORT_USER_ID = 21;

  const [userData, setUserData] = useState<UserData>({
    first_name: '',
    last_name: '',
    profile_pic: '',
    email: '',
    created_at: new Date().toISOString(),
  });

  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    pending: 0,
  });

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [latestRegPayment, setLatestRegPayment] = useState<RegistrationPayment | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const config = partnerType ? PARTNER_CONFIG[partnerType] : PARTNER_CONFIG.Guide;

  const fetchUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          ...parsedUser,
          email: parsedUser.email || '',
          created_at: parsedUser.created_at || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchPartnerProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/partner-mobile/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPartnerType(data.partner_type);
          setPartnerProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch(`${API_URL}/partner-mobile/earnings/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEarnings(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchSubscription = async () => {
    if (!user?.user_id) return;

    try {
      setSubscriptionLoading(true);
      const response = await axios.get(
        `${API_URL}/subscription/partner/${user.user_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSubscription(response.data?.subscription || null);
      setLatestRegPayment(response.data?.latest_registration_payment || null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      setLatestRegPayment(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchPartnerProfile(),
        fetchEarnings(),
        fetchSubscription(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [profileUpdated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleEditProfilePicture = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) openCamera();
          else if (buttonIndex === 2) openImagePicker();
          else if (buttonIndex === 3) handleRemovePhoto();
        }
      );
    } else {
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Gallery', onPress: openImagePicker },
          { text: 'Remove Photo', onPress: handleRemovePhoto, style: 'destructive' },
        ],
        { cancelable: true }
      );
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permissions to choose a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const openSupportChat = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in to message support");
        return;
      }

      const response = await axios.post(
        `${API_URL}/conversations`,
        { participantId: SUPPORT_USER_ID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const conversationId = response.data.data.id;

        router.push({
          pathname: "/(partner)/(conversations)/[id]",
          params: {
            id: String(conversationId),
            name: "Chat support",
          },
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to open support chat");
      }
    } catch (error) {
      console.error("Error starting support conversation:", error);
      Alert.alert("Error", "Failed to start support chat");
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('profile_pic', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_pic.jpg',
      } as any);

      const response = await fetch(`${API_URL}/users/${userData.user_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (response.ok) {
          const updatedUser = { ...userData, profile_pic: data.user.profile_pic };
          setUserData(updatedUser);
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          triggerProfileUpdate();
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile picture');
        }
      } else {
        Alert.alert('Error', 'Server error - please try again');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true);

              const response = await fetch(`${API_URL}/users/${userData.user_id}`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ profile_pic: '' }),
              });

              const data = await response.json();

              if (response.ok) {
                const updatedUser = { ...userData, profile_pic: '' };
                setUserData(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                triggerProfileUpdate();
                Alert.alert('Success', 'Profile picture removed');
              } else {
                Alert.alert('Error', data.message || 'Failed to remove profile picture');
              }
            } catch (error) {
              console.error('Error removing profile picture:', error);
              Alert.alert('Error', 'Failed to remove profile picture');
            } finally {
              setUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              router.replace('/(shared)/login');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  const getVerificationBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Verified' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    };
    return badges[status] || badges.pending;
  };

  // Subscription status styling
  const getSubscriptionStatus = (status: string | undefined) => {
    const s = (status || '').toLowerCase();

    if (s === 'active') {
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        label: 'Active',
        icon: 'checkmark-circle' as const,
        iconColor: '#059669',
      };
    }

    if (s === 'trialing' || s === 'trial') {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'Trial',
        icon: 'time' as const,
        iconColor: '#3B82F6',
      };
    }

    if (s === 'expired' || s === 'inactive') {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: 'Expired',
        icon: 'close-circle' as const,
        iconColor: '#6B7280',
      };
    }

    if (s === 'canceled' || s === 'cancelled') {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: 'Canceled',
        icon: 'close-circle' as const,
        iconColor: '#6B7280',
      };
    }

    return {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200',
      label: status || 'Unknown',
      icon: 'help-circle' as const,
      iconColor: '#6B7280',
    };
  };

  // Registration payment status
  const getRegPaymentStatus = (status: string | undefined) => {
    const s = (status || '').toLowerCase();

    if (s === 'paid') {
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Approved',
        icon: 'checkmark-circle' as const,
        iconColor: '#059669',
      };
    }

    if (s === 'pending') {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Pending Review',
        icon: 'time' as const,
        iconColor: '#D97706',
      };
    }

    if (s === 'rejected') {
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Rejected',
        icon: 'close-circle' as const,
        iconColor: '#DC2626',
      };
    }

    return {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      label: 'Not Submitted',
      icon: 'help-circle' as const,
      iconColor: '#6B7280',
    };
  };

  // Days remaining calculation
  const getDaysRemaining = () => {
    if (!subscription?.current_period_end) return null;
    const endDate = new Date(subscription.current_period_end);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-black/50 font-onest">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const verificationBadge = partnerProfile
    ? getVerificationBadge(partnerProfile.verification_status)
    : null;

  const subStatus = getSubscriptionStatus(subscription?.status);
  const regPaymentStatus = getRegPaymentStatus(latestRegPayment?.status);
  const daysRemaining = getDaysRemaining();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1f2937']}
            tintColor={'#1f2937'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-3xl font-onest-semibold text-black/90">
            Profile
          </Text>
          <TouchableOpacity onPress={handleLogout} className="bg-gray-100 p-3 rounded-full">
            <Ionicons name="log-out-outline" size={20} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View className="items-center mt-8">
          {/* Profile Picture */}
          <View className="relative">
            {uploadingImage ? (
              <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
                <ActivityIndicator size="large" color="#1f2937" />
              </View>
            ) : userData.profile_pic ? (
              <Image
                source={{ uri: `${API_URL}/${userData.profile_pic}` }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="person" size={40} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity
              className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-2"
              onPress={handleEditProfilePicture}
              disabled={uploadingImage}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Name & Email */}
          <Text className="text-xl capitalize font-onest-semibold mt-4 px-2 text-black/90">
            {userData.first_name} {userData.last_name}
          </Text>
          <Text className="text-sm text-black/50 font-onest mt-1">{userData.email}</Text>
        </View>

        {/* Subscription Section */}
        <View className="mt-12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl text-onest text-black/90">Subscription</Text>
            <TouchableOpacity onPress={() => router.push('/(partner)/subscription')}>
              <Text className="text-sm font-onest text-primary">View all</Text>
            </TouchableOpacity>
          </View>

          {subscriptionLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#6B7280" />
            </View>
          ) : (
            <View
              className="rounded-2xl p-4 bg-white border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Plan & Status Row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className={`w-10 h-10 rounded-full ${subStatus.bg} items-center justify-center mr-3`}>
                    <Ionicons name={subStatus.icon} size={20} color={subStatus.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-onest-medium capitalize text-black/90">
                      {subscription?.plan_name + " plan" || 'No subscription'}
                    </Text>
                    <Text className="text-xs font-onest text-black/50 mt-0.5">
                      {subscription ? `Started ${formatDate(subscription.started_at)}` : 'Not subscribed'}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View className={`px-3 py-1 rounded-full ${subStatus.bg} border ${subStatus.border}`}>
                  <Text className={`text-xs font-onest-medium ${subStatus.text}`}>
                    {subStatus.label}
                  </Text>
                </View>
              </View>

              {/* Period Info */}
              {subscription && (
                <View className="flex-row mt-4 pt-4 border-t border-gray-100">
                  <View className="flex-1">
                    <Text className="text-xs text-black/50 font-onest">Current Period</Text>
                    <Text className="text-sm font-onest text-black/80 mt-1">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </Text>
                  </View>

                  {daysRemaining !== null && (
                    <View className="items-end">
                      <Text className="text-xs text-black/50 font-onest">Days Left</Text>
                      <Text
                        className={`text-sm font-onest-semibold mt-1 ${daysRemaining <= 7 ? 'text-yellow-600' : 'text-black/80'
                          }`}
                      >
                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Registration Payment Status (if pending or rejected) */}
              {latestRegPayment && latestRegPayment.status !== 'paid' && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={regPaymentStatus.icon}
                      size={16}
                      color={regPaymentStatus.iconColor}
                    />
                    <Text className={`ml-2 text-sm font-onest ${regPaymentStatus.text}`}>
                      Registration: {regPaymentStatus.label}
                    </Text>
                  </View>
                  {latestRegPayment.status === 'rejected' && (
                    <Text className="text-xs font-onest text-red-600 mt-1">
                      Please upload a new payment proof.
                    </Text>
                  )}
                </View>
              )}

              {/* No subscription state */}
              {!subscription && !latestRegPayment && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons name="information-circle-outline" size={16} color="#D97706" />
                    <Text className="ml-2 text-sm font-onest text-yellow-700">
                      Complete registration payment to activate your subscription.
                    </Text>
                  </View>
                </View>
              )}

              {/* Manage Button */}
              <Pressable
                onPress={() => router.push('/(partner)/(subscription)/subscription')}
                className="mt-4 flex-row items-center justify-center py-3 rounded-xl bg-gray-100"
              >
                <Ionicons name="card-outline" size={18} color="#374151" />
                <Text className="ml-2 text-sm font-onest-medium text-gray-700">
                  Manage Subscription
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Performance Section */}
        {/* <View className="mt-12">
          <Text className="text-2xl text-onest text-black/90 mb-4">Performance</Text>

          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mb-2">
                <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
              </View>
              <Text className="text-lg font-onest-semibold text-black/90">
                {partnerProfile?.stats.completed_trips || 0}
              </Text>
              <Text className="text-xs text-black/50 font-onest">Completed</Text>
            </View>

            <View className="flex-1 items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mb-2">
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-lg font-onest-semibold text-black/90">
                {partnerProfile?.stats.total_trips || 0}
              </Text>
              <Text className="text-xs text-black/50 font-onest">Total Trips</Text>
            </View>

            <View className="flex-1 items-center">
              <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mb-2">
                <Ionicons name="star-outline" size={20} color="#F59E0B" />
              </View>
              <Text className="text-lg font-onest-semibold text-black/90">
                {partnerProfile?.stats.average_rating || '—'}
              </Text>
              <Text className="text-xs text-black/50 font-onest">Rating</Text>
            </View>
          </View>
        </View> */}

        {/* Earnings Section */}
        <View className="mt-12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl text-onest text-black/90">Earnings</Text>
            <TouchableOpacity onPress={() => router.push('/(partner)/earnings')}>
              <Text className="text-sm font-onest text-primary">View all</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                <Ionicons name="wallet-outline" size={20} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-onest text-black/90">This Month</Text>
                <Text className="text-xs font-onest text-black/50 mt-0.5">
                  {formatCurrency(earnings.month)}
                </Text>
              </View>
            </View>
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-xs font-onest text-green-600">
                +{formatCurrency(earnings.week)} this week
              </Text>
            </View>
          </View>

          <View className="flex-row mt-4 pt-4 border-t border-gray-100">
            <View className="flex-1">
              <Text className="text-xs text-black/50 font-onest">Total Earned</Text>
              <Text className="text-base font-onest-semibold text-black/90 mt-1">
                {formatCurrency(earnings.total)}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-xs text-black/50 font-onest">Pending</Text>
              <Text className="text-base font-onest-semibold text-yellow-600 mt-1">
                {formatCurrency(earnings.pending)}
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Vehicles Section */}
        {partnerType === 'Driver' && partnerProfile?.vehicles && partnerProfile.vehicles.length > 0 && (
          <View className="mt-12">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-2xl text-onest text-black/90">My Vehicle</Text>
              <TouchableOpacity onPress={() => router.push('/(partner)/vehicles')}>
                <Text className="text-sm font-onest text-primary">Manage</Text>
              </TouchableOpacity>
            </View>

            {partnerProfile.vehicles.slice(0, 2).map((vehicle, index) => (
              <Pressable
                key={vehicle.vehicle_id}
                onPress={() =>
                  router.push({
                    pathname: "/(partner)/(vehicles)/[vehicleId]",
                    params: { vehicleId: String(vehicle.vehicle_id) },
                  })
                }
                className={`flex-row items-center ${index < partnerProfile.vehicles!.length - 1 ? "mb-3" : ""
                  }`}
                android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              >
                <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name="car-outline" size={24} color="#6B7280" />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-onest text-black/90">
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text className="text-xs font-onest text-black/50 mt-0.5">
                    {vehicle.plate_number} • {vehicle.color} • {vehicle.passenger_capacity} seats
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-sm font-onest-semibold text-primary">
                    ₱{vehicle.price_per_day?.toLocaleString()}/day
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View className="mt-12">
          <Text className="text-2xl text-onest text-black/90 mb-4">Quick Actions</Text>

          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={() => router.push('/(partner)/availability')}
          >
            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-onest text-black/90">Availability</Text>
              <Text className="text-xs font-onest text-black/50 mt-0.5">Manage your schedule</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="border-t border-gray-100" />

          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={() => router.push('/(partner)/(profile)/settings')}
          >
            <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-onest text-black/90">Account Settings</Text>
              <Text className="text-xs font-onest text-black/50 mt-0.5">Password, notifications & more</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="border-t border-gray-100" />

          <Pressable
            onPress={openSupportChat}
            className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
          >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-onest text-black/90">Chat Support</Text>
              <Text className="text-xs font-onest text-black/50 mt-0.5">Ask help</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PartnerProfileScreen;