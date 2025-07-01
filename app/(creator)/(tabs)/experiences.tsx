import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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

const ITEMS_PER_PAGE = 5;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  // Reset to first page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchText]);

  // Handle refresh - using the same pattern as your trip screen
  const handleRefresh = async () => {
    await refreshData();
    await fetchUserData();
    if (userID) {
      await fetchExperiences();
    }
    setCurrentPage(1); // Reset to first page on refresh
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

  const tabs: string[] = ['All', 'Active', 'Draft', 'Inactive'];

  // Function to update experience status
  const updateExperienceStatus = async (experienceId: number, newStatus: 'active' | 'draft' | 'inactive') => {
    try {
      setUpdatingStatus(true);
      const token = await AsyncStorage.getItem("token");

      // Debug logs
      console.log('API_URL:', API_URL);
      console.log('Experience ID:', experienceId);
      console.log('Full URL:', `${API_URL}/experience/${experienceId}/status`);
      console.log('New Status:', newStatus);

      const response = await axios.patch(
        `${API_URL}/experience/${experienceId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.status === 200) {
        // Update the local state
        setMyExperiences(prevExperiences =>
          prevExperiences.map(exp =>
            exp.experience_id === experienceId
              ? { ...exp, status: newStatus }
              : exp
          )
        );

        Alert.alert(
          'Success',
          `Experience status updated to ${newStatus}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating experience status:', error);

      // Type guard to check if it's an AxiosError
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);

        // Check if the update actually succeeded despite the error
        if (error.response?.status === 500) {
          // Refresh the experiences to see if it updated
          await fetchExperiences();
        }
      }

      Alert.alert(
        'Error',
        'Failed to update experience status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUpdatingStatus(false);
      setStatusModalVisible(false);
      setSelectedExperience(null);
    }
  };

  // Function to handle status badge click
  const handleStatusClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setStatusModalVisible(true);
  };

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
                <>
                  {paginatedExperiences.map((item, index) => (
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

                        {/* Status Badge - Now Clickable */}
                        <TouchableOpacity
                          onPress={() => handleStatusClick(item)}
                          className={`absolute top-2 left-2 px-2 py-1 rounded-md ${item.status === 'active' ? 'bg-green-100' :
                            item.status === 'draft' ? 'bg-yellow-100' : 'bg-gray-100'
                            }`}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center">
                            <Text className={`text-xs font-onest-medium ${item.status === 'active' ? 'text-green-600' :
                              item.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                            <Ionicons
                              name="chevron-down"
                              size={12}
                              color={item.status === 'active' ? '#16a34a' : item.status === 'draft' ? '#ca8a04' : '#4b5563'}
                              style={{ marginLeft: 4 }}
                            />
                          </View>
                        </TouchableOpacity>
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

                          <TouchableOpacity
                            key={`edit-${item.experience_id}`}
                            className="bg-indigo-50 px-3 py-1.5 rounded-full flex-row items-center"
                            onPress={() => router.push(`/(updateExperience)/updateExperience${item.experience_id}`)}
                          >
                            <Ionicons name="create-outline" size={14} color="#4F46E5" />
                            <Text className="text-xs text-primary font-onest-medium ml-1">Edit</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <View className="mt-6 mb-4">
                      {/* Results Info */}
                      <Text className="text-center text-gray-500 text-sm mb-4 font-onest">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredExperiences.length)} of {filteredExperiences.length} experiences
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
            <Text className="text-gray-300 font-onest ml-2">Add New Activity</Text>
          </View>
        </TouchableOpacity>

        {/* Status Change Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={statusModalVisible}
          onRequestClose={() => {
            setStatusModalVisible(false);
            setSelectedExperience(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setStatusModalVisible(false);
              setSelectedExperience(null);
            }}
            className="flex-1 justify-end bg-black/50"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
              className="bg-white rounded-t-3xl p-6"
            >
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />

              <Text className="text-xl font-onest-semibold text-gray-800 mb-2">
                Change Experience Status
              </Text>
              <Text className="text-sm text-gray-500 font-onest mb-6">
                Select a new status for "{selectedExperience?.title}"
              </Text>

              {/* Status Options */}
              <View className="space-y-3">
                {/* Active Option */}
                <TouchableOpacity
                  onPress={() => selectedExperience && updateExperienceStatus(selectedExperience.experience_id, 'active')}
                  disabled={updatingStatus || selectedExperience?.status === 'active'}
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${selectedExperience?.status === 'active'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                    }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className="bg-green-100 p-2 rounded-full mr-3">
                      <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                    </View>
                    <View>
                      <Text className="text-base font-onest-medium text-gray-800">Active</Text>
                      <Text className="text-xs text-gray-500 font-onest">Visible to travelers</Text>
                    </View>
                  </View>
                  {selectedExperience?.status === 'active' && (
                    <Ionicons name="checkmark" size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>

                {/* Draft Option */}
                <TouchableOpacity
                  onPress={() => selectedExperience && updateExperienceStatus(selectedExperience.experience_id, 'draft')}
                  disabled={updatingStatus || selectedExperience?.status === 'draft'}
                  className={`flex-row items-center justify-between p-4 rounded-xl border mt-3 ${selectedExperience?.status === 'draft'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                    }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className="bg-yellow-100 p-2 rounded-full mr-3">
                      <Ionicons name="create" size={24} color="#ca8a04" />
                    </View>
                    <View>
                      <Text className="text-base font-onest-medium text-gray-800">Draft</Text>
                      <Text className="text-xs text-gray-500 font-onest">Work in progress</Text>
                    </View>
                  </View>
                  {selectedExperience?.status === 'draft' && (
                    <Ionicons name="checkmark" size={20} color="#ca8a04" />
                  )}
                </TouchableOpacity>

                {/* Inactive Option */}
                <TouchableOpacity
                  onPress={() => selectedExperience && updateExperienceStatus(selectedExperience.experience_id, 'inactive')}
                  disabled={updatingStatus || selectedExperience?.status === 'inactive'}
                  className={`flex-row items-center justify-between p-4 rounded-xl border mt-3 ${selectedExperience?.status === 'inactive'
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-white border-gray-200'
                    }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View className="bg-gray-200 p-2 rounded-full mr-3">
                      <Ionicons name="pause-circle" size={24} color="#4b5563" />
                    </View>
                    <View>
                      <Text className="text-base font-onest-medium text-gray-800">Inactive</Text>
                      <Text className="text-xs text-gray-500 font-onest">Hidden from travelers</Text>
                    </View>
                  </View>
                  {selectedExperience?.status === 'inactive' && (
                    <Ionicons name="checkmark" size={20} color="#4b5563" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => {
                  setStatusModalVisible(false);
                  setSelectedExperience(null);
                }}
                disabled={updatingStatus}
                className="mt-6 p-4 rounded-xl bg-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-center text-gray-700 font-onest-medium">
                  {updatingStatus ? 'Updating...' : 'Cancel'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default CreatorDashboard;