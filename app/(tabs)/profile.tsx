import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  useWindowDimensions
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
const ProfileScreen = () => {
  const { height } = useWindowDimensions();
  const bottom = useBottomTabBarHeight();
  const { user, logout } = useAuth();

  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigation.replace('(login)'); // Use navigation to go to 'Login' screen
    }
  };

  // Static user data
  const userData = {
    name: "Dexter Morgan",
    location: "Banago, USA",
    avatar: require('../../assets/images/avatar-placeholder.png'), // Replace with your avatar path
    metrics: {
      tripsCompleted: 8,
      itinerariesCreated: 12,
      savedExperiences: 24
    },
    interests: ["Hiking", "Beaches", "Food Tours", "Museums", "Photography"]
  };

  // Notification settings with toggle state
  const [notificationSettings, setNotificationSettings] = useState({
    tripReminders: true,
    specialOffers: false,
    nearbyExperiences: true
  });

  const toggleSwitch = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prevState => ({
      ...prevState,
      [setting]: !prevState[setting]
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="flex items-start p-6">
          <Text className="text-3xl font-onest-semibold text-gray-800">My Profile</Text>
          <Text className="text-gray-400 font-onest">Manage your travel preferences</Text>

          <TouchableOpacity onPress={handleLogout}>
            <Text>Logout</Text>
          </TouchableOpacity>

        </View>

        {/* Profile Summary */}
        <View className="bg-white mx-4 rounded-xl p-5 shadow-sm">
          <View className="items-center mb-4">
            {/* Avatar with edit button overlay */}
            <View className="relative">
              <Image
                source={userData.avatar}
                className="w-24 h-24 rounded-full"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-primary rounded-full p-2"
                onPress={() => console.log('Edit avatar')}
              >
                <Image
                  source={require('../../assets/icons/pencil.svg')}

                  className="w-4 h-4"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Name and Location */}
            <Text className="text-xl font-onest-semibold mt-3">{userData.name}</Text>
            <View className="flex-row items-center mt-1">
              <Image
                source={require('../../assets/icons/edit.png')}
                className="w-4 h-4 mr-1 opacity-60"
              />
              <Text className="text-sm text-gray-600 font-onest">{userData.location}</Text>
            </View>
          </View>
        </View>

        {/* Activity Metrics */}
        <View className="mt-6">
          <Text className="px-6 text-lg font-onest-semibold text-gray-800 mb-3">Activity Metrics</Text>
          <View className="flex-row justify-between mx-4">
            {/* Trips Completed */}
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mx-1">
              <Text className="text-2xl font-onest-semibold text-center text-primary">{userData.metrics.tripsCompleted}</Text>
              <Text className="text-xs text-gray-500 font-onest text-center mt-1">Trips Completed</Text>
            </View>

            {/* Itineraries Created */}
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mx-1">
              <Text className="text-2xl font-onest-semibold text-center text-primary">{userData.metrics.itinerariesCreated}</Text>
              <Text className="text-xs text-gray-500 font-onest text-center mt-1">Itineraries Created</Text>
            </View>

            {/* Saved Experiences */}
            <View className="bg-white rounded-xl p-4 shadow-sm flex-1 mx-1">
              <Text className="text-2xl font-onest-semibold text-center text-primary">{userData.metrics.savedExperiences}</Text>
              <Text className="text-xs text-gray-500 font-onest text-center mt-1">Saved Experiences</Text>
            </View>
          </View>
        </View>

        {/* Travel Interests */}
        <View className="mt-6">
          <Text className="px-6 text-lg font-onest-semibold text-gray-800 mb-3">Travel Interests</Text>
          <View className="bg-white mx-4 rounded-xl p-5 shadow-sm">
            <View className="flex-row flex-wrap">
              {userData.interests.map((interest, index) => (
                <View
                  key={index}
                  className="bg-gray-100 rounded-full px-3 py-1 m-1"
                >
                  <Text className="text-sm text-gray-700 font-onest-medium">{interest}</Text>
                </View>
              ))}
              <TouchableOpacity
                className="bg-gray-200 rounded-full px-3 py-1 m-1 flex-row items-center"
                onPress={() => console.log('Add interest')}
              >
                <Text className="text-sm text-gray-600 font-onest-medium mr-1">Add</Text>
                <Image
                  source={require('../../assets/icons/plus.png')}
                  className="w-3 h-3 opacity-60"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View className="mt-6">
          <Text className="px-6 text-lg font-onest-semibold text-gray-800 mb-3">Notification Settings</Text>
          <View className="bg-white mx-4 rounded-xl shadow-sm">
            {/* Trip Reminders Toggle */}
            <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
              <View>
                <Text className="font-onest-medium">Trip Reminders</Text>
                <Text className="text-xs text-gray-500 font-onest mt-1">Get notified about upcoming trips</Text>
              </View>
              <Switch
                trackColor={{ false: "#e5e7eb", true: "#1f2937" }}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#e5e7eb"
                onValueChange={() => toggleSwitch('tripReminders')}
                value={notificationSettings.tripReminders}
              />
            </View>



            {/* Nearby Experiences Toggle */}
            <View className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="font-onest-medium">Nearby Experiences</Text>
                <Text className="text-xs text-gray-500 font-onest mt-1">Get alerts about local activities</Text>
              </View>
              <Switch
                trackColor={{ false: "#e5e7eb", true: "#1f2937" }}
                thumbColor={"#ffffff"}
                ios_backgroundColor="#e5e7eb"
                onValueChange={() => toggleSwitch('nearbyExperiences')}
                value={notificationSettings.nearbyExperiences}
              />
            </View>
          </View>
        </View>

        {/* Account Settings Button */}
        <TouchableOpacity
          className="bg-primary mx-4 rounded-xl p-4 mt-6 shadow-sm"
          onPress={() => console.log('Navigate to account settings')}
        >
          <Text className="text-center text-white font-onest-medium">Account Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView >
  );
};

export default ProfileScreen;