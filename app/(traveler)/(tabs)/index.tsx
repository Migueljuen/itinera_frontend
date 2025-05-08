import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from "react-native-safe-area-context";
import Adjustment from '../../../assets/icons/adjustment.svg'
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from '../../../constants/api'
import { useNavigation } from '@react-navigation/native';
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

const App = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All'); // default selected

  const { isRefreshing, refreshData } = useRefresh();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const [firstName, setFirstName] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const { profileUpdated } = useRefresh();
  const [loading, setLoading] = useState(true);

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

  // Handle refresh context
  useEffect(() => {
    if (isRefreshing) {
      fetchExperiences();
      refreshData();
    }
  }, [isRefreshing]);

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchExperiences().then(() => setRefreshing(false));
  }, []);

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


  return (
    <SafeAreaView className='bg-gray-50'>
      <View className='w-full h-screen'>
        <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 142 }}>
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
            <Text className="text-normal text-xl font-onest-medium">Featured Experiences</Text>
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
              {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : filteredExperiences.length === 0 ? (
                <Text className="text-center text-gray-500 py-10">No experiences found</Text>
              ) : (
                filteredExperiences.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/(experience)/${item.id}`)}
                    className="w-full bg-white rounded-xl overflow-hidden mb-6 border border-gray-200"
                  >
                    {item.images && item.images.length > 0 ? (
                      <Image
                        source={{ uri: `${API_URL}/${item.images[0]}` }}
                        style={{ width: '100%', height: 160 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ width: '100%', height: 160, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                        <Text>No Image</Text>
                      </View>
                    )}
                    <View className="p-3">
                      <Text className="text-base font-semibold">{item.title}</Text>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="text-sm text-gray-600">{item.location || item.destination_name}</Text>
                        {/* Removed distance since it's not in your API */}
                      </View>
                      <View className="flex-row justify-between mt-2">
                        <Text className="text-base font-bold text-blue-500">
                          {item.price ? `$${item.price}` : 'Price not available'}
                        </Text>
                        <Text className="text-xs text-gray-500">{item.unit || 'per person'}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          className="absolute bottom-48 right-6 bg-primary rounded-full p-4 shadow-md flex-row items-center"
          onPress={() => console.log('Create Itinerary')}
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