//(tabs)/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Tabs } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import { DeviceEventEmitter, ImageBackground, Text, View } from 'react-native';
import Trip from '../../../assets/icons/calendar1.svg';
import Inbox from '../../../assets/icons/envelope.svg';
import HomeIcon from '../../../assets/icons/home.svg';
import Profile from '../../../assets/icons/user.svg';
import API_URL from '../../../constants/api';
import { useRefresh } from '../../../contexts/RefreshContext';
import { NotificationEvents } from '../../../utils/notificationEvents';

const TabIcon = memo(({ focused, icon: Icon, title, badge }: any) => {
  if (focused) {
    return (
      <ImageBackground
        className="flex flex-col w-full min-w-[112px] min-h-16 mt-4 justify-center items-center rounded-full"
      >
        <View
          className="bg-[#274b46] size-16 flex justify-center items-center rounded-full border-4 border-white focus:bg-red-400"
          style={{ position: 'absolute', top: -30 }}
        >
          <Icon
            width={24}
            height={24}
            fill="none"
            strokeWidth={1.5}
            stroke="#ededed"
          />
          {/* Badge for focused state */}
          {badge > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 px-1 items-center justify-center">
              <Text className="text-white text-xs font-onest-medium">
                {badge > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </View>
        <Text className="font-onest-medium text-[#274b46] mt-7">{title}</Text>
      </ImageBackground>
    );
  }

  return (
    <View className='flex w-full flex-1 min-w-[112px] min-h-16 mt-4 justify-center flex-col items-center rounded-full'>
      <View className="relative">
        <Icon
          width={24}
          height={24}
          fill="#ffffff"
          stroke="#000"
          strokeWidth={1.5}
        />
        {/* Badge for unfocused state */}
        {badge > 0 && (
          <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center">
            <Text className="text-white text-[10px] font-onest-medium">
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text className='font-onest text-sm text-[#65676b] mt-2'>{title}</Text>
    </View>
  );
});

const _layout = () => {

  const [unreadCount, setUnreadCount] = useState(0);
  const { profileUpdated } = useRefresh();

  // Function to fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Set up polling to check for new notifications more frequently
  useEffect(() => {
    fetchUnreadCount();

    // Reduce polling frequency to 30 seconds or use WebSocket/push notifications instead
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  // Also fetch when profileUpdated changes
  useEffect(() => {
    fetchUnreadCount();
  }, [profileUpdated]);

  // Listen for notification events
  useEffect(() => {
    const notificationListener = DeviceEventEmitter.addListener(
      NotificationEvents.NOTIFICATIONS_UPDATED,
      () => {
        fetchUnreadCount();
      }
    );

    const refreshListener = DeviceEventEmitter.addListener(
      NotificationEvents.REFRESH_NOTIFICATIONS,
      () => {
        fetchUnreadCount();
      }
    );

    return () => {
      notificationListener.remove();
      refreshListener.remove();
    };
  }, []);


  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        },
        tabBarStyle: {
          height: 100,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: 'absolute',
          borderWidth: 1,
          borderColor: '#cdcdcd',
          borderTopColor: '#cdcdcd',
          // Simplify shadows - these can be expensive
          elevation: 3, // Reduced from 5
          shadowColor: '#000',
          shadowOpacity: 0.05, // Reduced from 0.01 (this was barely visible anyway)
          shadowOffset: { width: 0, height: -1 }, // Reduced
          shadowRadius: 3, // Reduced from 5
          overflow: 'visible',
          paddingTop: 10
        },
      }}
    // screenListeners={{
    //   state: (e) => {
    //     // Refresh unread count whenever tab state changes
    //     fetchUnreadCount();
    //   }
    // }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={HomeIcon}
              title="Home"
            />
          )
        }}
      />

      <Tabs.Screen
        name='trips'
        options={{
          title: 'Trips',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Trip}
              title="Trips"
            />
          )
        }}
      />

      <Tabs.Screen
        name='inbox'

        options={{
          title: 'Inbox',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Inbox}
              title="Inbox"
              badge={unreadCount} // Pass the unread count here
            />
          )
        }}
        listeners={({ navigation }) => ({
          focus: () => {
            // Refresh count when tab is focused
            fetchUnreadCount();
          },
          tabPress: () => {
            // Also refresh when pressed
            setTimeout(() => {
              fetchUnreadCount();
            }, 100);
          }
        })}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Profile}
              size={24}
              title="Profile"
            />
          )
        }}
      />
    </Tabs>
  );
};

export default _layout;