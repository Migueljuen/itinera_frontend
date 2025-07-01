import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useRefresh } from '../../../contexts/RefreshContext';

type NotificationType = 'itinerary' | 'activity' | 'reminder' | 'update' | 'alert';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    date: string;
    read: boolean;
    icon: string;
    iconColor: string;
    itineraryId?: number;
    activityId?: number;
}

const InboxScreen = () => {
    const router = useRouter();
    const { isRefreshing, refreshData } = useRefresh();
    const [activeFilter, setActiveFilter] = useState('All');

    // Dummy notifications data
    const [notifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'reminder',
            title: 'Upcoming Trip to Palawan',
            description: 'Your adventure starts in 3 days! Don\'t forget to pack your essentials.',
            date: 'Jul 01, 2025',
            read: false,
            icon: 'airplane',
            iconColor: '#3B82F6',
            itineraryId: 1
        },
        {
            id: '2',
            type: 'activity',
            title: 'Island Hopping Tomorrow',
            description: 'Your island hopping tour in Coron starts at 8:00 AM. Meeting point: Coron Town Pier',
            date: 'Jun 30, 2025',
            read: false,
            icon: 'boat-outline',
            iconColor: '#10B981',
            activityId: 1
        },
        {
            id: '3',
            type: 'update',
            title: 'Itinerary Updated',
            description: 'Your Bohol Countryside Tour has been rescheduled to 9:00 AM',
            date: 'Jun 29, 2025',
            read: true,
            icon: 'sync-outline',
            iconColor: '#F59E0B',
            itineraryId: 2
        },
        {
            id: '4',
            type: 'alert',
            title: 'Weather Advisory',
            description: 'Light rain expected during your Chocolate Hills visit. Bring an umbrella!',
            date: 'Jun 28, 2025',
            read: true,
            icon: 'rainy-outline',
            iconColor: '#6366F1',
            itineraryId: 2
        },
        {
            id: '5',
            type: 'reminder',
            title: 'Check-in Reminder',
            description: 'Online check-in is now open for your flight to Siargao (PR 2815)',
            date: 'Jun 27, 2025',
            read: true,
            icon: 'checkmark-circle-outline',
            iconColor: '#10B981',
            itineraryId: 3
        },
        {
            id: '6',
            type: 'activity',
            title: 'Surfing Lesson Confirmed',
            description: 'Your beginner surfing lesson at Cloud 9 is confirmed for Day 2 at 7:00 AM',
            date: 'Jun 26, 2025',
            read: true,
            icon: 'sunny-outline',
            iconColor: '#F59E0B',
            activityId: 2
        },
        {
            id: '7',
            type: 'update',
            title: 'New Experience Added',
            description: 'Firefly Watching has been added to your Bohol itinerary',
            date: 'Jun 25, 2025',
            read: true,
            icon: 'add-circle-outline',
            iconColor: '#4F46E5',
            itineraryId: 2
        },
        {
            id: '8',
            type: 'reminder',
            title: 'Trip Completed',
            description: 'How was your Manila Food Walk? Share your experience!',
            date: 'Jun 20, 2025',
            read: true,
            icon: 'star-outline',
            iconColor: '#EF4444',
            itineraryId: 4
        }
    ]);

    const filters = ['All', 'Itineraries', 'Activities', 'Updates'];

    const filteredNotifications = notifications.filter(notification => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Itineraries') return notification.type === 'reminder' || notification.type === 'itinerary';
        if (activeFilter === 'Activities') return notification.type === 'activity';
        if (activeFilter === 'Updates') return notification.type === 'update' || notification.type === 'alert';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationPress = (notification: Notification) => {
        // Navigate based on notification type
        if (notification.itineraryId) {
            router.push(`/(traveler)/(itinerary)/${notification.itineraryId}`);
        } else if (notification.activityId) {
            router.push(`/(traveler)/(activity)/${notification.activityId}`);
        }
    };

    const handleRefresh = async () => {
        await refreshData();
        // Refresh notifications when backend is ready
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="p-6">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-3xl font-onest-semibold text-gray-800">Inbox</Text>
                        <Text className="text-gray-400 font-onest">
                            {unreadCount > 0 ? `${unreadCount} new notifications` : 'All caught up'}
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <View className="bg-indigo-50 rounded-full px-3 py-1">
                            <Text className="text-primary font-onest-semibold text-sm">{unreadCount}</Text>
                        </View>
                    )}
                </View>

                {/* Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row -mx-2"
                >
                    {filters.map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                className={`px-6 py-2 rounded-full mr-3 ${isActive ? 'bg-gray-800' : 'bg-white'
                                    }`}
                            >
                                <Text className={`font-onest-medium ${isActive ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Notifications List */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={['#1f2937']}
                        tintColor={'#1f2937'}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {filteredNotifications.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Ionicons name="mail-open-outline" size={64} color="#D1D5DB" />
                        <Text className="text-gray-400 font-onest-medium text-lg mt-4">No notifications</Text>
                        <Text className="text-gray-400 font-onest text-sm mt-2">Check back later for updates</Text>
                    </View>
                ) : (
                    <View className="px-4 pt-4">
                        {filteredNotifications.map((notification, index) => {
                            const showDateHeader = index === 0 ||
                                formatDate(notification.date) !== formatDate(filteredNotifications[index - 1].date);

                            return (
                                <View key={notification.id}>
                                    {showDateHeader && (
                                        <Text className="text-gray-500 font-onest-medium text-sm mb-3 mt-2 px-2">
                                            {formatDate(notification.date)}
                                        </Text>
                                    )}

                                    <TouchableOpacity
                                        onPress={() => handleNotificationPress(notification)}
                                        className={`bg-white rounded-2xl p-4 mb-3 ${!notification.read ? 'border-l-4 border-primary' : ''
                                            }`}
                                        style={{
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.06,
                                            shadowRadius: 8,
                                            elevation: 3,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View className="flex-row">
                                            {/* Icon */}
                                            <View
                                                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                                                style={{ backgroundColor: `${notification.iconColor}20` }}
                                            >
                                                <Ionicons
                                                    name={notification.icon as any}
                                                    size={24}
                                                    color={notification.iconColor}
                                                />
                                            </View>

                                            {/* Content */}
                                            <View className="flex-1">
                                                <View className="flex-row justify-between items-start mb-1">
                                                    <Text className={`font-onest-semibold text-base flex-1 mr-2 ${!notification.read ? 'text-gray-800' : 'text-gray-600'
                                                        }`}>
                                                        {notification.title}
                                                    </Text>
                                                    {!notification.read && (
                                                        <View className="w-2 h-2 bg-primary rounded-full mt-2" />
                                                    )}
                                                </View>
                                                <Text className="text-gray-500 font-onest text-sm leading-5" numberOfLines={2}>
                                                    {notification.description}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Mark All as Read FAB */}
            {unreadCount > 0 && (
                <TouchableOpacity
                    className="absolute bottom-6 right-6 bg-primary rounded-full px-6 py-3 flex-row items-center"
                    style={{
                        shadowColor: '#4F46E5',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                    onPress={() => {
                        // Mark all as read functionality
                        console.log('Mark all as read');
                    }}
                >
                    <Ionicons name="checkmark-done" size={20} color="#E5E7EB" />
                    <Text className="ml-2 text-gray-200 font-onest-medium">Mark all read</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

export default InboxScreen;