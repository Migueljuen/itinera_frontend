//(tabs)/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Tabs, useRouter } from "expo-router";
import React, { memo, useEffect, useState } from "react";
import {
  Animated,
  DeviceEventEmitter,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Trip from "../../../assets/icons/calendar1.svg";
import Inbox from "../../../assets/icons/envelope.svg";
import HomeIcon from "../../../assets/icons/home.svg";
import Plus from "../../../assets/icons/plus.svg";
import Profile from "../../../assets/icons/user.svg";
import API_URL from "../../../constants/api";
import { useRefresh } from "../../../contexts/RefreshContext";
import { NotificationEvents } from "../../../utils/notificationEvents";

const TabIcon = memo(({ focused, icon: Icon, title, badge }: any) => {
  const iconColor = focused ? "#274b46" : "#65676b";
  const textColor = focused ? "#274b46" : "#65676b";

  return (
    <View className="flex w-full flex-1 min-w-[112px] min-h-16 mt-4 justify-center flex-col items-center">
      <View className="relative">
        <Icon
          width={24}
          height={24}
          fill="none"
          stroke={iconColor}
          strokeWidth={1.5}
        />
        {/* Badge */}
        {badge > 0 && (
          <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center">
            <Text className="text-white text-[10px] font-onest-medium">
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-sm mt-2"
        style={{
          fontFamily: focused ? "Onest-Medium" : "Onest-Regular",
          color: textColor,
        }}
      >
        {title}
      </Text>
      {/* Underline indicator */}

      <View
        className={`${focused ? "bg-[#274b46]" : "bg-transparent"}`}
        style={{
          height: 2,

          width: "50%",
          marginTop: 4,
          borderRadius: 1,
        }}
      />

    </View>
  );
});

const _layout = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const { profileUpdated } = useRefresh();
  const router = useRouter();
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Check if user has seen the tooltip
  useEffect(() => {
    const checkFirstTime = async () => {
      await AsyncStorage.removeItem("hasSeenCreateTooltip");
      const hasSeenTooltip = await AsyncStorage.getItem("hasSeenCreateTooltip");
      if (!hasSeenTooltip) {
        // Show tooltip after a short delay
        setTimeout(() => {
          setShowTooltip(true);
          startPulseAnimation();
        }, 1000);
      }
    };
    checkFirstTime();
  }, []);

  // Pulse animation for the tooltip
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const dismissTooltip = async () => {
    setShowTooltip(false);
    await AsyncStorage.setItem("hasSeenCreateTooltip", "true");
  };

  // Function to fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API_URL}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
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
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarItemStyle: {
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarStyle: {
            height: 110,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            position: "absolute",

            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: -1 },
            shadowRadius: 3,
            overflow: "visible",
            paddingTop: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={HomeIcon} title="Home" />
            ),
          }}
        />

        <Tabs.Screen
          name="trips"
          options={{
            title: "Trips",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={Trip} title="Trips" />
            ),
          }}
        />

        <Tabs.Screen
          name="selectionScreen"
          options={{
            title: "Create",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  position: "absolute",
                  top: -30,
                  width: 56,
                  height: 56,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >

                <View
                  style={{
                    position: "absolute",
                    top: 22,
                    width: 70,
                    height: 35,
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 35,
                    borderTopRightRadius: 35,
                  }}
                />
                <View
                  style={{
                    backgroundColor: "#191313",
                    //  backgroundColor: "#7dcb80",
                    borderRadius: 28,
                    width: 56,
                    height: 56,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                  }}
                >
                  <Plus
                    width={28}
                    height={28}
                    fill="#ffffff"
                    color="fff"
                    strokeWidth={2}
                    stroke="#ffffff"
                  />
                </View>
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push("/(createItinerary)/selectionScreen");
            },
          }}
        />

        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon={Inbox}
                title="Inbox"
                badge={unreadCount}
              />
            ),
          }}
          listeners={({ navigation }) => ({
            focus: () => {
              fetchUnreadCount();
            },
            tabPress: () => {
              setTimeout(() => {
                fetchUnreadCount();
              }, 100);
            },
          })}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={Profile} title="Profile" />
            ),
          }}
        />
      </Tabs>

      {/* Tooltip Overlay */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={dismissTooltip}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPress={dismissTooltip}
        >
          <View style={{ position: "absolute", bottom: 150 }}>
            {/* Tooltip content */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                maxWidth: 280,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Onest-SemiBold",
                  color: "#1f2937",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Create Your First Trip!
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Onest-Regular",
                  color: "#9CA3AF",
                  textAlign: "center",
                  marginBottom: 16,
                  lineHeight: 20,
                }}
              >
                Tap the button to start planning your adventure
              </Text>
              <TouchableOpacity
                onPress={dismissTooltip}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#191313",
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontFamily: "Onest-Medium",
                    textAlign: "center",
                  }}
                >
                  Got it
                </Text>
              </TouchableOpacity>
            </View>

            {/* Arrow pointing down */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 12,
                borderRightWidth: 12,
                borderTopWidth: 12,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#fff",
                alignSelf: "center",
                marginTop: -1,
              }}
            />
          </View>

          {/* Highlight ring around create button */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: 68,
              width: 56,
              height: 56,
              borderRadius: 32,
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.8)",
              transform: [{ scale: pulseAnim }],
            }}
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default _layout;