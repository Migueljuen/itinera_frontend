import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface UnderfilledNoticeProps {
    underfilledDays: number[];
    visible?: boolean;
}

const UnderfilledNotice: React.FC<UnderfilledNoticeProps> = ({
    underfilledDays,
    visible = true,
}) => {
    const [expanded, setExpanded] = useState(false);

    if (!visible || underfilledDays.length === 0) return null;

    return (
        <View className="bg-blue-50 border border-blue-200 rounded-xl mb-4">
            {/* Title row */}
            <TouchableOpacity
                className="flex-row items-center p-4"
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Ionicons name="alert-circle-outline" size={18} color="#1e40af" />
                <Text className="text-blue-800 font-onest-medium text-sm ml-3 flex-1">
                    Some days may have fewer activities
                </Text>
                <Ionicons
                    name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
                    size={18}
                    color="#1e40af"
                />
            </TouchableOpacity>

            {/* Collapsible content */}
            {expanded && (
                <View className="px-4 pb-4">
                    <Text className="text-blue-700 font-onest text-xs mt-1">
                        One or more days in your itinerary contain only one or no activities.
                        This may be due to:
                    </Text>

                    <View className="mt-2">
                        <Text className="text-blue-700 font-onest text-xs">
                            • Time availability of experiences
                        </Text>
                        <Text className="text-blue-700 font-onest text-xs">
                            • Your selected preferences
                        </Text>
                        <Text className="text-blue-700 font-onest text-xs">
                            • Schedule or time conflicts
                        </Text>
                    </View>

                    <Text className="text-blue-600 font-onest text-xs mt-2">
                        Affected days: {underfilledDays.map(d => `Day ${d}`).join(", ")}
                    </Text>

                    <TouchableOpacity
                        className="mt-2 self-end"
                        onPress={() => setExpanded(false)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#1e40af" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default UnderfilledNotice;
