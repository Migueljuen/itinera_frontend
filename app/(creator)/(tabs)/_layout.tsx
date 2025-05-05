import { View, Text, ImageBackground, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { images } from '@/constants/images'
// import { icons } from '@/constants/icons'
import { useFonts } from 'expo-font';
import HomeIcon from '../../../assets/icons/home.svg'
import Trip from '../../../assets/icons/calendar1.svg'
import Adjustment from '../../../assets/icons/adjustment.svg'
import Saved from '../../../assets/icons/heart.svg'
import Profile from '../../../assets/icons/user.svg'
import Search from '../../../assets/icons/search.svg'



const TabIcon = ({ focused, icon: Icon, title }: any) => {

  if (focused) {
    return (

      <ImageBackground
        className="flex flex-col w-full min-w-[112px] min-h-16 mt-4 justify-center items-center rounded-full "
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
        </View>


        <Text className="font-onest-medium  text-[#274b46] mt-7">{title}</Text>
      </ImageBackground>


    )
  }
  return (
    <View className='flex  w-full flex-1 min-w-[112px] min-h-16 mt-4 justify-center flex-col
        items-center rounded-full overflow-hidden'>
      <Icon
        width={24}
        height={24}
        fill="#ffffff"
        stroke="#000"
        strokeWidth={1.5}
      />

      <Text className='font-onest text-sm text-[#65676b] mt-2'>{title}</Text>
    </View>
  )
}

const _layout = () => {
  const [fontsLoaded] = useFonts({
    "Onest-Medium": require('../../../assets/fonts/Onest-Medium.ttf'),
    "Onest-ExtraBold": require('../../../assets/fonts/Onest-ExtraBold.ttf'),
    "Onest-Regular": require('../../../assets/fonts/Onest-Regular.ttf'),
    "Onest-Light": require('../../../assets/fonts/Onest-Light.ttf')
  });

  if (!fontsLoaded) return null; // 👈 avoid rendering until fonts are ready


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
          elevation: 5,
          shadowColor: '#000',
          shadowOpacity: 0.01,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 5,
          overflow: 'visible',
          paddingTop: 10
        },

      }}
    >



      <Tabs.Screen
        name='dashboard'
        options={{
          title: 'dashboard',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Trip}
              title="dashboard" />
          )
        }}
      />

      <Tabs.Screen
        name='experiences'
        options={{
          title: 'experiences',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Saved}
              title="experiences" />

            // <Home  title="Saved"  focused={focused} width={24} height={24} />
          )
        }}
      />

      <Tabs.Screen
        name='bookings'
        options={{
          title: 'bookings',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Saved}
              title="bookings" />

            // <Home  title="Saved"  focused={focused} width={24} height={24} />
          )
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          headerShown:
            false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={Profile}
              size={24}
              title="Profile" />

          )
        }}
      />
    </Tabs>
  )
}

export default _layout