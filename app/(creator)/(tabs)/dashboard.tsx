import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import Star from '../../../assets/icons/star.svg';
import Star1 from '../../../assets/icons/star1.svg';
import Booking from '../../../assets/icons/booking.svg';
import API_URL from '../../../constants/api';

interface Stats {
  totalBookings: number;
  avgRating: number;
  activeBooking: number;
}

interface expStats {
  active: number;
  draft: number;
  inactive: number;
}

const CreatorDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>('Sarah');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('Active');
  const [stats, setStats] = useState<Stats>({
    totalBookings: 85,
    avgRating: 4.8,
    activeBooking: 12
  });

  const [expStats, setExpStats] = useState<expStats>({
    active: 4,
    draft: 2,
    inactive: 3
  });




  return (
    <SafeAreaView className='bg-gray-50' style={styles.AndroidSafeArea}>
      <View className='w-full h-screen'>
        <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 142 }}>
          <View className='flex items-center justify-between flex-row p-6'>
            <View className="">
              <Text className="text-normal text-3xl font-onest-semibold">Creator Dashboard</Text>
              <Text className="text-gray-400 font-onest">Manage your account</Text>
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

          {/* Stats Overview */}
          <View className="flex-row justify-center px-8 mb-6">
            <View className="items-center justify-between bg-white p-4 rounded-xl w-1/3 mr-2 shadow-sm border border-gray-100">
              <View className="w-10 h-10 rounded-full items-center justify-center mb-2">
                <Booking />
              </View>
              <Text className="text-2xl font-onest-semibold">{stats.totalBookings}</Text>
              <Text className="text-xs text-gray-500">Total Bookings</Text>
            </View>
            <View className="items-center justify-between bg-white p-4 rounded-xl w-1/3 mx-1 shadow-sm border border-gray-100">
              <View className="w-10 h-10 rounded-full items-center justify-center mb-2">
                <Star />
              </View>
              <Text className="text-2xl font-onest-semibold">{stats.avgRating}</Text>
              <Text className="text-xs text-gray-500">Avg. Rating</Text>
            </View>
            <View className="items-center justify-between bg-white p-4 rounded-xl w-1/3 ml-2 shadow-sm border border-gray-100">
              <View className=" w-10 h-10 rounded-full items-center justify-center mb-2">
                <View className='rounded-full size-5 bg-green-600'></View>
              </View>
              <Text className="text-2xl font-onest-semibold">{stats.activeBooking}</Text>
              <Text className="text-xs text-gray-500">Active Bookings </Text>
            </View>
          </View>


          {/* experience Overview */}
          <View>
            <Text className="text-normal text-xl font-onest-medium px-6 py-4">My Experiences</Text>

            {/* Experience Overview */}
            <View className="flex-row justify-center px-8 mb-6">
              <View className="items-center justify-between bg-white p-4 rounded-xl w-1/3 mr-2 shadow-sm border border-gray-100">
                <View className=" w-10 h-10 rounded-full items-center justify-center mb-2">
                  <View className='rounded-full size-5 bg-green-600'></View>
                </View>
                <Text className="text-2xl font-onest-semibold">{expStats.active}</Text>
                <Text className="text-xs text-gray-500">Active</Text>
              </View>
              <View className="items-center justify-between bg-white p-4 rounded-xl w-1/3 mx-1 shadow-sm border border-gray-100">
                <View className=" w-10 h-10 rounded-full items-center justify-center mb-2">
                  <View className='rounded-full size-5 bg-yellow-400'></View>
                </View>
                <Text className="text-2xl font-onest-semibold">{expStats.draft}</Text>
                <Text className="text-xs text-gray-500">Draft</Text>
              </View>
              <View className="items-center justify-between bg-white p-4 rounded-xl w-1/3 ml-2 shadow-sm border border-gray-100">
                <View className=" w-10 h-10 rounded-full items-center justify-center mb-2">
                  <View className='rounded-full size-5 bg-gray-300'></View>
                </View>
                <Text className="text-2xl font-onest-semibold">{expStats.inactive}</Text>
                <Text className="text-xs text-gray-500">Inactive </Text>
              </View>
            </View>
          </View>

          {/* feedback Overview */}
          <View>
            <Text className="text-normal text-xl font-onest-medium px-6 py-4">Recent Feedbacks</Text>


            <View className="flex-col justify-center px-5 mb-6 gap-4">

              <View className="items-start justify-between bg-white  rounded-xl w-full shadow-sm border border-gray-100 p-4">
                <View className='flex-row justify-between gap-3 items-center '>
                  <Image
                    source={require('../../../assets/images/person.png')}
                    style={{ width: 30, height: 30, borderRadius: 25 }}
                  />
                  <View>
                    <Text className='font-onest-medium'>Miguel</Text>
                    <Text className='text-sm text-gray-500 font-onest'>March 11, 2025</Text>

                  </View>
                </View>
                <View className='flex-row items-center mt-1 '>
                  <Star1 fill="#3b82f6" />
                  <Star1 />
                  <Star1 />
                  <Star1 />
                  <Star1 />
                </View>
              </View>

              <View className="items-start justify-between bg-white  rounded-xl w-full shadow-sm border border-gray-100 p-4">
                <View className='flex-row justify-between gap-3 items-center '>
                  <Image
                    source={require('../../../assets/images/avatar-placeholder.png')}
                    style={{ width: 30, height: 30, borderRadius: 25 }}
                  />
                  <View>
                    <Text className='font-onest-medium'>Jonathan</Text>
                    <Text className='text-sm text-gray-500 font-onest'>May 01, 2025</Text>

                  </View>
                </View>
                <View className='flex-row items-center mt-1 '>
                  <Star1 fill="#3b82f6" />
                  <Star1 fill="#3b82f6" />
                  <Star1 fill="#3b82f6" />
                  <Star1 />
                  <Star1 />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  AndroidSafeArea: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  }
});
export default CreatorDashboard;