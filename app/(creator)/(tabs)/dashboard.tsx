import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import Heart from '../../../assets/icons/heart.svg';
import Star from '../../../assets/icons/star.svg';
import Booking from '../../../assets/icons/booking.svg';
import API_URL from '../../../constants/api';
interface Experience {
  id: string;
  title: string;
  location: string;
  price: number;
  unit: string;
  status: 'Active' | 'Draft' | 'Inactive';
  bookings: number;
  rating: number;
  images: string[];
}

interface Stats {
  totalBookings: number;
  avgRating: number;
  activeExperiences: number;
}

const CreatorDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>('Sarah');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('Active');
  const [myExperiences, setMyExperiences] = useState<Experience[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBookings: 85,
    avgRating: 4.8,
    activeExperiences: 12
  });

  // Dummy data for demonstration
  const dummyExperiences: Experience[] = [
    {
      id: '1',
      title: 'Sunrise Hike & Breakfast',
      location: 'Mount Rainier, WA',
      price: 79,
      unit: 'per person',
      status: 'Active',
      bookings: 34,
      rating: 4.9,
      images: ['experiences/hike1.jpg']
    },
    {
      id: '2',
      title: 'Wine Tasting Tour',
      location: 'Napa Valley, CA',
      price: 149,
      unit: 'per person',
      status: 'Active',
      bookings: 28,
      rating: 4.7,
      images: ['experiences/wine.jpg']
    },
    {
      id: '3',
      title: 'City Architecture Walk',
      location: 'Chicago, IL',
      price: 65,
      unit: 'per person',
      status: 'Draft',
      bookings: 0,
      rating: 0,
      images: ['experiences/arch.jpg']
    },
    {
      id: '4',
      title: 'Kayaking Adventure',
      location: 'Seattle, WA',
      price: 95,
      unit: 'per person',
      status: 'Inactive',
      bookings: 23,
      rating: 4.6,
      images: ['experiences/kayak.jpg']
    }
  ];

  useEffect(() => {
    // Simulating API fetch
    setLoading(true);
    setTimeout(() => {
      setMyExperiences(dummyExperiences);
      setLoading(false);
    }, 800);
  }, []);

  const filteredExperiences: Experience[] = myExperiences.filter(exp => {
    // Filter by search text
    const matchesSearch = exp.title.toLowerCase().includes(searchText.toLowerCase()) ||
      exp.location.toLowerCase().includes(searchText.toLowerCase());

    // Filter by selected tab (status)
    const matchesTab = selectedTab === 'All' || exp.status === selectedTab;

    return matchesSearch && matchesTab;
  });

  const tabs: string[] = ['All', 'Active', 'Draft', 'Inactive'];

  return (
    <SafeAreaView className='bg-gray-50'>
      <View className='w-full h-screen'>
        <ScrollView className='flex-1' contentContainerStyle={{ paddingBottom: 142 }}>
          <View className='flex items-center justify-between flex-row p-6'>
            <View className="">
              <Text className="text-normal text-3xl font-onest-semibold">Creator Dashboard</Text>
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
              <Text className="text-2xl font-onest-semibold">{stats.activeExperiences}</Text>
              <Text className="text-xs text-gray-500">Active </Text>
            </View>
          </View>



          <View className="px-6 py-8">
            <Text className="text-normal text-xl font-onest-medium">My Experiences</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab, index) => {
                const isSelected = selectedTab === tab;
                return (
                  <TouchableOpacity
                    key={index}
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
                filteredExperiences.map((item) => (
                  <View
                    key={item.id}
                    className="w-full bg-white rounded-xl overflow-hidden mb-6 border border-gray-200"
                  >
                    <View className="relative">
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
                      <View className={`absolute top-3 right-3 px-3 py-1 rounded-full ${item.status === 'Active' ? 'bg-green-100' :
                        item.status === 'Draft' ? 'bg-amber-100' : 'bg-gray-100'
                        }`}>
                        <Text className={`text-xs font-medium ${item.status === 'Active' ? 'text-green-800' :
                          item.status === 'Draft' ? 'text-amber-800' : 'text-gray-800'
                          }`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-base font-semibold">{item.title}</Text>
                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="text-sm text-gray-600">{item.location}</Text>
                      </View>
                      <View className="flex-row justify-between mt-2">
                        <Text className="text-base font-bold text-blue-500">
                          ${item.price}
                        </Text>
                        <Text className="text-xs text-gray-500">{item.unit}</Text>
                      </View>

                      {/* Stats and actions */}
                      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100 justify-between">
                        <View className="flex-row">
                          <View className="flex-row items-center mr-4">
                            <Image
                              source={require('../../../assets/icons/heart.svg')}
                              className="w-3.5 h-3.5"
                              resizeMode="contain"
                            />
                            <Text className="text-xs text-gray-500 ml-1">{item.bookings} bookings</Text>
                          </View>
                          {item.rating > 0 && (
                            <View className="flex-row items-center">
                              <Image
                                source={require('../../../assets/icons/heart.svg')}
                                className="w-3.5 h-3.5"
                                resizeMode="contain"
                              />
                              <Text className="text-xs text-gray-500 ml-1">{item.rating}</Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row">
                          <TouchableOpacity
                            className="p-2 mr-2"
                            onPress={() => router.push(`/(creator)/edit/${item.id}`)}
                          >
                            <Image
                              source={require('../../../assets/icons/heart.svg')}
                              className="w-4.5 h-4.5"
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="p-2"
                            onPress={() => console.log('Delete experience')}
                          >
                            <Image
                              source={require('../../../assets/icons/heart.svg')}
                              className="w-4.5 h-4.5"
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          className="absolute bottom-48 right-6 bg-primary rounded-full p-4 shadow-md flex-row items-center"
          onPress={() => router.push('/(creator)/new')}
        >
          <View className="flex-row items-center">
            <Image
              source={require('../../../assets/icons/heart.svg')}
              className="w-5 h-5"
              resizeMode="contain"
            />
            <Text className="text-gray-300 font-onest ml-2">Create Experience</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreatorDashboard;