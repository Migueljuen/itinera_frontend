import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import API_URL from '../../../constants/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRefresh } from '../../../contexts/RefreshContext';

const ProfileScreen = () => {
  const router = useRouter();
  const bottom = useBottomTabBarHeight();
  const { user, logout } = useAuth();
  const { isRefreshing, refreshData, profileUpdated } = useRefresh();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    profile_pic: "",
    email: "",
    created_at: "2024-01-15T00:00:00Z", // Dummy date
  });

  // Dummy stats data
  const [profileStats] = useState({
    totalItineraries: 12,
    completedItineraries: 8,
    savedExperiences: 24,
    upcomingTrips: 3
  });

  // Dummy recent experiences
  const [recentExperiences] = useState([
    {
      id: 1,
      experience_id: 1,
      experience_title: "Island Hopping in Coron",
      experience_image: "experiences/coron-island.jpg",
      saved_at: "2024-12-20T00:00:00Z"
    },
    {
      id: 2,
      experience_id: 2,
      experience_title: "Chocolate Hills Adventure",
      experience_image: "experiences/chocolate-hills.jpg",
      saved_at: "2024-12-18T00:00:00Z"
    },
    {
      id: 3,
      experience_id: 3,
      experience_title: "Manila Food Walk Tour",
      experience_image: "experiences/manila-food.jpg",
      saved_at: "2024-12-15T00:00:00Z"
    }
  ]);

  const navigation = useNavigation<any>();

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    tripReminders: true,
    itineraryUpdates: true,
    nearbyExperiences: false
  });

  const fetchUserData = async () => {
    try {
      const user = await AsyncStorage.getItem('user');

      if (user) {
        const parsedUser = JSON.parse(user);
        setUserData({
          ...parsedUser,
          email: parsedUser.email || "traveler@itinera.com", // Dummy email if not available
          created_at: parsedUser.created_at || "2024-01-15T00:00:00Z"
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [profileUpdated]);

  const handleRefresh = async () => {
    await refreshData();
    await fetchUserData();
  };

  const handleLogout = async () => {
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

  const toggleSwitch = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prevState => ({
      ...prevState,
      [setting]: !prevState[setting]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
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
        {/* Header */}
        <View className="flex-row justify-between items-center p-6">
          <View>
            <Text className="text-3xl font-onest-semibold text-gray-800">My Profile</Text>
            <Text className="text-gray-400 font-onest">Member since {formatDate(userData.created_at)}</Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-gray-100 p-3 rounded-full"
          >
            <Ionicons name="log-out-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View className="bg-white mx-4 rounded-2xl p-5 mb-6"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="items-center mb-4">
            {/* Avatar with edit button */}
            <View className="relative">
              {userData.profile_pic ? (
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
                onPress={() => router.push('/(traveler)/(profile)/edit')}
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

            {/* Name and Email */}
            <Text className="text-2xl font-onest-semibold mt-3 text-gray-800">
              {userData.first_name} {userData.last_name}
            </Text>
            <Text className="text-sm text-gray-500 font-onest mt-1">{userData.email}</Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            className="bg-gray-50 rounded-xl py-3 flex-row items-center justify-center"
            onPress={() => router.push('/(traveler)/(profile)/edit')}
          >
            <Ionicons name="create-outline" size={20} color="#1f2937" />
            <Text className="ml-2 text-gray-800 font-onest-medium">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Travel Stats */}
        <View className="mb-6">
          <Text className="px-6 text-xl font-onest-semibold text-gray-800 mb-4">Travel Activity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {/* Total Itineraries */}
            <View className="bg-white rounded-2xl p-5 mr-3 w-32">
              <View className="bg-indigo-50 rounded-full w-12 h-12 items-center justify-center mb-3">
                <Ionicons name="map-outline" size={24} color="#4F46E5" />
              </View>
              <Text className="text-2xl font-onest-bold text-gray-800">{profileStats.totalItineraries}</Text>
              <Text className="text-xs text-gray-500 font-onest mt-1">Itineraries Created</Text>
            </View>

            {/* Completed Trips */}
            <View className="bg-white rounded-2xl p-5 mr-3 w-32">
              <View className="bg-green-50 rounded-full w-12 h-12 items-center justify-center mb-3">
                <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
              </View>
              <Text className="text-2xl font-onest-bold text-gray-800">{profileStats.completedItineraries}</Text>
              <Text className="text-xs text-gray-500 font-onest mt-1">Trips Completed</Text>
            </View>

            {/* Saved Experiences */}
            <View className="bg-white rounded-2xl p-5 mr-3 w-32">
              <View className="bg-red-50 rounded-full w-12 h-12 items-center justify-center mb-3">
                <Ionicons name="heart-outline" size={24} color="#EF4444" />
              </View>
              <Text className="text-2xl font-onest-bold text-gray-800">{profileStats.savedExperiences}</Text>
              <Text className="text-xs text-gray-500 font-onest mt-1">Saved</Text>
            </View>

            {/* Upcoming Trips */}
            <View className="bg-white rounded-2xl p-5 w-32">
              <View className="bg-blue-50 rounded-full w-12 h-12 items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-onest-bold text-gray-800">{profileStats.upcomingTrips}</Text>
              <Text className="text-xs text-gray-500 font-onest mt-1">Upcoming</Text>
            </View>
          </ScrollView>
        </View>

        {/* Recent Saved Experiences */}
        {recentExperiences.length > 0 && (
          <View className="mb-6">
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className="text-xl font-onest-semibold text-gray-800">Recent Saves</Text>
              <TouchableOpacity onPress={() => router.push('/(traveler)/(saved)')}>
                <Text className="text-primary font-onest-medium text-sm">See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              {recentExperiences.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="bg-white rounded-2xl mr-3 overflow-hidden w-48"
                  onPress={() => router.push(`/(traveler)/(experience)/${item.experience_id}`)}
                >
                  <View className="w-full h-32 bg-gray-200 items-center justify-center">
                    <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                  </View>
                  <View className="p-3">
                    <Text className="font-onest-medium text-sm" numberOfLines={2}>
                      {item.experience_title}
                    </Text>
                    <Text className="text-xs text-gray-500 font-onest mt-1">
                      Saved {new Date(item.saved_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Notification Settings */}
        <View className="mb-6">
          <Text className="px-6 text-xl font-onest-semibold text-gray-800 mb-4">Notifications</Text>
          <View className="bg-white mx-4 rounded-2xl overflow-hidden">
            {/* Trip Reminders */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <View className="flex-1 mr-4">
                <Text className="font-onest-medium text-gray-800">Trip Reminders</Text>
                <Text className="text-xs text-gray-500 font-onest mt-1">
                  Get notified about upcoming trips
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#e5e7eb", true: "#4F46E5" }}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#e5e7eb"
                onValueChange={() => toggleSwitch('tripReminders')}
                value={notificationSettings.tripReminders}
              />
            </View>

            {/* Itinerary Updates */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <View className="flex-1 mr-4">
                <Text className="font-onest-medium text-gray-800">Itinerary Updates</Text>
                <Text className="text-xs text-gray-500 font-onest mt-1">
                  Stay informed about changes to your plans
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#e5e7eb", true: "#4F46E5" }}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#e5e7eb"
                onValueChange={() => toggleSwitch('itineraryUpdates')}
                value={notificationSettings.itineraryUpdates}
              />
            </View>

            {/* Nearby Experiences */}
            <View className="p-4 flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="font-onest-medium text-gray-800">Nearby Experiences</Text>
                <Text className="text-xs text-gray-500 font-onest mt-1">
                  Discover activities around you
                </Text>
              </View>
              <Switch
                trackColor={{ false: "#e5e7eb", true: "#4F46E5" }}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#e5e7eb"
                onValueChange={() => toggleSwitch('nearbyExperiences')}
                value={notificationSettings.nearbyExperiences}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center mb-3"
            onPress={() => router.push('/(traveler)/(profile)/account-settings')}
            style={{
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#E5E7EB" />
            <Text className="ml-2 text-gray-200 font-onest-semibold">Account Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-gray-300 rounded-2xl py-4 flex-row items-center justify-center"
            onPress={() => router.push('/(traveler)/(support)')}
          >
            <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            <Text className="ml-2 text-gray-700 font-onest-medium">Help & Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;