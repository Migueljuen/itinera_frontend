import AvailabilityCalendar from "@/components/AvailablityCalendar"; // Adjust path as needed
import { ItineraryItem } from "@/types/itineraryTypes"; // Adjust path as needed
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AvailabilityModalProps = {
    visible: boolean;
    onClose: () => void;
    experienceId: number;
    tripStartDate: string;
    tripEndDate: string;
    selectedItems: ItineraryItem[];
    onTimeSlotSelect: (item: ItineraryItem) => void;
    onTimeSlotDeselect: (item: ItineraryItem) => void;
    onConfirm: () => void;
};

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
    visible,
    onClose,
    experienceId,
    tripStartDate,
    tripEndDate,
    selectedItems,
    onTimeSlotSelect,
    onTimeSlotDeselect,
    onConfirm,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
            >
                <SafeAreaView
                    edges={["bottom"]}
                    className="bg-white rounded-t-3xl"
                    style={{ maxHeight: "90%" }}
                >
                    {/* Modal Header */}
                    <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                        <Text className="text-xl font-onest-semibold text-black/90">
                            Select Availability
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Modal Content */}
                    <View className="px-6 py-4">
                        <AvailabilityCalendar
                            experienceId={experienceId}
                            tripStartDate={tripStartDate}
                            tripEndDate={tripEndDate}
                            selectedItems={selectedItems}
                            onTimeSlotSelect={onTimeSlotSelect}
                            onTimeSlotDeselect={onTimeSlotDeselect}
                        />
                    </View>

                    {/* Modal Footer */}
                    <View className="px-6 py-4 border-t border-gray-200">
                        <TouchableOpacity
                            className="bg-primary py-4 rounded-2xl items-center"
                            onPress={onConfirm}
                        >
                            <Text className="text-white font-onest-semibold">
                                Confirm Selection
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default AvailabilityModal;