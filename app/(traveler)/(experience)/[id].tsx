import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Platform, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvailabilityCalendar from '../../../components/AvailablityCalendar';
import AnimatedHeartButton from '../../../components/SaveButton'; // Adjust the import path as needed
import API_URL from '../../../constants/api';
import { useAuth } from '../../../contexts/AuthContext'; // Add this import
import { ItineraryItem } from '../../../types/itineraryTypes';
type Experience = {
    id: number;
    title: string;
    description: string;
    price: string;
    unit: string;
    destination_name: string;
    location: string;
    tags: string[];
    images: string[];
    is_saved?: boolean; // Add this field
    destination: {
        destination_id: number;
        name: string;
        city: string;
        longitude: number;
        latitude: number;
        description: string;
    };
};

type Review = {
    id: number;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    date: string;
    helpful: number;
};

export default function ExperienceDetail() {
    const router = useRouter();
    const { user } = useAuth(); // Get user from context
    const { id, tripStartDate: paramTripStart, tripEndDate: paramTripEnd } = useLocalSearchParams();

    const experienceId = Number(id);

    const [experience, setExperience] = useState<Experience | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    const imageScale = scrollY.interpolate({
        inputRange: [-200, 0], // Increased range for more responsive scaling
        outputRange: [1.5, 1], // Slightly more dramatic zoom effect
        extrapolate: 'clamp'
    });

    // 2. Improved opacity effect for better visual feedback
    const imageOpacity = scrollY.interpolate({
        inputRange: [-200, -50, 0],
        outputRange: [0.7, 0.9, 1],
        extrapolate: 'clamp'
    });
    const imageTranslateY = scrollY.interpolate({
        inputRange: [-200, 0],
        outputRange: [-50, 0], // Adjust this value to fine-tune the positioning
        extrapolate: 'clamp'
    });



    // Dummy reviews data
    const dummyReviews: Review[] = [
        {
            id: 1,
            userName: "Maria Santos",
            rating: 5,
            comment: "Amazing experience! The guide was very knowledgeable and friendly. The views were breathtaking and worth every peso. Highly recommend this to anyone visiting the area!",
            date: "2025-06-15",
            helpful: 12
        },
        {
            id: 2,
            userName: "John Chen",
            rating: 4,
            comment: "Great tour overall. The location is beautiful and the activities were fun. Only minor issue was the timing - we felt a bit rushed at some spots. Still, would definitely recommend!",
            date: "2025-06-10",
            helpful: 8
        },
        {
            id: 3,
            userName: "Ana Reyes",
            rating: 5,
            comment: "Perfect day out! Everything was well organized from start to finish. The local insights shared by our guide made the experience even more special. Don't forget to bring your camera!",
            date: "2025-06-05",
            helpful: 15
        },
        {
            id: 4,
            userName: "Robert Garcia",
            rating: 3,
            comment: "The experience itself was good but felt overpriced for what was offered. The location is nice but can get very crowded. Better to go early in the morning if possible.",
            date: "2025-05-28",
            helpful: 5
        },
        {
            id: 5,
            userName: "Lisa Fernandez",
            rating: 5,
            comment: "Absolutely loved it! This was the highlight of our trip. The staff went above and beyond to make sure everyone had a great time. Worth every penny!",
            date: "2025-05-20",
            helpful: 20
        }
    ];

    const getCurrentDateString = () => new Date().toISOString().split('T')[0];
    const getNextWeekDateString = () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
    };

    const [tripStartDate, setTripStartDate] = useState<string>(
        (paramTripStart as string) || getCurrentDateString()
    );
    const [tripEndDate, setTripEndDate] = useState<string>(
        (paramTripEnd as string) || getNextWeekDateString()
    );
    const [selectedItems, setSelectedItems] = useState<ItineraryItem[]>([]);

    useEffect(() => {
        const fetchExperience = async () => {
            try {
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();
                setExperience(data);

                // Check if experience is saved by the current user
                let userId = user?.user_id;

                if (!userId) {
                    // Fallback to AsyncStorage
                    const userData = await AsyncStorage.getItem('user');
                    if (userData) {
                        try {
                            const userObj = JSON.parse(userData);
                            userId = userObj.user_id;
                        } catch (e) {
                            console.error('Error parsing user data:', e);
                        }
                    }
                }

                if (userId) {
                    const savedResponse = await fetch(`${API_URL}/saved-experiences/check/${experienceId}?user_id=${userId}`);
                    if (savedResponse.ok) {
                        const savedData = await savedResponse.json();
                        setIsSaved(savedData.isSaved);
                    }
                }

                if (data && data.destination) {
                    // console.log('Destination coordinates:', {
                    //     latitude: data.destination.latitude,
                    //     longitude: data.destination.longitude,
                    //     name: data.destination.name
                    // });
                }
            } catch (error) {
                console.error('Error fetching experience data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId, user]);

    const handleSaveForLater = async () => {
        try {
            // Use user from context first, fallback to AsyncStorage
            let userId = user?.user_id;

            if (!userId) {
                // Fallback to AsyncStorage if context user is not available
                const userData = await AsyncStorage.getItem('user');
                if (userData) {
                    try {
                        const userObj = JSON.parse(userData);
                        userId = userObj.user_id;
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                    }
                }
            }

            if (!userId) {
                Alert.alert('Authentication Required', 'Please login to save experiences');
                return;
            }

            // console.log('Saving experience for user:', userId);

            const response = await fetch(`${API_URL}/saved-experiences/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    experience_id: experienceId,
                    user_id: userId // This is now guaranteed to be a number
                })
            });

            if (response.ok) {
                const data = await response.json();
                setIsSaved(data.action === 'saved');

                // Alert.alert(
                //     'Success',
                //     data.action === 'saved'
                //         ? 'Experience saved successfully'
                //         : 'Experience removed from saved list'
                // );
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update saved status');
            }
        } catch (error) {
            console.error('Error saving experience:', error);
            Alert.alert('Error', 'Failed to save experience. Please check your connection.');
        }
    };

    // Also update your useEffect to check if experience is saved when component loads
    useEffect(() => {
        const fetchExperience = async () => {
            try {
                const response = await fetch(`${API_URL}/experience/${experienceId}`);
                const data = await response.json();
                setExperience(data);

                // Check if experience is saved by the current user
                const user_id = await AsyncStorage.getItem('user_id');
                if (user_id) {
                    const savedResponse = await fetch(`${API_URL}/saved-experiences/check/${experienceId}?user_id=${user_id}`);
                    if (savedResponse.ok) {
                        const savedData = await savedResponse.json();
                        setIsSaved(savedData.isSaved);
                    }
                }

                if (data && data.destination) {
                    // console.log('Destination coordinates:', {
                    //     latitude: data.destination.latitude,
                    //     longitude: data.destination.longitude,
                    //     name: data.destination.name
                    // });
                }
            } catch (error) {
                console.error('Error fetching experience data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperience();
    }, [experienceId]);

    const handleShare = async () => {
        try {
            if (experience) {
                const result = await Share.share({
                    message: `Check out this amazing experience: ${experience.title}\n\nPrice: ₱${experience.price} ${experience.unit}\n\nLocation: ${experience.destination?.name || 'N/A'}, ${experience.destination?.city || 'N/A'}`,
                    title: experience.title,
                });

                if (result.action === Share.sharedAction) {
                    if (result.activityType) {
                        // Shared with activity type of result.activityType
                    } else {
                        // Shared
                    }
                } else if (result.action === Share.dismissedAction) {
                    // Dismissed
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to share');
        }
    };

    const handleOpenMap = async () => {
        if (!experience?.destination) {
            Alert.alert('Error', 'Location not available');
            return;
        }

        const { latitude, longitude, name } = experience.destination;
        const label = encodeURIComponent(`${experience.title} - ${name}`);

        let url = '';

        if (Platform.OS === 'ios') {
            url = `maps:0,0?q=${label}@${latitude},${longitude}`;
        } else {
            url = `geo:0,0?q=${latitude},${longitude}(${label})`;
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
                await Linking.openURL(webUrl);
            }
        } catch (error) {
            console.error('Error opening map:', error);
            Alert.alert('Error', 'Unable to open map application');
        }
    };

    const handleTimeSlotSelect = (item: ItineraryItem) => {
        setSelectedItems(prev => [...prev, item]);
    };

    const handleTimeSlotDeselect = (item: ItineraryItem) => {
        setSelectedItems(prev => prev.filter(selected =>
            !(selected.experience_id === item.experience_id &&
                selected.day_number === item.day_number &&
                selected.start_time === item.start_time &&
                selected.end_time === item.end_time)
        ));
    };

    const getFormattedImageUrl = (imageUrl: string) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${API_URL}${formattedPath}`;
    };

    const renderStars = (rating: number) => {
        return (
            <View className="flex-row">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= rating ? "star" : "star-outline"}
                        size={16}
                        color={star <= rating ? "#FDB022" : "#D1D5DB"}
                    />
                ))}
            </View>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const averageRating = dummyReviews.reduce((acc, review) => acc + review.rating, 0) / dummyReviews.length;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#1f2937" />
                <Text className="mt-4 text-gray-600 font-onest">Loading experience...</Text>
            </SafeAreaView>
        );
    }

    if (!experience) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text className="text-red-500 font-onest-medium text-lg mt-4">Experience not found</Text>
                <Text className="text-gray-400 font-onest text-center mt-2 px-8">
                    The experience you're looking for doesn't exist or has been removed.
                </Text>
                <TouchableOpacity
                    className="mt-6 bg-primary rounded-full px-8 py-3"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-onest-medium">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView className="flex-1"

                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16} // This is good for smooth animation
                bounces={true} // Make sure this is enabled for pull-to-refresh effect
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false } // 
                )}>

                <View className="relative">
                    <View className="w-full h-80 overflow-hidden bg-gray-200">
                        {experience.images && experience.images.length > 0 && !imageError ? (
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    transform: [
                                        { scale: imageScale },
                                        { translateY: imageTranslateY }
                                    ],
                                    opacity: imageOpacity,
                                }}
                            >
                                <Image
                                    source={{ uri: getFormattedImageUrl(experience.images[0])! }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                    onError={() => setImageError(true)}
                                />
                            </Animated.View>
                        ) : (
                            <View className="w-full h-full justify-center items-center bg-gray-100">
                                <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                                <Text className="text-gray-500 font-onest mt-2">
                                    {imageError ? 'Failed to load image' : 'No image available'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {/* Content Card */}
                <View className='px-6 pt-2 -mt-5 rounded-3xl bg-white'>
                    {/* Title and Location */}
                    <View className="mb-4">
                        <View className='flex-row justify-between'>
                            <Text className="text-2xl font-onest-semibold mt-4 w-9/12 text-gray-800">
                                {experience.title}
                            </Text>
                            <Text className="my-4 text-gray-600 font-onest">{experience.unit}</Text>
                        </View>

                        <Text className="text-lg font-onest-bold text-primary my-2">
                            {experience.price ? `₱${experience.price}` : 'Price not available'}
                        </Text>
                    </View>

                    {/* Tab Navigation */}
                    <View className="flex-row border-b border-gray-200 mt-4">
                        <TouchableOpacity
                            className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-primary' : ''}`}
                            onPress={() => setActiveTab('details')}
                        >
                            <Text className={`font-onest-medium ${activeTab === 'details' ? 'text-primary' : 'text-gray-600'}`}>
                                Details
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`px-4 py-2 ${activeTab === 'availability' ? 'border-b-2 border-primary' : ''}`}
                            onPress={() => setActiveTab('availability')}
                        >
                            <Text className={`font-onest-medium ${activeTab === 'availability' ? 'text-primary' : 'text-gray-600'}`}>
                                Availability
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content based on active tab */}
                    {activeTab === 'details' ? (
                        <View className="py-4">
                            {/* Tags */}
                            {experience.tags && experience.tags.length > 0 && (
                                <View className="flex-row flex-wrap mb-4">
                                    {experience.tags.map((tag) => (
                                        <View key={tag} className="bg-indigo-50 px-3 py-1 rounded-full mr-2 mb-2">
                                            <Text className="text-primary text-xs font-onest-medium">{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Description */}
                            <Text className="text-lg font-onest-semibold mt-4 mb-2 text-gray-800">Description</Text>
                            <Text className="text-gray-600 font-onest">
                                {expanded
                                    ? experience.description
                                    : (experience.description?.length > 150
                                        ? `${experience.description.substring(0, 150)}...`
                                        : experience.description)
                                }
                            </Text>

                            {experience.description?.length > 150 && (
                                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                                    <Text className="text-primary mt-2 font-onest-medium">
                                        {expanded ? 'Read Less' : 'Read More'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Location Information */}
                            {experience.destination && (
                                <View className="mt-6">
                                    <Text className="text-lg font-onest-semibold mb-2 text-gray-800">Location</Text>
                                    <View className="bg-gray-50 rounded-xl p-4 " >
                                        <View className="flex-row items-start mb-3">
                                            <Ionicons name="location" size={20} color="#4F46E5" />
                                            <View className="ml-3 flex-1">
                                                <Text className="font-onest-semibold text-gray-800 mb-1">
                                                    {experience.destination.name}
                                                </Text>
                                                <Text className="text-gray-400 font-onest">
                                                    {experience.destination.city}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* {experience.destination.description && experience.destination.description !== experience.destination.name && (
                                            <View className="flex-row items-start ">
                                                <Ionicons name="compass" size={20} color="#9CA3AF" />
                                                <Text className="ml-3 text-gray-600 font-onest flex-1">
                                                    {experience.destination.description}
                                                </Text>
                                            </View>
                                        )} */}
                                    </View>
                                </View>
                            )}

                            {/* Reviews Section */}
                            <View className="mt-6">
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-lg font-onest-semibold text-gray-800">Reviews</Text>
                                    <View className="flex-row items-center">
                                        {renderStars(Math.round(averageRating))}
                                        <Text className="ml-2 text-gray-600 font-onest-medium">
                                            {averageRating.toFixed(1)} ({dummyReviews.length})
                                        </Text>
                                    </View>
                                </View>

                                {/* Review Cards */}
                                {dummyReviews.slice(0, showAllReviews ? dummyReviews.length : 2).map((review) => (
                                    <View key={review.id} className="bg-gray-50 rounded-xl p-4 mb-3">
                                        <View className="flex-row items-start justify-between mb-2">
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                                                        <Text className="text-white font-onest-semibold text-lg">
                                                            {review.userName.charAt(0)}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text className="font-onest-semibold text-gray-800">
                                                            {review.userName}
                                                        </Text>
                                                        <View className="flex-row items-center">
                                                            {renderStars(review.rating)}
                                                            <Text className="ml-2 text-gray-500 text-xs font-onest">
                                                                {formatDate(review.date)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        <Text className="text-gray-600 font-onest mt-2">
                                            {review.comment}
                                        </Text>

                                        <TouchableOpacity className="flex-row items-center mt-3">
                                            <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
                                            <Text className="ml-1 text-gray-500 text-sm font-onest">
                                                {review.helpful} found this helpful
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {/* View All Reviews Button */}
                                {dummyReviews.length > 2 && (
                                    <TouchableOpacity
                                        className="mt-4 py-3 border border-gray-300 rounded-xl items-center flex-row justify-center"
                                        onPress={() => setShowAllReviews(!showAllReviews)}
                                    >
                                        <Text className="text-gray-700 font-onest-medium">
                                            {showAllReviews ? 'Show Less Reviews' : `View All ${dummyReviews.length} Reviews`}
                                        </Text>
                                        <Ionicons
                                            name={showAllReviews ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color="#374151"
                                            style={{ marginLeft: 8 }}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Location Button */}
                            <TouchableOpacity
                                className={`mt-6 py-4 rounded-2xl items-center flex-row justify-center ${experience.destination ? 'bg-primary' : 'bg-gray-400'
                                    }`}
                                onPress={handleOpenMap}
                                disabled={!experience.destination}
                                style={experience.destination ? {
                                    shadowColor: '#4F46E5',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 6,
                                } : {}}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="map-outline"
                                    size={20}
                                    color={experience.destination ? "#E5E7EB" : "#9CA3AF"}
                                />
                                <Text className={`font-onest-semibold ml-3 ${experience.destination ? 'text-gray-200' : 'text-gray-500'
                                    }`}>
                                    {experience.destination
                                        ? 'Open Location on Map'
                                        : 'Location Not Available'
                                    }
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="py-4">
                            <AvailabilityCalendar
                                experienceId={experienceId}
                                tripStartDate={tripStartDate}
                                tripEndDate={tripEndDate}
                                selectedItems={selectedItems}
                                onTimeSlotSelect={handleTimeSlotSelect}
                                onTimeSlotDeselect={handleTimeSlotDeselect}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button (FAB) for Save */}
            <View
                className="absolute bottom-24 right-6"
                style={{
                    shadowColor: isSaved ? '#EF4444' : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSaved ? 0.3 : 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                    backgroundColor: isSaved ? '#EF4444' : '#FFFFFF',
                    borderRadius: 30,
                }}
            >
                <AnimatedHeartButton
                    isSaved={isSaved}
                    onPress={handleSaveForLater}
                    size={28}
                />
            </View>
        </View>
    );
}