// components/itinerary/TabNavigation.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export type TabType = 'overview' | 'tripplan' | 'payment';

interface Tab {
    key: TabType;
    label: string;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
}

const TABS: Tab[] = [
    { key: 'overview', label: 'Overview', iconActive: 'grid', iconInactive: 'grid-outline' },
    { key: 'tripplan', label: 'Trip Plan', iconActive: 'map', iconInactive: 'map-outline' },
    { key: 'payment', label: 'Payment', iconActive: 'card', iconInactive: 'card-outline' },
];

interface Props {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    paymentBadge?: number;
}

export function TabNavigation({ activeTab, onTabChange, paymentBadge }: Props) {
    return (
        <View className="flex-row">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                const showBadge = tab.key === 'payment' && paymentBadge !== undefined && paymentBadge > 0;
                const badgeText = paymentBadge !== undefined && paymentBadge > 9 ? '9+' : String(paymentBadge);

                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => onTabChange(tab.key)}
                        className={`flex-1 flex-row items-center relative px-6 mx-4 justify-start pb-4 
                            `}
                    >

                        <View

                        >
                            <Text className={` text-sm font-onest-medium pb-2   ${isActive ? 'text-primary  border-b-2 border-primary rounded-lg ' : 'border-b-[#fff]   text-gray-400'}`}>
                                {tab.label}
                            </Text>

                            {/* {showBadge && (
                                <View className=" bg-blue-500 rounded-full absolute  -right-1 min-w-[18px]  items-center">
                                    <Text className="text-white text-xs font-onest-medium">
                                        {badgeText}
                                    </Text>
                                </View>
                            )} */}
                        </View>

                    </Pressable>
                );
            })}
        </View>
    );
}