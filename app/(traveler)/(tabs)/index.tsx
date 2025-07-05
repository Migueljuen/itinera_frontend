import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Adjustment from '../../../assets/icons/adjustment.svg';
import API_URL from '../../../constants/api';
import { useRefresh } from '../../../contexts/RefreshContext';

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
};

const categories = [
  'All',
  'Adventure',
  'Artistic',
  'Beach',
  'Budget-Friendly',
  'Cultural',
  'Family Friendly',
  'Foodie',
  'Group Travel',
  'Historical',
  'Local Culture',
  'Luxury',
  'Nature',
  'Nightlife',
  'Outdoor',
  'Romantic',
  'Solo Travel',
  'Spa & Relaxation',
  'Sustainable',
  'Wellness',
  'Wildlife'
];

const ITEMS_PER_PAGE = 10;

const App = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { profileUpdated } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [firstName, setFirstName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');

      if (user) {
        const parsedUser = JSON.parse(user);
        setFirstName(parsedUser.first_name);
        setProfilePic(parsedUser.profile_pic);
      } else {
        console.log('No user found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [profileUpdated]);

  // Function to fetch experiences
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/experience/active`);
      setExperiences(response.data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchExperiences();
  }, []);

  // Handle refresh - using the same pattern as your trip screen
  // Update the handleRefresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchExperiences(),
        fetchUserData()
      ]);
      setCurrentPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  // Reset to first page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchText]);

  // Filter experiences based on selected category and search text
  const filteredExperiences: Experience[] = React.useMemo(() => {
    let filtered = [...experiences];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(exp =>
        exp.tags && exp.tags.some(tag =>
          tag.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(exp =>
        (exp.title && exp.title.toLowerCase().includes(searchLower)) ||
        (exp.description && exp.description.toLowerCase().includes(searchLower)) ||
        (exp.location && exp.location.toLowerCase().includes(searchLower)) ||
        (exp.destination_name && exp.destination_name.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [experiences, selectedCategory, searchText]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredExperiences.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExperiences = filteredExperiences.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-gray-600 font-onest">Loading experiences...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className='bg-gray-50'>
      <View className='w-full h-screen pb-20'>
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ paddingBottom: 142 }}
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

          <View className='flex items-center justify-between flex-row p-6'>
            <View className="">
              <Text className="text-normal text-3xl font-onest-semibold">Hello, {firstName}</Text>
              <Text className="text-gray-400 font-onest">Welcome to Itinera</Text>
            </View>
            {profilePic ? (
              <Image
                source={{ uri: `${API_URL}/${profilePic}` }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
                defaultSource={require('../../../assets/images/balay.jpg')}
              />
            ) : (
              <Image
                source={require('../../../assets/images/balay.jpg')}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
            )}
          </View>

          <View className='flex flex-row items-center justify-between p-4 bg-white rounded-xl mx-4'>
            <Image
              source={require('../../../assets/images/search.png')}
              className='w-5 h-5 mr-3 opacity-60'
              resizeMode='contain'
            />
            <TextInput
              className='flex-1 text-base text-gray-800'
              placeholder="Search experiences"
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Adjustment className='w-5 h-5 mr-3 opacity-60' />
          </View>

          <View className="px-6 py-8">
            <Text className="text-normal text-xl font-onest-medium">Featured Activities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

            <View className="mt-8 min-h-fit">
              {filteredExperiences.length === 0 ? (
                <View className="py-16 items-center">
                  <Text className="text-center text-gray-500 font-onest-medium text-lg">
                    No experiences found
                  </Text>
                  <Text className="text-center text-gray-400 px-8 mt-3 font-onest leading-5">
                    Try adjusting your search or category filter
                  </Text>
                </View>
              ) : (
                <>
                  {/* Experience Items */}
                  {paginatedExperiences.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push(`/(experience)/${item.id}`)}
                      className="mb-4 rounded-lg overflow-hidden border border-gray-200 bg-white"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                      activeOpacity={0.7}
                    >
                      <View className="relative">
                        {/* Image */}
                        {item.images && item.images.length > 0 ? (
                          <Image
                            source={{ uri: `${API_URL}/${item.images[0]}` }}
                            className="w-full h-40"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-40 bg-gray-200 items-center justify-center">
                            <Ionicons name="image-outline" size={40} color="#A0AEC0" />
                          </View>
                        )}

                        {/* Price Badge */}
                        <View className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-md">
                          <Text className="font-onest-medium">
                            {item.price === '0' || !item.price ? 'Free' : `${item.price} ${item.unit || 'per person'}`}
                          </Text>
                        </View>
                      </View>

                      <View className="p-3">
                        {/* Title */}
                        <Text className="text-lg font-onest-semibold mb-1">{item.title}</Text>

                        {/* Location */}
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="location-outline" size={16} color="#4F46E5" />
                          <Text className="text-sm text-gray-600 ml-1">{item.location || item.destination_name}</Text>
                        </View>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                          <View className="flex-row flex-wrap">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <View key={index} className="bg-indigo-50 px-2 py-1 rounded-md mr-2 mb-2">
                                <Text className="text-xs text-primary font-onest-medium">{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <View className="mt-6 mb-4">
                      {/* Results Info */}
                      <Text className="text-center text-gray-500 text-sm mb-4 font-onest">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredExperiences.length)} of {filteredExperiences.length} activities
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
          </View>
        </ScrollView>

        <TouchableOpacity
          className="absolute bottom-48 right-6 bg-primary rounded-full p-4 shadow-md flex-row items-center"
          onPress={() => router.push('/(createItinerary)/selectionScreen')}
        >
          <View className="flex-row items-center">
            <Image
              source={require('../../../assets/icons/plus.png')}
              className="w-5 h-5 mr-2 opacity-80"
              resizeMode="contain"
            />
            <Text className="text-gray-300 font-onest">Build My Trip</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default App;