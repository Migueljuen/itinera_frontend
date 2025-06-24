import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import API_URL from '../../../constants/api';
import { useRefresh } from '../../../contexts/RefreshContext';
import SafeViewAndroid from '../../globalStyle';

// Updated interface to match your API response
interface Experience {
  experience_id: number;
  creator_id: number;
  title: string;
  description: string;
  location?: string;
  price: string;
  unit: string;
  destination_name: string;
  destination_id: number;
  status: 'active' | 'draft' | 'inactive';
  travel_companion: string;
  bookings?: number;
  rating?: number;
  images: string[];
  tags: string[];
  created_at: string;
}

const CreatorDashboard: React.FC = () => {
  const router = useRouter();
  const { isRefreshing, refreshData, profileUpdated } = useRefresh();
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
  }, [profileUpdated]);

  // Function to fetch experiences
  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/experience/user/${userID}`);
      setMyExperiences(response.data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      setMyExperiences([]);
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

  // Handle refresh - using the same pattern as your trip screen
  const handleRefresh = async () => {
    await refreshData();
    await fetchUserData();
    if (userID) {
      await fetchExperiences();
    }
  };

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

  if (loading && myExperiences.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-gray-600 font-onest">Loading your experiences...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className='bg-gray-50' style={SafeViewAndroid.AndroidSafeArea}>
      <View className='w-full h-screen'>
        <ScrollView
          className='flex-1'
          contentContainerStyle={{ paddingBottom: 142 }}
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
          <View className='flex items-center justify-between flex-row p-6'>
            <View className="">
              <Text className="text-normal text-3xl font-onest-semibold">Your Experiences</Text>
              <Text className="text-gray-400 font-onest">Manage your experiences</Text>
            </View>
            {profilePic ? (
              <Image
                source={{ uri: `${API_URL}/${profilePic}` }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
                defaultSource={require('../../../assets/images/person.png')}
              />
            ) : (
              <Image
                source={require('../../../assets/images/person.png')}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
            )}
          </View>

          <View className='flex flex-row items-center justify-between p-4 bg-white rounded-xl mx-4'
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
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
            <Text className="text-normal text-xl font-onest-medium">My Activities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab, index) => {
                const isSelected = selectedTab === tab;
                return (
                  <TouchableOpacity
                    key={`tab-${index}`}
                    onPress={() => setSelectedTab(tab)}
                    className={`px-6 py-2 rounded-full mr-3 mt-4 ${isSelected ? 'bg-gray-800' : 'bg-white'}`}
                    style={!isSelected ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 1,
                    } : {}}
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
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#1f2937" />
                  <Text className="mt-2 text-gray-500 font-onest">Updating...</Text>
                </View>
              ) : filteredExperiences.length === 0 ? (
                <View className="py-16 items-center">
                  <Text className="text-center text-gray-500 font-onest-medium text-lg">
                    No experiences found
                  </Text>
                  <Text className="text-center text-gray-400 px-8 mt-3 font-onest leading-5">
                    {selectedTab === 'All'
                      ? "You haven't created any experiences yet"
                      : `No ${selectedTab.toLowerCase()} experiences found`
                    }
                  </Text>
                  {selectedTab === 'All' && (
                    <TouchableOpacity
                      className="mt-8 bg-primary rounded-full px-8 py-4 flex-row items-center"
                      style={{
                        shadowColor: '#4F46E5',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 12,
                        elevation: 6,
                      }}
                      onPress={() => router.push('/(createExperience)/createExperience')}
                    >
                      <Image
                        source={require('../../../assets/icons/plus.png')}
                        className="w-4 h-4 mr-3 opacity-80"
                        resizeMode="contain"
                      />
                      <Text className="text-gray-300 font-onest-medium">Create First Experience</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredExperiences.map((item, index) => (
                  <TouchableOpacity
                    key={`experience-${item.experience_id}-${index}`}
                    onPress={() => router.push(`/(experience)/${item.experience_id}`)}
                    className="mb-4 rounded-lg overflow-hidden border border-gray-200 bg-white"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
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
                      <View className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                      >
                        <Text className="font-onest-medium">
                          {item.price === "0" || !item.price ? 'Free' : `₱${item.price}`}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View className={`absolute top-2 left-2 px-2 py-1 rounded-md ${item.status === 'active' ? 'bg-green-100' :
                          item.status === 'draft' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                        <Text className={`text-xs font-onest-medium ${item.status === 'active' ? 'text-green-600' :
                            item.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View className="p-3">
                      {/* Title */}
                      <Text className="text-lg font-onest-semibold mb-1">{item.title}</Text>

                      {/* Location */}
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
          style={{
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 6,
          }}
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