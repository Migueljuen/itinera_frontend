// AvailabilityModal.tsx
import AvailabilityCalendar from "@/components/AvailablityCalendar";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Dimensions, Modal, Text, TouchableOpacity, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;

type AvailabilityModalProps = {
    visible: boolean;
    onClose: () => void;
    experienceId: number;
    tripStartDate: string;
    tripEndDate: string;

    // numeric price fallback
    price?: number;

    // NEW: estimate fallback
    price_estimate?: string | null;
};

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
    visible,
    onClose,
    experienceId,
    tripStartDate,
    tripEndDate,
    price,
    price_estimate,
}) => {
    const [adults, setAdults] = useState(1);
    const [showChildren, setShowChildren] = useState(false);
    const [children, setChildren] = useState(0);

    const handleAdultsChange = (delta: number) => {
        const newValue = Math.max(1, adults + delta);
        setAdults(newValue);
    };

    const handleChildrenChange = (delta: number) => {
        const newValue = Math.max(0, children + delta);
        setChildren(newValue);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View
                style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: "rgba(0,0,0,0.5)",
                }}
            >
                <View
                    style={{
                        height: MODAL_HEIGHT,
                        backgroundColor: "white",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                    }}
                >
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 20,
                            paddingTop: 20,
                            paddingBottom: 16,
                        }}
                    >
                        <Text style={{ fontSize: 24, fontWeight: "600", color: "#000" }}>Select a time</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Guest Counter */}
                    <View
                        style={{
                            paddingHorizontal: 20,
                            paddingBottom: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "#E5E7EB",
                        }}
                        className="hidden"
                    >
                        {/* Adults Row */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View>
                                <Text style={{ fontSize: 16, fontWeight: "500", color: "#000" }}>
                                    {adults} adult{adults !== 1 ? "s" : ""}
                                </Text>
                                {!showChildren && (
                                    <TouchableOpacity onPress={() => setShowChildren(true)}>
                                        <Text style={{ fontSize: 14, color: "#6B7280", textDecorationLine: "underline" }}>
                                            Add children
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <TouchableOpacity
                                    onPress={() => handleAdultsChange(-1)}
                                    disabled={adults <= 1}
                                    style={{ paddingHorizontal: 12, paddingVertical: 4, opacity: adults <= 1 ? 0.3 : 1 }}
                                >
                                    <Text style={{ fontSize: 24, color: "#9CA3AF" }}>−</Text>
                                </TouchableOpacity>
                                <Text style={{ fontSize: 18, fontWeight: "500", color: "#000", width: 32, textAlign: "center" }}>
                                    {adults}
                                </Text>
                                <TouchableOpacity onPress={() => handleAdultsChange(1)} style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
                                    <Text style={{ fontSize: 24, color: "#4B5563" }}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Children Row */}
                        {showChildren && (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTopWidth: 1,
                                    borderTopColor: "#F3F4F6",
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: "500", color: "#000" }}>
                                    {children} child{children !== 1 ? "ren" : ""}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TouchableOpacity
                                        onPress={() => handleChildrenChange(-1)}
                                        disabled={children <= 0}
                                        style={{ paddingHorizontal: 12, paddingVertical: 4, opacity: children <= 0 ? 0.3 : 1 }}
                                    >
                                        <Text style={{ fontSize: 24, color: "#9CA3AF" }}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 18, fontWeight: "500", color: "#000", width: 32, textAlign: "center" }}>
                                        {children}
                                    </Text>
                                    <TouchableOpacity onPress={() => handleChildrenChange(1)} style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
                                        <Text style={{ fontSize: 24, color: "#4B5563" }}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Calendar Content */}
                    <View style={{ flex: 1, paddingHorizontal: 20 }}>
                        <AvailabilityCalendar
                            experienceId={experienceId}
                            tripStartDate={tripStartDate}
                            tripEndDate={tripEndDate}
                            pricePerGuest={price}
                            priceEstimate={price_estimate}   // ✅ pass estimate fallback
                        />
                    </View>

                    {/* Bottom safe area padding */}
                    <View style={{ height: 34 }} />
                </View>
            </View>
        </Modal>
    );
};

export default AvailabilityModal;
