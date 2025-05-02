import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
// Note: You'll need to install the Material Symbols font in your app
// https://fonts.google.com/icons
// And make sure it's linked in your project

// Define types for our data
type SavedExperience = {
    id: string;
    title: string;
    location: string;
    image: any; // For simplicity, we're using any for image imports
    category: string;
    rating: number;
    price: string;
    savedAt: string;
};

const SavedScreen = () => {
    const router = useRouter();
    const bottom = useBottomTabBarHeight();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Static data for saved experiences
    const savedExperiences: SavedExperience[] = [
        {
            id: '1',
            title: 'Golden Gate Bridge Tour',
            location: 'San Francisco, USA',
            image: require('../../assets/images/balay.jpg'), // Replace with your images
            category: 'sightseeing',
            rating: 4.8,
            price: '₱ 49',
            savedAt: '2 days ago'
        },
        {
            id: '2',
            title: 'Napa Valley Wine Tasting',
            location: 'Napa Valley, USA',
            image: require('../../assets/images/ruins.jpg'),
            category: 'food',
            rating: 4.9,
            price: '₱ 89',
            savedAt: '1 week ago'
        },
        {
            id: '3',
            title: 'Alcatraz Island Visit',
            location: 'San Francisco, USA',
            image: require('../../assets/images/siargao.jpg'),
            category: 'historical',
            rating: 4.7,
            price: '₱ 39.99',
            savedAt: '2 weeks ago'
        },
        {
            id: '4',
            title: 'Muir Woods Trek',
            location: 'Mill Valley, USA',
            image: require('../../assets/images/silay.jpg'),
            category: 'adventure',
            rating: 4.6,
            price: '₱ 29',
            savedAt: '3 weeks ago'
        }
    ];

    // Categories for filtering
    const categories = [
        { id: 'all', name: 'All' },
        { id: 'sightseeing', name: 'Sightseeing' },
        { id: 'food', name: 'Food & Drinks' },
        { id: 'historical', name: 'Historical' },
        { id: 'adventure', name: 'Adventure' }
    ];

    // Filter experiences based on selected category
    const filteredExperiences = activeCategory === 'all'
        ? savedExperiences
        : savedExperiences.filter(exp => exp.category === activeCategory);

    const refreshData = () => {
        setIsRefreshing(true);
        // Simulate data fetch
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    // Render stars based on rating using Material Symbols
    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <View className="flex-row items-center">
                {[...Array(5)].map((_, i) => (
                    <Text
                        key={i}
                        className={`material-symbols-outlined text-sm ${i < fullStars
                            ? 'text-yellow-500'
                            : i === fullStars && hasHalfStar
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                    >
                        {i < fullStars
                            ? 'star'
                            : i === fullStars && hasHalfStar
                                ? 'star_half'
                                : 'star'
                        }
                    </Text>
                ))}
                <Text className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="w-full h-full">
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refreshData}
                            colors={['#1f2937']}
                            tintColor={'#1f2937'}
                        />
                    }
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    <View className="flex items-start p-6">
                        <Text className="text-3xl font-onest-semibold text-gray-800">Saved</Text>
                        <Text className="text-gray-400 font-onest">Your favorite experiences</Text>
                    </View>

                    {/* Category Navigation */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="px-4 mb-4"
                    >
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                onPress={() => setActiveCategory(category.id)}
                                className={`py-2 px-4 rounded-full mr-2 ${activeCategory === category.id ? 'bg-gray-800' : 'bg-white border border-gray-200'
                                    }`}
                            >
                                <Text
                                    className={`text-center font-onest-medium ${activeCategory === category.id ? 'text-white' : 'text-gray-500'
                                        }`}
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Experiences List */}
                    <View className="px-4 py-2">
                        {filteredExperiences.length === 0 ? (
                            <View className="py-12 items-center">
                                <Image
                                    source={require('../../assets/images/google.png')} // Replace with your image
                                    className="w-32 h-32 opacity-60 mb-4"
                                    resizeMode="contain"
                                />
                                <Text className="text-center text-gray-500 font-onest-medium text-lg">
                                    No saved experiences
                                </Text>
                                <Text className="text-center text-gray-400 px-8 mt-2 font-onest">
                                    Experiences you save will appear here for easy access
                                </Text>
                                <TouchableOpacity
                                    className="mt-6 bg-primary rounded-full px-6 py-3"
                                    onPress={() => router.push('/(main)/explore')}
                                >
                                    <Text className="text-white font-onest-medium">Explore Experiences</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            filteredExperiences.map((experience) => (
                                <TouchableOpacity
                                    key={experience.id}
                                    onPress={() => router.push(`/(experienceFlow)/${experience.id}`)}
                                    className="bg-white rounded-xl overflow-hidden mb-5 shadow-sm"
                                >
                                    <View className="relative">
                                        <Image
                                            source={experience.image}
                                            className="w-full h-48"
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            className="absolute top-3 right-3 bg-white rounded-full p-2"
                                            onPress={() => console.log('Remove from saved')}
                                        >
                                            <Image
                                                source={require('../../assets/images/google.png')} // Replace with your icon
                                                className="w-5 h-5"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    <View className="p-4">
                                        <View className="flex-row justify-between items-start">
                                            <View className="flex-1 pr-2">
                                                <Text className="text-lg font-onest-semibold">{experience.title}</Text>
                                                <View className="flex-row items-center mt-1">

                                                    <Text className="text-sm text-gray-600 font-onest">
                                                        {experience.location}
                                                    </Text>
                                                </View>
                                            </View>
                                            {/* <View className="bg-primary-light rounded-full px-3 py-1">
                                                <Text className="text-xs text-primary font-onest-medium">
                                                    {experience.price}
                                                </Text>
                                            </View> */}
                                        </View>

                                        <View className="flex-row justify-between items-center mt-3">

                                            <Text className="text-xs text-gray-400 font-onest">
                                                Saved {experience.savedAt}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default SavedScreen;