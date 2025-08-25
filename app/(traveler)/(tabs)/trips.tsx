import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Calendar from '../../../assets/icons/calendar.svg';
import Globe from '../../../assets/icons/globe.svg';
import API_URL from '../../../constants/api';

// Updated types to match your API response
interface ItineraryItem {
    item_id: number;
    experience_id: number;
    day_number: number;
    start_time: string;
    end_time: string;
    custom_note: string;
    created_at: string;
    updated_at: string;
    experience_name: string;
    experience_description: string;
    destination_name?: string;
    destination_city?: string;
    images?: string[];
    primary_image?: string;
}

interface Itinerary {
    itinerary_id: number;
    traveler_id: number;
    start_date: string;
    end_date: string;
    title: string;
    notes: string;
    created_at: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    items: ItineraryItem[];
}

interface ApiResponse {
    itineraries: Itinerary[];
}

const ITEMS_PER_PAGE = 5;

export default function TripScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    const [loading, setLoading] = useState(true);
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
    const [userName, setUserName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchItineraries();
        fetchUserData();
    }, []);

    // Reset to first page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const fetchUserData = async () => {
        try {
            const user = await AsyncStorage.getItem("user");
            if (user) {
                const parsedUser = JSON.parse(user);
                setUserName(parsedUser.first_name);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchItineraries = async () => {
        setLoading(true);
        try {
            // Get user ID and token
            const user = await AsyncStorage.getItem("user");
            const token = await AsyncStorage.getItem("token");

            if (!user || !token) {
                console.error("User or token not found");
                setLoading(false);
                return;
            }

            const parsedUser = JSON.parse(user);
            const travelerId = parsedUser.user_id;

            // Fetch user's itineraries
            const response = await fetch(`${API_URL}/itinerary/traveler/${travelerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Handle 404 as a valid response (user has no itineraries)
            if (response.status === 404) {
                console.log("No itineraries found for user - this is normal for new users");
                setItineraries([]);
                setLoading(false);
                return;
            }

            // Handle other error statuses
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();
            setItineraries(data.itineraries || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching itineraries:", error);
            setLoading(false);
            setItineraries([]);
        }
    };

    const filteredItineraries = itineraries.filter(item => item.status === activeTab);

    // Calculate pagination
    const totalPages = Math.ceil(filteredItineraries.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItineraries = filteredItineraries.slice(startIndex, endIndex);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchItineraries();
            await fetchUserData();
            setCurrentPage(1);
        } finally {
            setRefreshing(false);
        }
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const startMonth = start.toLocaleString('default', { month: 'short' });
        const endMonth = end.toLocaleString('default', { month: 'short' });

        if (startMonth === endMonth) {
            return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        } else {
            return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
        }
    };

    // 🆕 Enhanced status display with emojis and better descriptions
    const getStatusDisplay = (status: 'upcoming' | 'ongoing' | 'completed') => {
        const statusConfig = {
            upcoming: {
                emoji: '📅',
                text: 'Upcoming',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-600'
            },
            ongoing: {
                emoji: '✈️',
                text: 'Ongoing',
                bgColor: 'bg-green-50',
                textColor: 'text-green-600'
            },
            completed: {
                emoji: '✅',
                text: 'Completed',
                bgColor: 'bg-gray-50',
                textColor: 'text-gray-600'
            }
        };

        const config = statusConfig[status];

        return (
            <View className={`px-3 py-1.5 rounded-full ml-3 ${config.bgColor}`}>
                <View className="flex-row items-center">

                    <Text className={`text-xs font-onest-medium ${config.textColor}`}>
                        {config.text}
                    </Text>
                </View>
            </View>
        );
    };

    // 🆕 Smart preview text based on status and current time
    const getSmartPreviewText = (itinerary: Itinerary) => {
        if (!itinerary.items || itinerary.items.length === 0) {
            return { title: 'No activities planned', subtitle: '' };
        }

        const now = new Date();
        const sortedItems = [...itinerary.items].sort((a, b) => {
            if (a.day_number !== b.day_number) {
                return a.day_number - b.day_number;
            }
            return a.start_time.localeCompare(b.start_time);
        });

        switch (itinerary.status) {
            case 'upcoming':
                const firstActivity = sortedItems[0];
                return {
                    title: `Starts with: ${firstActivity.experience_name}`,
                    subtitle: `Day ${firstActivity.day_number} • ${formatTimeRange(firstActivity.start_time, firstActivity.end_time)}`
                };

            case 'ongoing':
                // Find current or next activity based on current time
                const startDate = new Date(itinerary.start_date);
                const currentDay = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Try to find current activity
                const currentActivity = sortedItems.find(item => {
                    if (item.day_number !== currentDay) return false;

                    const itemStartTime = new Date();
                    const [startHours, startMinutes] = item.start_time.split(':');
                    itemStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                    const itemEndTime = new Date();
                    const [endHours, endMinutes] = item.end_time.split(':');
                    itemEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

                    return now >= itemStartTime && now <= itemEndTime;
                });

                if (currentActivity) {
                    return {
                        title: `Currently: ${currentActivity.experience_name}`,
                        subtitle: `Day ${currentActivity.day_number} • Ends at ${formatTime(currentActivity.end_time)}`
                    };
                }

                // Find next activity
                const nextActivity = sortedItems.find(item => {
                    if (item.day_number < currentDay) return false;
                    if (item.day_number > currentDay) return true;

                    const itemStartTime = new Date();
                    const [startHours, startMinutes] = item.start_time.split(':');
                    itemStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

                    return now < itemStartTime;
                });

                if (nextActivity) {
                    return {
                        title: `Next: ${nextActivity.experience_name}`,
                        subtitle: `Day ${nextActivity.day_number} • ${formatTimeRange(nextActivity.start_time, nextActivity.end_time)}`
                    };
                }

                return {
                    title: 'Trip in progress',
                    subtitle: 'All activities completed'
                };

            case 'completed':
                const lastActivity = sortedItems[sortedItems.length - 1];
                return {
                    title: `Ended with: ${lastActivity.experience_name}`,
                    subtitle: `Day ${lastActivity.day_number} • ${formatTimeRange(lastActivity.start_time, lastActivity.end_time)}`
                };

            default:
                return {
                    title: `Next: ${sortedItems[0].experience_name}`,
                    subtitle: `Day ${sortedItems[0].day_number} • ${formatTimeRange(sortedItems[0].start_time, sortedItems[0].end_time)}`
                };
        }
    };

    // 🆕 Enhanced time formatting function
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Updated to work with items and use actual API images
    const getItineraryImage = (itinerary: Itinerary) => {
        // Use the primary_image from the first item if available
        if (itinerary.items && itinerary.items.length > 0) {
            const firstItem = itinerary.items[0];
            if (firstItem.primary_image) {
                // Construct full URL for your API
                return { uri: `${API_URL}${firstItem.primary_image}` };
            }
            // If no primary_image, check if images array exists and has items
            if (firstItem.images && firstItem.images.length > 0) {
                return { uri: `${API_URL}${firstItem.images[0]}` };
            }
        }

        // Fallback to default image
        return require('../../../assets/images/balay.jpg');
    };

    // Updated to work with items and use actual destination data from API
    const getItineraryDestination = (itinerary: Itinerary) => {
        if (itinerary.items && itinerary.items.length > 0) {
            // Get unique cities from the items
            const cities = new Set(
                itinerary.items
                    .map(item => item.destination_city)
                    .filter(city => city) // Remove null/undefined values
            );

            if (cities.size === 1) {
                return Array.from(cities)[0];
            } else if (cities.size > 1) {
                return Array.from(cities).slice(0, 2).join(' & ') + (cities.size > 2 ? ' +' : '');
            }
        }

        return 'Philippines'; // Default fallback
    };

    // Helper function to get unique experiences count
    const getExperiencesCount = (itinerary: Itinerary) => {
        if (!itinerary.items) return 0;

        // Count unique experiences
        const uniqueExperiences = new Set(itinerary.items.map(item => item.experience_id));
        return uniqueExperiences.size;
    };

    // Helper function to format time display
    const formatTimeRange = (startTime: string, endTime: string) => {
        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    // Empty state component for better UX
    const renderEmptyState = () => {
        const emptyMessages = {
            upcoming: {
                title: "No upcoming trips",
                subtitle: "Plan your next adventure!",
                showCreateButton: true
            },
            ongoing: {
                title: "No active trips",
                subtitle: "You don't have any trips in progress",
                showCreateButton: false
            },
            completed: {
                title: "No completed trips",
                subtitle: "Your adventure history will appear here",
                showCreateButton: false
            }
        };

        const config = emptyMessages[activeTab];

        return (
            <View className="py-16 items-center">

                <Text className="text-center text-gray-700 font-onest-semibold text-lg">
                    {config.title}
                </Text>
                <Text className="text-center text-gray-500 px-8 mt-2 font-onest text-sm leading-5">
                    {config.subtitle}
                </Text>

                {config.showCreateButton && (
                    <TouchableOpacity
                        className="mt-8 bg-primary rounded-full px-8 py-4 flex-row items-center"
                        style={{
                            shadowColor: '#4F46E5',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 6,
                        }}
                        onPress={() => router.push('/(createItinerary)/selectionScreen')}
                    >
                        <Ionicons name="add-circle-outline" size={20} color="#E5E7EB" />
                        <Text className="text-gray-300 font-onest-medium ml-2">Create New Trip</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">Loading your trips...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="w-full h-full">
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#1f2937']}
                            tintColor={'#1f2937'}
                        />
                    }
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 140 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View className="p-6">
                        <Text className="text-3xl font-onest-semibold text-normal">My Trips</Text>
                        <Text className="text-gray-400 font-onest">Manage your travel itineraries</Text>
                    </View>
                    {/* Tab Navigation with improved shadow */}
                    <View className="mx-6 mb-6">
                        <View
                            className="flex-row -mx-2"

                        >
                            {['upcoming', 'ongoing', 'completed'].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveTab(tab as 'upcoming' | 'ongoing' | 'completed')}
                                    className={`flex-1 py-2 px-6 mr-3 rounded-full ${activeTab === tab ? 'bg-gray-800' : 'bg-white'}`}

                                >
                                    <Text
                                        className={`text-center font-onest-medium text-base capitalize ${activeTab === tab ? 'text-white' : 'text-gray-500'
                                            }`}
                                    >
                                        {tab}
                                    </Text>
                                    {/* <TouchableOpacity
                                                        key={index}
                                                        onPress={() => setSelectedCategory(category)}
                                                        className={`px-6 py-2 rounded-full mr-3 mt-4 ${isSelected ? 'bg-gray-800' : 'bg-white'}`}
                                                      >
                                                        <Text className={`text-base font-onest-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                                          {category}
                                                        </Text>
                                                      </TouchableOpacity> */}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Itineraries List */}
                    <View className="px-6">
                        {filteredItineraries.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <>
                                {paginatedItineraries.map((itinerary, index) => {
                                    const previewInfo = getSmartPreviewText(itinerary);
                                    return (
                                        <TouchableOpacity
                                            key={itinerary.itinerary_id}
                                            onPress={() => router.push(`/(itinerary)/${itinerary.itinerary_id}`)}
                                            className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-200"
                                            style={{
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.08,
                                                shadowRadius: 12,
                                                elevation: 4,
                                            }}
                                        >
                                            <Image
                                                source={getItineraryImage(itinerary)}
                                                className="w-full h-44"
                                                resizeMode="cover"
                                            />
                                            <View className="p-5">
                                                <Text className="text-lg font-onest-semibold text-gray-800 mb-2">
                                                    {itinerary.title}
                                                </Text>

                                                <View className="flex-row items-center mb-4">
                                                    <Globe />
                                                    <Text className="text-sm text-gray-600 font-onest ml-2">
                                                        {getItineraryDestination(itinerary)}
                                                    </Text>
                                                </View>

                                                <View className="flex-row justify-between items-center mb-4">
                                                    <View className="flex-row items-center flex-1">
                                                        <Calendar />
                                                        <Text className="text-sm text-gray-500 font-onest ml-2 flex-1">
                                                            {formatDateRange(itinerary.start_date, itinerary.end_date)}
                                                        </Text>
                                                    </View>
                                                    {getStatusDisplay(itinerary.status)}
                                                </View>

                                                {/* 🆕 Enhanced smart preview section */}
                                                {itinerary.items && itinerary.items.length > 0 && (
                                                    <View className="pt-4 border-t border-gray-100">
                                                        <Text className="text-sm text-gray-700 font-onest-medium mb-1">
                                                            {previewInfo.title}
                                                        </Text>
                                                        <Text className="text-xs text-gray-500 font-onest">
                                                            {previewInfo.subtitle}
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* Show number of experiences */}
                                                <View className="pt-4 border-t border-gray-100 flex-row justify-between items-center">
                                                    <Text className="text-sm text-gray-500 font-onest">
                                                        {getExperiencesCount(itinerary)} {getExperiencesCount(itinerary) !== 1 ? 'activities' : 'activity'}
                                                    </Text>
                                                    <Text className="text-sm text-primary font-onest-medium">
                                                        View details →
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <View className="mt-6 mb-4">
                                        {/* Results Info */}
                                        <Text className="text-center text-gray-500 text-sm mb-4 font-onest">
                                            Showing {startIndex + 1}-{Math.min(endIndex, filteredItineraries.length)} of {filteredItineraries.length} trips
                                        </Text>

                                        {/* Pagination Buttons */}
                                        <View className="flex-row justify-center items-center">
                                            {/* Previous Button */}
                                            <TouchableOpacity
                                                onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-2 mr-2 rounded-md ${currentPage === 1 ? 'bg-gray-200' : 'bg-gray-800'}`}
                                            >
                                                <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#9CA3AF' : '#FFFFFF'} />
                                            </TouchableOpacity>

                                            {/* Page Numbers */}
                                            {getPageNumbers().map((page, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => typeof page === 'number' && setCurrentPage(page)}
                                                    disabled={page === '...'}
                                                    className={`px-3 py-2 mx-1 rounded-md ${page === currentPage
                                                        ? 'bg-primary'
                                                        : page === '...'
                                                            ? 'bg-transparent'
                                                            : 'bg-white border border-gray-300'
                                                        }`}
                                                >
                                                    <Text className={`font-onest-medium ${page === currentPage
                                                        ? 'text-white'
                                                        : page === '...'
                                                            ? 'text-gray-400'
                                                            : 'text-gray-700'
                                                        }`}>
                                                        {page}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}

                                            {/* Next Button */}
                                            <TouchableOpacity
                                                onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-2 ml-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200' : 'bg-gray-800'}`}
                                            >
                                                <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>

                {/* Floating Action Button with improved shadow */}
                <TouchableOpacity
                    className="absolute bottom-[90px] right-6 bg-primary rounded-full p-4 shadow-md flex-row items-center"
                    onPress={() => router.push('/(createItinerary)/selectionScreen')}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="add-circle-outline" size={20} color="#E5E7EB" />
                        <Text className="text-gray-300 font-onest ml-2">Build My Trip</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}