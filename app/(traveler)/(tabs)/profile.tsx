import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from '../../../constants/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRefresh } from '../../../contexts/RefreshContext';
// Type definitions
interface UserData {
  user_id?: number;
  first_name: string;
  last_name: string;
  profile_pic: string;
  email: string;
  created_at: string;
}

interface ProfileStats {
  totalItineraries: number;
  completedItineraries: number;
  savedExperiences: number;
  upcomingTrips: number;
}

interface SavedExperience {
  id: number;
  saved_at: string;
  experience_id: number;
  title: string;
  description?: string;
  price?: string;
  unit?: string;
  location?: string;
  destination_name?: string;
  city?: string;
  images?: string[];
  tags?: string[];
}

interface NotificationSettings {
  tripReminders: boolean;
  itineraryUpdates: boolean;
  nearbyExperiences: boolean;
}

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const bottom = useBottomTabBarHeight();
  const { user, logout } = useAuth();
  const { profileUpdated, triggerProfileUpdate } = useRefresh();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData>({
    first_name: "",
    last_name: "",
    profile_pic: "",
    email: "",
    created_at: "2024-01-15T00:00:00Z",
  });

  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalItineraries: 0,
    completedItineraries: 0,
    savedExperiences: 0,
    upcomingTrips: 0
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const [recentExperiences, setRecentExperiences] = useState<SavedExperience[]>([]);
  const [loadingSavedExperiences, setLoadingSavedExperiences] = useState<boolean>(false);

  const navigation = useNavigation<any>();

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    tripReminders: true,
    itineraryUpdates: true,
    nearbyExperiences: false
  });

  const SUPPORT_USER_ID = 21;

  const openSupportChat = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in to message support");
        return;
      }

      // Create or get existing conversation with Support (fixed user)
      const response = await axios.post(
        `${API_URL}/conversations`,
        { participantId: SUPPORT_USER_ID },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const conversationId = response.data.data.id;

        router.push({
          pathname: "/(traveler)/(conversations)/[id]",
          params: {
            id: String(conversationId),
            name: "Chat support",
          },
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to open support chat");
      }
    } catch (error) {
      console.error("Error starting support conversation:", error);
      Alert.alert("Error", "Failed to start support chat");
    }
  };


  // Unified styles
  const shadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  const cardStyle = " rounded-2xl";
  const sectionTitleStyle = "text-xl font-onest-semibold text-black/90";
  const horizontalScrollStyle = "px-4";
  const statCardStyle = " rounded-2xl p-5 mr-3 w-32";
  const iconBgColors = ['bg-indigo-50', 'bg-green-50', 'bg-red-50', 'bg-blue-50'];
  const iconColors = ['#4F46E5', '#10B981', '#EF4444', '#3B82F6'];
  const iconNames = ['map-outline', 'checkmark-circle-outline', 'heart-outline', 'calendar-outline'];

  const fetchUserData = async (): Promise<void> => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserData({
          ...parsedUser,
          email: parsedUser.email || "traveler@itinera.com",
          created_at: parsedUser.created_at || "2024-01-15T00:00:00Z"
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Add function to fetch user stats
  const fetchUserStats = async (): Promise<void> => {
    try {
      setLoadingStats(true);
      let userId = user?.user_id;

      if (!userId) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          try {
            const userObj = JSON.parse(userData);
            userId = userObj.user_id;
          } catch (e) {
            console.error('Error parsing user data:', e);
            return;
          }
        }
      }

      if (!userId) {
        console.log('No user ID found, skipping stats fetch');
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`${API_URL}/users/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfileStats({
            totalItineraries: data.stats.totalItineraries,
            completedItineraries: data.stats.completedActivities, // Using activities count as requested
            savedExperiences: data.stats.savedExperiences,
            upcomingTrips: data.stats.upcomingTrips
          });
        }
      } else {
        console.error('Failed to fetch user stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSavedExperiences = async (): Promise<void> => {
    try {
      setLoadingSavedExperiences(true);
      let userId = user?.user_id;

      if (!userId) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          try {
            const userObj = JSON.parse(userData);
            userId = userObj.user_id;
          } catch (e) {
            console.error('Error parsing user data:', e);
            return;
          }
        }
      }

      if (!userId) {
        console.log('No user ID found, skipping saved experiences fetch');
        return;
      }

      const response = await fetch(`${API_URL}/saved-experiences?user_id=${userId}`);

      if (response.ok) {
        const savedData: SavedExperience[] = await response.json();
        setRecentExperiences(savedData.slice(0, 3));
        // Don't update savedExperiences count here anymore since we get it from stats
        console.log(`Fetched ${savedData.length} saved experiences`);
      } else {
        console.error('Failed to fetch saved experiences:', response.status);
      }
    } catch (error) {
      console.error('Error fetching saved experiences:', error);
    } finally {
      setLoadingSavedExperiences(false);
    }
  };

  // Handle profile picture edit
  const handleEditProfilePicture = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openImagePicker();
          } else if (buttonIndex === 3) {
            handleRemovePhoto();
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Gallery', onPress: openImagePicker },
          { text: 'Remove Photo', onPress: handleRemovePhoto, style: 'destructive' },
        ],
        { cancelable: true }
      );
    }
  };

  // Open camera
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  // Open image picker
  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery permissions to choose a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);

      const formData = new FormData();

      // Add image to form data
      formData.append('profile_pic', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile_pic.jpg',
      } as any);

      // Get auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      console.log('Uploading to:', `${API_URL}/users/${userData.user_id}`);

      // Make request
      const response = await fetch(`${API_URL}/users/${userData.user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let it be set automatically
        },
        body: formData,
      });

      // Check content type of response
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();

        if (response.ok) {
          // Update local user data
          const updatedUser = {
            ...userData,
            profile_pic: data.user.profile_pic,
          };

          setUserData(updatedUser);

          // Update AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

          // Trigger profile update
          triggerProfileUpdate();

          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile picture');
        }
      } else {
        // Response is not JSON - likely HTML error page
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        Alert.alert('Error', 'Server error - please check your connection and try again');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle remove photo
  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingImage(true);

              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Error', 'Please login again');
                return;
              }

              // Send empty profile_pic to remove it
              const response = await fetch(`${API_URL}/user/${userData.user_id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  profile_pic: '',
                }),
              });

              const data = await response.json();

              if (response.ok) {
                // Update local user data
                const updatedUser = {
                  ...userData,
                  profile_pic: '',
                };

                setUserData(updatedUser);

                // Update AsyncStorage
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

                // Trigger profile update
                triggerProfileUpdate();

                Alert.alert('Success', 'Profile picture removed');
              } else {
                Alert.alert('Error', data.message || 'Failed to remove profile picture');
              }
            } catch (error) {
              console.error('Error removing profile picture:', error);
              Alert.alert('Error', 'Failed to remove profile picture');
            } finally {
              setUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchUserData();
    fetchUserStats();
    fetchSavedExperiences();
  }, [profileUpdated, user]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUserData(), fetchUserStats(), fetchSavedExperiences()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              router.replace("/(shared)/login");
            }
          }
        }
      ]
    );
  };

  const toggleSwitch = (setting: keyof NotificationSettings): void => {
    setNotificationSettings(prevState => ({
      ...prevState,
      [setting]: !prevState[setting]
    }));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getFormattedImageUrl = (imageUrl: string): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    const formattedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${API_URL}${formattedPath}`;
  };

  const StatCard = ({ value, label, iconName, iconColor, iconBgColor }: {
    value: number | string;
    label: string;
    iconName: string;
    iconColor: string;
    iconBgColor: string;
  }) => (
    <View className={statCardStyle} style={shadowStyle}>
      <View className={`${iconBgColor} rounded-full w-12 h-12 items-center justify-center mb-3`}>
        <Ionicons name={iconName as any} size={24} color={iconColor} />
      </View>
      <Text className="text-2xl font-onest-bold text-black/90">{value}</Text>
      <Text className="text-xs text-black/50 font-onest mt-1">{label}</Text>
    </View>
  );

  const NotificationRow = ({ title, description, value, onToggle }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View className="p-4 flex-row justify-between items-center border-b border-gray-100 last:border-b-0">
      <View className="flex-1 mr-4">
        <Text className="font-onest-medium text-black/90">{title}</Text>
        <Text className="text-xs text-black/50 font-onest mt-1">{description}</Text>
      </View>
      <Switch
        trackColor={{ false: "#e5e7eb", true: "#4F46E5" }}
        thumbColor={"#ffffff"}
        ios_backgroundColor="#e5e7eb"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  const statsData = [
    { value: profileStats.totalItineraries, label: 'Itineraries Completed' },
    { value: profileStats.completedItineraries, label: 'Activities Finished' },
    { value: loadingSavedExperiences ? '...' : profileStats.savedExperiences, label: 'Saved Activities' },
    { value: profileStats.upcomingTrips, label: 'Upcoming' }
  ];

  const notificationData = [
    {
      title: 'Trip Reminders',
      description: 'Get notified about upcoming trips',
      value: notificationSettings.tripReminders,
      onToggle: () => toggleSwitch('tripReminders')
    },
    {
      title: 'Itinerary Updates',
      description: 'Stay informed about your activities',
      value: notificationSettings.itineraryUpdates,
      onToggle: () => toggleSwitch('itineraryUpdates')
    },

  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
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
        {/* Header */}
        <View className="flex-row justify-between items-center p-6">
          <View>
            <Text className="text-3xl font-onest-semibold text-black/90">My Profile</Text>
            <Text className="text-black/50 font-onest">Member since {formatDate(userData.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} className="bg-gray-100 p-3 rounded-full">
            <Ionicons name="log-out-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className={`${cardStyle} mx-4 p-5 mb-6`} style={shadowStyle}>
          <View className="items-center mb-4">
            <View className="relative">
              {uploadingImage ? (
                <View className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center">
                  <ActivityIndicator size="large" color="#4F46E5" />
                </View>
              ) : userData.profile_pic ? (
                <Image
                  source={{ uri: `${API_URL}/${userData.profile_pic}` }}
                  className="w-28 h-28 rounded-full"
                />
              ) : (
                <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
                  <Ionicons name="person" size={48} color="#9CA3AF" />
                </View>
              )}
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-primary rounded-full p-2"
                onPress={handleEditProfilePicture}
                disabled={uploadingImage}
                style={{
                  shadowColor: '#4F46E5',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="pencil" size={16} color="#E5E7EB" />
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-onest-semibold mt-3 text-black/90">
              {userData.first_name} {userData.last_name}
            </Text>
            <Text className="text-sm text-black/50 font-onest mt-1">{userData.email}</Text>
          </View>


        </View>

        {/* Travel Stats */}
        {/* <View className="mb-6">
          <Text className={`px-6 ${sectionTitleStyle} mb-4`}>Travel Activity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`${horizontalScrollStyle} py-2`}>
            {statsData.map((stat, index) => (
              <StatCard
                key={index}
                value={stat.value}
                label={stat.label}
                iconName={iconNames[index]}
                iconColor={iconColors[index]}
                iconBgColor={iconBgColors[index]}
              />
            ))}
          </ScrollView>
        </View> */}

        {/* Recent Saved Experiences */}
        {recentExperiences.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className={sectionTitleStyle}>Recent Saves</Text>
              <TouchableOpacity onPress={() => router.push('/(traveler)/(saved)')}>
                <Text className="text-primary font-onest-medium text-sm">See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className={horizontalScrollStyle}>
              {recentExperiences.map((item: SavedExperience) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/(traveler)/(experience)/${item.experience_id}`)}
                  className="mr-4"
                  style={{ width: 240 }}
                >
                  <View
                    className=""
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="h-48 rounded-2xl overflow-hidden">
                      {item.images && item.images.length > 0 && item.images[0] ? (
                        <Image
                          source={{ uri: getFormattedImageUrl(item.images[0])! }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full bg-gray-200 items-center justify-center">
                          <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                        </View>
                      )}
                    </View>

                    <View className="py-3">
                      <Text
                        className="font-onest-semibold text-base text-black/90"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>

                      <View className="flex-row items-center mt-1">
                        <Text
                          className="text-black/60 font-onest text-sm"
                          numberOfLines={1}
                        >
                          {item.city}, {item.destination_name}
                        </Text>
                      </View>

                      {item.price && item.price !== "0" && (
                        <Text className="text-black/60 font-onest text-sm mt-2">
                          From ₱{parseFloat(item.price).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}


        {/* Loading/Empty states */}
        {loadingSavedExperiences && recentExperiences.length === 0 && (
          <View className="mb-6">
            <Text className={`px-6 ${sectionTitleStyle} mb-4`}>Recent Saves</Text>
            <View className={horizontalScrollStyle}>
              <View className={`${cardStyle} p-4 items-center justify-center h-32`}>
                <Text className="text-black/50 font-onest">Loading saved experiences...</Text>
              </View>
            </View>
          </View>
        )}

        {!loadingSavedExperiences && recentExperiences.length === 0 && (
          <View className="mb-6">
            <Text className={`px-6 ${sectionTitleStyle} mb-4`}>Recent Saves</Text>
            <View className={`mx-4 ${cardStyle} p-6 items-center`}>

              <Text className="text-black/50 font-onest-medium mt-2">No saved experiences yet</Text>
              <Text className="text-black/50 font-onest text-sm text-center mt-1">
                Start exploring and save experiences you love
              </Text>
            </View>
          </View>
        )}

        {/* Notification Settings */}
        {/* <View className="mb-6">
          <Text className={`px-6 ${sectionTitleStyle} mb-4`}>Notifications</Text>
          <View className={`${cardStyle} mx-4 overflow-hidden`}>
            {notificationData.map((notification, index) => (
              <NotificationRow
                key={index}
                title={notification.title}
                description={notification.description}
                value={notification.value}
                onToggle={notification.onToggle}
              />
            ))}
          </View>
        </View> */}

        {/* Quick Actions */}
        <View className="mt-4 px-6 mb-6">
          <Text className={`${sectionTitleStyle} mb-4`}>Quick Actions</Text>

          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={() => router.push("/(traveler)/(profile)/settings")}
          // If your route is actually /account-settings, change the line above to:
          // onPress={() => router.push("/(traveler)/(profile)/account-settings")}
          >
            <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-onest text-black/90">Account Settings</Text>
              <Text className="text-xs font-onest text-black/50 mt-0.5">
                Password, notifications & more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="border-t border-gray-100" />

          <Pressable
            onPress={openSupportChat}
            className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
          >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
              <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-onest text-black/90">Chat Support</Text>
              <Text className="text-xs font-onest text-black/50 mt-0.5">Ask help</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;