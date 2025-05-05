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
import { experiences } from '../../../data/experiences'
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

    const [isRefreshing, setIsRefreshing] = useState(false);


    const categories = ['All', 'Food', 'Cultural', 'Adventure', 'Fitness', 'Relaxation', 'Scenic', 'Sports', 'Music', 'Art'];

    const [selectedCategory, setSelectedCategory] = useState('All'); // default selected
    const filteredExperiences = selectedCategory === 'All'
        ? experiences
        : experiences.filter(exp => exp.category.toLowerCase() === selectedCategory.toLowerCase());



    const refreshData = () => {
        setIsRefreshing(true);
        // Simulate data fetch
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
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
                    <ScrollView className=' px-6 py-8' horizontal showsHorizontalScrollIndicator={false}>
                        {categories.map((category, index) => {
                            const isSelected = selectedCategory === category;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedCategory(category)}
                                    className={`px-6 py-2 rounded-full mr-3 mt-4 ${isSelected ? 'bg-gray-800' : 'bg-white'}`}
                                >
                                    <Text className={`text-base font-onest-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    {/* Experiences List */}
                    <View className="px-6 py-2">
                        {filteredExperiences.length === 0 ? (
                            <View className="w-full py-12 items-center">
                                <Image
                                    source={require('../../../assets/images/google.png')} // Replace with your image
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
                                                source={require('../../../assets/images/google.png')} // Replace with your icon
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
                                                Saved 2 days ago
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