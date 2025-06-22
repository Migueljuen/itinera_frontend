import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import API_URL from '../../../constants/api';
import SafeViewAndroid from '../../globalStyle';

// Updated interface to match your API response
interface Experience {
  experience_id: number; // Changed from 'id' to 'experience_id'
  creator_id: number; // Added this field
  title: string;
  description: string; // Added this field
  location?: string; // Made optional since it's not in API response
  price: string;
  unit: string;
  destination_name: string;
  destination_id: number; // Added this field
  status: 'active' | 'draft' | 'inactive'; // Updated to match API (lowercase)
  travel_companion: string; // Added this field
  bookings?: number; // Made optional since it's not in API response
  rating?: number; // Made optional since it's not in API response
  images: string[];
  tags: string[];
  created_at: string; // Added this field
}

const CreatorDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>('');
  const [userID, setUserID] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('Active');
  const [myExperiences, setMyExperiences] = useState<Experience[]>([]);

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');

      if (user) {
        const parsedUser = JSON.parse(user);
        setFirstName(parsedUser.first_name);
        setProfilePic(parsedUser.profile_pic);
        setUserID(parsedUser.user_id);
      } else {
        console.log('No user found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Function to fetch experiences
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/experience/user/${userID}`);
      setMyExperiences(response.data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (userID) {
      fetchExperiences();
    }
  }, [userID]);

  const filteredExperiences: Experience[] = myExperiences.filter(exp => {
    // Filter by search text - use destination_name since location might not exist
    const matchesSearch = exp.title.toLowerCase().includes(searchText.toLowerCase()) ||
      exp.destination_name.toLowerCase().includes(searchText.toLowerCase());

    // Filter by selected tab (status) - handle case sensitivity
    const matchesTab =
      selectedTab === 'All' || exp.status.toLowerCase() === selectedTab.toLowerCase();

    return matchesSearch && matchesTab;
  });

  const tabs: string[] = ['All', 'Active', 'Draft', 'Inactive'];

  return (
    <SafeAreaView className='bg-gray-50' style={SafeViewAndroid.AndroidSafeArea}>
      <View className='w-full h-screen'>
        <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 142 }}>
          <View className='flex items-center justify-between flex-row p-6'>
            <View className="">
              <Text className="text-normal text-3xl font-onest-semibold">Your Experiences</Text>
              <Text className="text-gray-400 font-onest">Manage your experiences</Text>
            </View>
            {profilePic ? (
              <Image
                source={{ uri: `${API_URL}/${profilePic}` }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
            ) : (
              <Image
                source={require('../../../assets/images/person.png')}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
            )}
          </View>

          <View className='flex flex-row items-center justify-between p-4 bg-[#fff] rounded-xl mx-4'>
            <Image
              source={require('../../../assets/images/search.png')}
              className='w-5 h-5 mr-3 opacity-60'
              resizeMode='contain'
            />
            <TextInput
              className='flex-1 text-base text-gray-800'
              placeholder="Search your experiences"
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Image
              source={require('../../../assets/icons/heart.svg')}
              className='w-5 h-5 mr-3 opacity-60'
              resizeMode='contain'
            />
          </View>

          <View className="px-6 py-8">
            <Text className="text-normal text-xl font-onest-medium">My Experiences</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab, index) => {
                const isSelected = selectedTab === tab;
                return (
                  <TouchableOpacity
                    key={`tab-${index}`}
                    onPress={() => setSelectedTab(tab)}
                    className={`px-6 py-2 rounded-full mr-3 mt-4 ${isSelected ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    <Text className={`text-base font-onest-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {tab}
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
                filteredExperiences.map((item, index) => (
                  <TouchableOpacity
                    key={`experience-${item.experience_id}-${index}`}
                    // FIXED: Use experience_id instead of id
                    onPress={() => router.push(`/(experience)/${item.experience_id}`)}
                    className="mb-4 rounded-lg overflow-hidden border border-gray-200"
                    activeOpacity={0.7}
                  >
                    <View className="relative">
                      {/* Image */}
                      {item.images && item.images.length > 0 ? (
                        <Image
                          source={{ uri: `${API_URL}${item.images[0]}` }}
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
                          {item.price === "0" || !item.price ? 'Free' : `₱${item.price}`}
                        </Text>
                      </View>
                    </View>

                    <View className="p-3">
                      {/* Title */}
                      <Text className="text-lg font-onest-semibold mb-1">{item.title}</Text>

                      {/* Location - use destination_name since location might not exist */}
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="location-outline" size={16} color="#4F46E5" />
                        <Text className="text-sm text-gray-600 ml-1">{item.destination_name}</Text>
                      </View>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <View className="flex-row flex-wrap mb-3">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} className="bg-indigo-50 px-2 py-1 rounded-md mr-2 mb-2">
                              <Text className="text-xs text-primary font-onest-medium">{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Stats and actions */}
                      <View className="flex-row items-center pt-3 border-t border-gray-100 justify-between">
                        <View className="flex-row">
                          <View className="flex-row items-center mr-4">
                            <Ionicons name="heart-outline" size={14} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">{item.bookings || 0} bookings</Text>
                          </View>
                          {(item.rating && item.rating > 0) && (
                            <View className="flex-row items-center">
                              <Ionicons name="star" size={14} color="#F59E0B" />
                              <Text className="text-xs text-gray-500 ml-1">{item.rating}</Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row">
                          <TouchableOpacity
                            key={`edit-${item.experience_id}`}
                            className="p-2 mr-2"
                            // FIXED: Use experience_id instead of id
                            onPress={() => router.push(`/(updateExperience)/updateExperience${item.experience_id}`)}
                          >
                            <Ionicons name="pencil-outline" size={18} color="#6B7280" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            key={`delete-${item.experience_id}`}
                            className="p-2"
                            onPress={() => console.log('Delete experience', item.experience_id)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#6B7280" />
                          </TouchableOpacity>
                        </View>
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
          onPress={() => router.push('/(createExperience)/createExperience')}
        >
          <View className="flex-row items-center">
            <Image
              source={require('../../../assets/icons/plus.png')}
              className="w-5 h-5"
              resizeMode="contain"
            />
            <Text className="text-gray-300 font-onest ml-2">Create Activity</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreatorDashboard;