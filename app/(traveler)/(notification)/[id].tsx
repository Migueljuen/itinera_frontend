import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    DeviceEventEmitter,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../../../constants/api';
import { useRefresh } from '../../../contexts/RefreshContext';
import { NotificationEvents } from '../../../utils/notificationEvents';

type NotificationType = 'itinerary' | 'activity' | 'reminder' | 'update' | 'alert' | 'attendance_confirmation';

interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    description: string;
    is_read: boolean;
    created_at: string;
    read_at: string | null;
    itinerary_id: number | null;
    itinerary_item_id: number | null;
    experience_id: number | null;
    booking_id: number | null;
    icon: string;
    icon_color: string;
    action_url: string | null;
    itinerary_title?: string;
    itinerary_start_date?: string;
    experience_name?: string;
}

const NotificationDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { triggerProfileUpdate } = useRefresh();

    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    // Review states
    const [showReviewSection, setShowReviewSection] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);


    const fetchUserData = async () => {
        try {
            const user = await AsyncStorage.getItem("user");
            if (user) {
                const parsedUser = JSON.parse(user);
                setUserId(parsedUser.user_id);
                console.log("User attempting review:", parsedUser.user_id); // ✅ log here
            } else {
                console.log("No user found in AsyncStorage.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    // Fetch notification details
    const fetchNotificationDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('No auth token found');
                router.back();
                return;
            }

            const response = await axios.get(`${API_URL}/notifications/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const notif = response.data.notification;
                setNotification(notif);

                // Check if this is a "Experience Completed" notification
                const isCompletedExperience =
                    notif.type === 'update' &&
                    notif.title === 'Experience Completed!' &&
                    notif.booking_id;

                setShowReviewSection(isCompletedExperience);

                // Check if user already reviewed this booking
                if (isCompletedExperience && notif.booking_id) {
                    await checkExistingReview(notif.booking_id);
                }

                // Mark as read if not already read
                if (!notif.is_read) {
                    await markAsRead();
                }
            } else {
                Alert.alert('Error', 'Notification not found');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching notification details:', error);
            Alert.alert('Error', 'Failed to load notification details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Check if user already submitted a review for this booking
    const checkExistingReview = async (bookingId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                `${API_URL}/reviews/booking/${bookingId}/check`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.exists) {
                setReviewSubmitted(true);
                setRating(response.data.review.rating);
                setReviewComment(response.data.review.comment);
            }
        } catch (error) {
            console.error('Error checking existing review:', error);
        }
    };

    // Submit review
    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating.');
            return;
        }

        if (reviewComment.trim().length < 10) {
            Alert.alert('Review Required', 'Please write a review (at least 10 characters).');
            return;
        }

        try {
            setSubmittingReview(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await axios.post(
                `${API_URL}/reviews`,
                {
                    user_id: userId,
                    booking_id: notification?.booking_id,
                    experience_id: notification?.experience_id,
                    rating: rating,
                    comment: reviewComment.trim()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setReviewSubmitted(true);
                Alert.alert(
                    'Review Submitted!',
                    'Thank you for sharing your experience!',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', response.data.message || 'Failed to submit review');
            }
        } catch (error: any) {
            console.error('Error submitting review:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to submit review'
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    // Mark notification as read
    const markAsRead = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            await axios.put(
                `${API_URL}/notifications/${id}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setNotification(prev => prev ? { ...prev, is_read: true } : null);
            triggerProfileUpdate();
            DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Delete notification
    const handleDelete = async () => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            const token = await AsyncStorage.getItem('token');
                            if (!token) return;

                            const response = await axios.delete(
                                `${API_URL}/notifications/${id}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                }
                            );

                            if (response.data.success) {
                                DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);
                                triggerProfileUpdate();
                                router.back();
                            } else {
                                Alert.alert('Error', 'Failed to delete notification');
                            }
                        } catch (error) {
                            console.error('Error deleting notification:', error);
                            Alert.alert('Error', 'Failed to delete notification');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    // Navigate to related content
    const handleViewDetails = () => {
        if (!notification) return;

        if (notification.experience_id) {
            router.push(`/(traveler)/(experience)/${notification.experience_id}`);
        } else if (notification.itinerary_id) {
            router.push(`/(traveler)/(itinerary)/${notification.itinerary_id}`);
        } else if (notification.itinerary_item_id) {
            router.push(`/(traveler)/(itinerary)/activity/${notification.itinerary_item_id}`);
        }
    };

    useEffect(() => {
        fetchNotificationDetails();
    }, [id]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderStarRating = () => {
        return (
            <View className="flex-row justify-center mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                        key={star}
                        onPress={() => !reviewSubmitted && setRating(star)}
                        disabled={reviewSubmitted}
                        className="mx-1"
                    >
                        <FontAwesome
                            name={star <= rating ? "star" : "star-o"}
                            size={40}
                            color={star <= rating ? "#FCD34D" : "#D1D5DB"}
                        />
                    </Pressable>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
            </SafeAreaView>
        );
    }

    if (!notification) {
        return null;
    }

    const hasRelatedContent = notification.itinerary_id || notification.itinerary_item_id || notification.experience_id;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <View className="flex-1 bg">
                <StatusBar />

                {/* Header */}
                <View className="">
                    <SafeAreaView>
                        <View className="px-4">
                            <View className="flex-row justify-between items-center  mt-4">
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="p-2"
                                >
                                    <Ionicons name="arrow-back" size={24} color="black" />
                                </TouchableOpacity>

                                <Text className="text-black/90 text-lg font-onest-semibold">Inbox</Text>

                                <TouchableOpacity
                                    onPress={handleDelete}
                                    disabled={deleting}
                                    className="p-2"
                                >
                                    {deleting ? (
                                        <ActivityIndicator size="small" color="black" />
                                    ) : (
                                        <Ionicons name="trash-outline" size={24} color="black" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Content */}
                <ScrollView className="flex-1 rounded-2xl " showsVerticalScrollIndicator={false}>
                    <View className="px-6 py-8 mt-4">

                        <View className="bg-white rounded-2xl p-6 mb-6 relative ">
                            {/* Icon */}
                            <View className="absolute -top-12 left-0 right-0 items-center">
                                <View
                                    className="w-20 h-20 rounded-full border-8 border-white items-center justify-center"
                                    style={{ backgroundColor: notification.icon_color }}
                                >
                                    <Ionicons
                                        name={notification.icon as any}
                                        size={40}
                                        color="white"
                                    />
                                </View>
                            </View>

                            {/* Title */}
                            <Text className="text-2xl font-onest-bold text-center text-black/90 my-6 border-b pb-4 border-gray-200">
                                {notification.title}
                            </Text>

                            {/* Description */}
                            <Text className="text-black/60 font-onest text-base leading-6 text-center mb-8">
                                {notification.description}
                            </Text>

                            {/* Additional Context */}
                            {notification.itinerary_title && (
                                <View className="rounded-xl p-4 mb-6">
                                    <View className="flex-row items-center">
                                        <Ionicons name="map-outline" size={20} color="#6B7280" />
                                        <Text className="text-black/60 font-onest ml-2">
                                            Related to: {notification.itinerary_title}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Date/Time */}
                            <Text className="text-gray-400 font-onest text-center text-sm mb-4">
                                {formatDateTime(notification.created_at)}
                            </Text>


                        </View>


                        {/* Review Section */}
                        {showReviewSection && (
                            <View className="bg-white rounded-2xl p-6 mb-6 ">
                                <View className="items-center mb-4">
                                    {/* <FontAwesome name="star" size={32} color="#FCD34D" /> */}
                                    <Text className="text-xl font-onest-semibold text-black/90 mt-2">
                                        {reviewSubmitted ? 'Your Review' : 'How was your experience?'}
                                    </Text>
                                    <Text className="text-black/60 font-onest text-sm text-center mt-1">
                                        {reviewSubmitted
                                            ? 'Thank you for your feedback!'
                                            : 'Help others by sharing your experience'}
                                    </Text>
                                </View>

                                {/* Star Rating */}
                                {renderStarRating()}

                                {/* Review Text */}
                                <View className="mb-4">

                                    <TextInput
                                        className=" rounded-xl p-4 font-onest text-black/90 min-h-[40px]"
                                        placeholder="Type review..."
                                        placeholderTextColor="#9CA3AF"
                                        multiline
                                        numberOfLines={5}
                                        textAlignVertical="top"
                                        value={reviewComment}
                                        onChangeText={setReviewComment}
                                        editable={!reviewSubmitted}
                                        style={{
                                            borderWidth: 1,
                                            borderColor: '#f0f0f0'
                                        }}
                                    />
                                    <Text className="text-gray-400 font-onest text-xs mt-2">
                                        Minimum 10 characters
                                    </Text>
                                </View>

                                {/* Submit Button */}
                                {!reviewSubmitted && (
                                    <TouchableOpacity
                                        onPress={handleSubmitReview}
                                        disabled={submittingReview}
                                        className="bg-primary rounded-full py-4 items-center"
                                        style={{
                                            shadowColor: '#4F46E5',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 8,
                                            elevation: 5,
                                        }}
                                    >
                                        {submittingReview ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text className="text-white font-onest-semibold text-base">
                                                Submit Review
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {reviewSubmitted && (
                                    <View className="bg-green-50 rounded-xl p-4 flex-row items-center">
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                        <Text className="text-green-700 font-onest ml-2 flex-1">
                                            Your review has been submitted successfully!
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* View Details Button */}
                    {hasRelatedContent && (
                        <View className="px-6 pb-8">
                            <TouchableOpacity
                                onPress={handleViewDetails}
                                className="py-4 items-center"
                            >
                                <Text className="text-blue-500 font-onest-semibold text-base">
                                    View Experience Details
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

export default NotificationDetailScreen;















// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import {
//     ActivityIndicator,
//     Alert,
//     DeviceEventEmitter,
//     ScrollView,
//     StatusBar,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import API_URL from '../../../constants/api';
// import { useRefresh } from '../../../contexts/RefreshContext';
// import { NotificationEvents } from '../../../utils/notificationEvents';

// type NotificationType = 'itinerary' | 'activity' | 'reminder' | 'update' | 'alert' | 'attendance_confirmation';

// interface Notification {
//     id: number;
//     user_id: number;
//     type: NotificationType;
//     title: string;
//     description: string;
//     is_read: boolean;
//     created_at: string;
//     read_at: string | null;
//     itinerary_id: number | null;
//     itinerary_item_id: number | null;
//     experience_id: number | null;
//     booking_id: number | null;
//     icon: string;
//     icon_color: string;
//     action_url: string | null;
//     itinerary_title?: string;
//     itinerary_start_date?: string;
//     experience_name?: string;
// }

// const NotificationDetailScreen = () => {
//     const { id } = useLocalSearchParams();
//     const router = useRouter();
//     const { triggerProfileUpdate } = useRefresh();
//     const [userId, setUserId] = useState<number | null>(null);

//     const [notification, setNotification] = useState<Notification | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [deleting, setDeleting] = useState(false);

//     // Review states
//     const [showReviewSection, setShowReviewSection] = useState(false);
//     const [rating, setRating] = useState(0);
//     const [reviewComment, setReviewComment] = useState('');
//     const [submittingReview, setSubmittingReview] = useState(false);
//     const [reviewSubmitted, setReviewSubmitted] = useState(false);


//     const fetchUserData = async () => {
//         try {
//             const user = await AsyncStorage.getItem("user");
//             if (user) {
//                 const parsedUser = JSON.parse(user);
//                 setUserId(parsedUser.user_id);
//                 console.log("User attempting review:", parsedUser.user_id); // ✅ log here
//             } else {
//                 console.log("No user found in AsyncStorage.");
//             }
//         } catch (error) {
//             console.error("Error fetching user data:", error);
//         }
//     };

//     useEffect(() => {
//         fetchUserData();
//     }, []);
//     // Fetch notification details
//     const fetchNotificationDetails = async () => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             if (!token) {
//                 console.error('No auth token found');
//                 router.back();
//                 return;
//             }

//             const response = await axios.get(`${API_URL}/notifications/${id}`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });

//             if (response.data.success) {
//                 const notif = response.data.notification;
//                 setNotification(notif);

//                 // 🐛 DEBUG: Log notification data
//                 console.log('📧 Notification Data:', {
//                     type: notif.type,
//                     title: notif.title,
//                     booking_id: notif.booking_id,
//                     experience_id: notif.experience_id
//                 });

//                 // Check if this is a "Experience Completed" notification
//                 const isCompletedExperience =
//                     notif.type === 'update' &&
//                     notif.title === 'Experience Completed!' &&
//                     notif.booking_id;

//                 // 🐛 DEBUG: Log each condition
//                 console.log('🔍 Review Section Check:');
//                 console.log('  - Type is "update"?', notif.type === 'update');
//                 console.log('  - Title matches?', notif.title === 'Experience Completed!');
//                 console.log('  - Has booking_id?', !!notif.booking_id);
//                 console.log('  - Final result:', isCompletedExperience);

//                 setShowReviewSection(isCompletedExperience);

//                 // Check if user already reviewed this booking
//                 if (isCompletedExperience && notif.booking_id) {
//                     console.log('✅ Checking for existing review...');
//                     await checkExistingReview(notif.booking_id);
//                 } else {
//                     console.log('❌ Not checking for review - conditions not met');
//                 }

//                 // Mark as read if not already read
//                 if (!notif.is_read) {
//                     await markAsRead();
//                 }
//             } else {
//                 Alert.alert('Error', 'Notification not found');
//                 router.back();
//             }
//         } catch (error) {
//             console.error('Error fetching notification details:', error);
//             Alert.alert('Error', 'Failed to load notification details');
//             router.back();
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Check if user already submitted a review for this booking
//     const checkExistingReview = async (bookingId: number) => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             if (!token) return;

//             console.log('🔎 Checking review for booking:', bookingId);

//             const response = await axios.get(
//                 `${API_URL}/reviews/booking/${bookingId}/check`,
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`
//                     }
//                 }
//             );

//             console.log('📊 Review check response:', response.data);

//             if (response.data.success && response.data.exists) {
//                 console.log('✅ Review already exists');
//                 setReviewSubmitted(true);
//                 setRating(response.data.review.rating);
//                 setReviewComment(response.data.review.comment);
//             } else {
//                 console.log('📝 No existing review found');
//             }
//         } catch (error) {
//             console.error('Error checking existing review:', error);
//         }
//     };

//     // Submit review
//     const handleSubmitReview = async () => {
//         if (rating === 0) {
//             Alert.alert('Rating Required', 'Please select a star rating.');
//             return;
//         }

//         if (reviewComment.trim().length < 10) {
//             Alert.alert('Review Required', 'Please write a review (at least 10 characters).');
//             return;
//         }

//         try {
//             setSubmittingReview(true);
//             const token = await AsyncStorage.getItem('token');
//             if (!token) return;

//             console.log('📤 Submitting review:', {
//                 booking_id: notification?.booking_id,
//                 experience_id: notification?.experience_id,
//                 rating: rating,
//                 comment_length: reviewComment.trim().length
//             });

//             const response = await axios.post(
//                 `${API_URL}/reviews`,
//                 {
//                     user_id: userId,
//                     booking_id: notification?.booking_id,
//                     experience_id: notification?.experience_id,
//                     rating: rating,
//                     comment: reviewComment.trim()
//                 },
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`
//                     }
//                 }
//             );

//             console.log('📥 Submit response:', response.data);

//             if (response.data.success) {
//                 setReviewSubmitted(true);
//                 Alert.alert(
//                     'Review Submitted!',
//                     'Thank you for sharing your experience!',
//                     [{ text: 'OK' }]
//                 );
//             } else {
//                 Alert.alert('Error', response.data.message || 'Failed to submit review');
//             }
//         } catch (error: any) {
//             console.error('Error submitting review:', error);
//             console.error('Error details:', error.response?.data);
//             Alert.alert(
//                 'Error',
//                 error.response?.data?.message || 'Failed to submit review'
//             );
//         } finally {
//             setSubmittingReview(false);
//         }
//     };

//     // Mark notification as read
//     const markAsRead = async () => {
//         try {
//             const token = await AsyncStorage.getItem('token');
//             if (!token) return;

//             await axios.put(
//                 `${API_URL}/notifications/${id}/read`,
//                 {},
//                 {
//                     headers: {
//                         'Authorization': `Bearer ${token}`
//                     }
//                 }
//             );

//             setNotification(prev => prev ? { ...prev, is_read: true } : null);
//             triggerProfileUpdate();
//             DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);
//         } catch (error) {
//             console.error('Error marking notification as read:', error);
//         }
//     };

//     // Delete notification
//     const handleDelete = async () => {
//         Alert.alert(
//             'Delete Notification',
//             'Are you sure you want to delete this notification?',
//             [
//                 {
//                     text: 'Cancel',
//                     style: 'cancel'
//                 },
//                 {
//                     text: 'Delete',
//                     style: 'destructive',
//                     onPress: async () => {
//                         try {
//                             setDeleting(true);
//                             const token = await AsyncStorage.getItem('token');
//                             if (!token) return;

//                             const response = await axios.delete(
//                                 `${API_URL}/notifications/${id}`,
//                                 {
//                                     headers: {
//                                         'Authorization': `Bearer ${token}`
//                                     }
//                                 }
//                             );

//                             if (response.data.success) {
//                                 DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);
//                                 triggerProfileUpdate();
//                                 router.back();
//                             } else {
//                                 Alert.alert('Error', 'Failed to delete notification');
//                             }
//                         } catch (error) {
//                             console.error('Error deleting notification:', error);
//                             Alert.alert('Error', 'Failed to delete notification');
//                         } finally {
//                             setDeleting(false);
//                         }
//                     }
//                 }
//             ]
//         );
//     };

//     // Navigate to related content
//     const handleViewDetails = () => {
//         if (!notification) return;

//         if (notification.experience_id) {
//             router.push(`/(traveler)/(experience)/${notification.experience_id}`);
//         } else if (notification.itinerary_id) {
//             router.push(`/(traveler)/(itinerary)/${notification.itinerary_id}`);
//         } else if (notification.itinerary_item_id) {
//             router.push(`/(traveler)/(itinerary)/activity/${notification.itinerary_item_id}`);
//         }
//     };

//     useEffect(() => {
//         fetchNotificationDetails();
//     }, [id]);

//     const formatDateTime = (dateString: string) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-US', {
//             weekday: 'long',
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric',
//             hour: 'numeric',
//             minute: '2-digit',
//             hour12: true
//         });
//     };

//     const renderStarRating = () => {
//         return (
//             <View className="flex-row justify-center mb-6">
//                 {[1, 2, 3, 4, 5].map((star) => (
//                     <TouchableOpacity
//                         key={star}
//                         onPress={() => !reviewSubmitted && setRating(star)}
//                         disabled={reviewSubmitted}
//                         className="mx-1"
//                     >
//                         <Ionicons
//                             name={star <= rating ? "star" : "star-outline"}
//                             size={40}
//                             color={star <= rating ? "#FCD34D" : "#D1D5DB"}
//                         />
//                     </TouchableOpacity>
//                 ))}
//             </View>
//         );
//     };

//     if (loading) {
//         return (
//             <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
//                 <ActivityIndicator size="large" color="#1f2937" />
//             </SafeAreaView>
//         );
//     }

//     if (!notification) {
//         return null;
//     }

//     const hasRelatedContent = notification.itinerary_id || notification.itinerary_item_id || notification.experience_id;

//     // 🐛 DEBUG: Log render state
//     console.log('🎨 Rendering screen with showReviewSection:', showReviewSection);

//     return (
//         <View className="flex-1 bg-gray-50">
//             <StatusBar barStyle="light-content" backgroundColor="#4F7C7E" />

//             {/* Header */}
//             <View className="bg-primary">
//                 <SafeAreaView>
//                     <View className="px-4 pt-4 pb-6">
//                         <View className="flex-row justify-between items-center">
//                             <TouchableOpacity
//                                 onPress={() => router.back()}
//                                 className="p-2"
//                             >
//                                 <Ionicons name="arrow-back" size={24} color="white" />
//                             </TouchableOpacity>

//                             <Text className="text-white text-lg font-onest-semibold">Inbox</Text>

//                             <TouchableOpacity
//                                 onPress={handleDelete}
//                                 disabled={deleting}
//                                 className="p-2"
//                             >
//                                 {deleting ? (
//                                     <ActivityIndicator size="small" color="white" />
//                                 ) : (
//                                     <Ionicons name="trash-outline" size={24} color="white" />
//                                 )}
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </SafeAreaView>
//             </View>

//             {/* Content */}
//             <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//                 <View className="px-6 py-8">
//                     {/* Icon */}
//                     <View className="items-center mb-6">
//                         <View
//                             className="w-20 h-20 rounded-full items-center justify-center"
//                             style={{ backgroundColor: notification.icon_color }}
//                         >
//                             <Ionicons
//                                 name={notification.icon as any}
//                                 size={40}
//                                 color="white"
//                             />
//                         </View>
//                     </View>

//                     {/* Date/Time */}
//                     <Text className="text-gray-400 font-onest text-center text-sm mb-4">
//                         {formatDateTime(notification.created_at)}
//                     </Text>

//                     {/* Title */}
//                     <Text className="text-2xl font-onest-bold text-center text-gray-800 mb-6">
//                         {notification.title}
//                     </Text>

//                     {/* Description */}
//                     <Text className="text-gray-600 font-onest text-base leading-6 text-center mb-8">
//                         {notification.description}
//                     </Text>

//                     {/* 🐛 DEBUG: Show notification details */}
//                     {__DEV__ && (
//                         <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
//                             <Text className="text-xs font-mono text-gray-700 mb-2">🐛 DEBUG INFO:</Text>
//                             <Text className="text-xs font-mono text-gray-600">Type: {notification.type}</Text>
//                             <Text className="text-xs font-mono text-gray-600">Title: {notification.title}</Text>
//                             <Text className="text-xs font-mono text-gray-600">Booking ID: {notification.booking_id || 'null'}</Text>
//                             <Text className="text-xs font-mono text-gray-600">Experience ID: {notification.experience_id || 'null'}</Text>
//                             <Text className="text-xs font-mono text-gray-600">Show Review: {showReviewSection ? 'YES' : 'NO'}</Text>
//                         </View>
//                     )}

//                     {/* Additional Context */}
//                     {notification.itinerary_title && (
//                         <View className="bg-gray-100 rounded-xl p-4 mb-6">
//                             <View className="flex-row items-center">
//                                 <Ionicons name="map-outline" size={20} color="#6B7280" />
//                                 <Text className="text-gray-600 font-onest ml-2">
//                                     Related to: {notification.itinerary_title}
//                                 </Text>
//                             </View>
//                         </View>
//                     )}

//                     {/* Status */}
//                     {notification.is_read && notification.read_at && (
//                         <View className="flex-row items-center justify-center mb-6">
//                             <Ionicons name="checkmark-circle" size={16} color="#10B981" />
//                             <Text className="text-gray-400 font-onest text-sm ml-1">
//                                 Read on {new Date(notification.read_at).toLocaleDateString()}
//                             </Text>
//                         </View>
//                     )}

//                     {/* Review Section */}
//                     {showReviewSection && (
//                         <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
//                             <View className="items-center mb-4">
//                                 <Ionicons name="star" size={32} color="#FCD34D" />
//                                 <Text className="text-xl font-onest-bold text-gray-800 mt-2">
//                                     {reviewSubmitted ? 'Your Review' : 'Rate Your Experience'}
//                                 </Text>
//                                 <Text className="text-gray-500 font-onest text-sm text-center mt-1">
//                                     {reviewSubmitted
//                                         ? 'Thank you for your feedback!'
//                                         : 'Help others by sharing your experience'}
//                                 </Text>
//                             </View>

//                             {/* Star Rating */}
//                             {renderStarRating()}

//                             {/* Review Text */}
//                             <View className="mb-4">
//                                 <Text className="text-gray-700 font-onest-semibold mb-2">
//                                     Your Review
//                                 </Text>
//                                 <TextInput
//                                     className="bg-gray-50 rounded-xl p-4 font-onest text-gray-800 min-h-[120px]"
//                                     placeholder="Share your thoughts about this experience..."
//                                     placeholderTextColor="#9CA3AF"
//                                     multiline
//                                     numberOfLines={5}
//                                     textAlignVertical="top"
//                                     value={reviewComment}
//                                     onChangeText={setReviewComment}
//                                     editable={!reviewSubmitted}
//                                     style={{
//                                         borderWidth: 1,
//                                         borderColor: '#E5E7EB'
//                                     }}
//                                 />
//                                 <Text className="text-gray-400 font-onest text-xs mt-1">
//                                     Minimum 10 characters
//                                 </Text>
//                             </View>

//                             {/* Submit Button */}
//                             {!reviewSubmitted && (
//                                 <TouchableOpacity
//                                     onPress={handleSubmitReview}
//                                     disabled={submittingReview}
//                                     className="bg-primary rounded-full py-4 items-center"
//                                     style={{
//                                         shadowColor: '#4F46E5',
//                                         shadowOffset: { width: 0, height: 4 },
//                                         shadowOpacity: 0.2,
//                                         shadowRadius: 8,
//                                         elevation: 5,
//                                     }}
//                                 >
//                                     {submittingReview ? (
//                                         <ActivityIndicator size="small" color="white" />
//                                     ) : (
//                                         <Text className="text-white font-onest-semibold text-base">
//                                             Submit Review
//                                         </Text>
//                                     )}
//                                 </TouchableOpacity>
//                             )}

//                             {reviewSubmitted && (
//                                 <View className="bg-green-50 rounded-xl p-4 flex-row items-center">
//                                     <Ionicons name="checkmark-circle" size={24} color="#10B981" />
//                                     <Text className="text-green-700 font-onest ml-2 flex-1">
//                                         Your review has been submitted successfully!
//                                     </Text>
//                                 </View>
//                             )}
//                         </View>
//                     )}
//                 </View>

//                 {/* View Details Button */}
//                 {hasRelatedContent && (
//                     <View className="px-6 pb-8">
//                         <TouchableOpacity
//                             onPress={handleViewDetails}
//                             className="bg-primary rounded-full py-4 items-center"
//                             style={{
//                                 shadowColor: '#4F46E5',
//                                 shadowOffset: { width: 0, height: 4 },
//                                 shadowOpacity: 0.2,
//                                 shadowRadius: 8,
//                                 elevation: 5,
//                             }}
//                         >
//                             <Text className="text-white font-onest-semibold text-base">
//                                 View Experience Details
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 )}
//             </ScrollView>
//         </View>
//     );
// };

// export default NotificationDetailScreen;