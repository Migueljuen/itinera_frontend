import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    DeviceEventEmitter,

    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_URL from '../../../constants/api';
import { useRefresh } from '../../../contexts/RefreshContext';
import { NotificationEvents } from '../../../utils/notificationEvents';

type NotificationType = 'itinerary' | 'activity' | 'reminder' | 'update' | 'alert';

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
    icon: string;
    icon_color: string;
    action_url: string | null;
    // Additional fields from JOIN
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
                setNotification(response.data.notification);

                // Mark as read if not already read
                if (!response.data.notification.is_read) {
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

            // Update local state
            setNotification(prev => prev ? { ...prev, is_read: true } : null);

            // Trigger badge refresh
            triggerProfileUpdate();

            // Emit event to refresh inbox
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
                                // Emit event to refresh inbox
                                DeviceEventEmitter.emit(NotificationEvents.NOTIFICATIONS_UPDATED);

                                // Trigger badge refresh
                                triggerProfileUpdate();

                                // Navigate back to inbox
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

        if (notification.itinerary_id) {
            router.push(`/(traveler)/(itinerary)/${notification.itinerary_id}`);
        } else if (notification.itinerary_item_id) {
            router.push(`/(traveler)/(itinerary)/activity/${notification.itinerary_item_id}`);
        } else if (notification.experience_id) {
            router.push(`/(traveler)/(experience)/${notification.experience_id}`);
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
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" backgroundColor="#4F7C7E" />
            {/* Header with background extending to top */}
            <View className="bg-primary">
                <SafeAreaView>
                    <View className="px-4 pt-4 pb-6">
                        <View className="flex-row justify-between items-center">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="p-2"
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>

                            <Text className="text-white text-lg font-onest-semibold">Inbox</Text>

                            <TouchableOpacity
                                onPress={handleDelete}
                                disabled={deleting}
                                className="p-2"
                            >
                                {deleting ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="trash-outline" size={24} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Content */}
            <View
                className="flex-1"

            >
                <View className="flex-1 px-6 py-8">
                    {/* Icon */}
                    <View className="items-center mb-6">
                        <View
                            className="w-20 h-20 rounded-full items-center justify-center"
                            style={{ backgroundColor: notification.icon_color }}
                        >
                            <Ionicons
                                name={notification.icon as any}
                                size={40}
                                color="white"
                            />
                        </View>
                    </View>

                    {/* Date/Time */}
                    <Text className="text-gray-400 font-onest text-center text-sm mb-4">
                        {formatDateTime(notification.created_at)}
                    </Text>

                    {/* Title */}
                    <Text className="text-2xl font-onest-bold text-center text-gray-800 mb-6">
                        {notification.title}
                    </Text>

                    {/* Description */}
                    <Text className="text-gray-600 font-onest text-base leading-6 text-center mb-8">
                        {notification.description}
                    </Text>

                    {/* Additional Context */}
                    {notification.itinerary_title && (
                        <View className="bg-gray-100 rounded-xl p-4 mb-6">
                            <View className="flex-row items-center">
                                <Ionicons name="map-outline" size={20} color="#6B7280" />
                                <Text className="text-gray-600 font-onest ml-2">
                                    Related to: {notification.itinerary_title}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Status */}
                    {notification.is_read && notification.read_at && (
                        <View className="flex-row items-center justify-center mb-6">
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text className="text-gray-400 font-onest text-sm ml-1">
                                Read on {new Date(notification.read_at).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* View Details Button */}
                {hasRelatedContent && (
                    <View className="px-6 pb-16">
                        <TouchableOpacity
                            onPress={handleViewDetails}
                            className="bg-primary rounded-full py-4 items-center"
                            style={{
                                shadowColor: '#4F46E5',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 5,
                            }}
                        >
                            <Text className="text-white font-onest-semibold text-base">
                                View details
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

export default NotificationDetailScreen;