// components/itinerary/BookingPaymentItem.tsx

import { BookingPayment } from '@/types/bookingPayment';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
    booking: BookingPayment;
    onPayNow: (booking: BookingPayment) => void;
}

export function BookingPaymentItem({ booking, onPayNow }: Props) {
    const isPaid = booking.payment_status === 'Paid';
    const isPending = booking.payment_status === 'Pending';
    const isUnpaid = booking.payment_status === 'Unpaid';

    const getServiceTypeLabel = (type: string) => {
        switch (type) {
            case 'experience':
                return 'Activity';
            case 'guide':
                return 'Guide';
            case 'driver':
                return 'Driver';
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <View className="flex-row items-center py-4 bg-[#fff]">
            {/* Status Icon */}
            <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isPaid ? 'bg-green-100' : isPending ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}
            >
                {isPaid ? (
                    <Ionicons name="checkmark" size={18} color="#059669" />
                ) : isPending ? (
                    <Ionicons name="time" size={18} color="#D97706" />
                ) : (
                    <Ionicons name="card-outline" size={18} color="#6B7280" />
                )}
            </View>

            {/* Booking Info */}
            <View className="flex-1 mr-3">
                <Text className="text-sm font-onest-medium text-black/90" numberOfLines={1}>
                    {booking.experience_name}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Text className="text-xs font-onest text-black/50">
                        {getServiceTypeLabel(booking.service_type)}
                    </Text>
                    {booking.booking_date && (
                        <>
                            <Text className="text-xs font-onest text-black/30 mx-1">•</Text>
                            <Text className="text-xs font-onest text-black/50">
                                {formatDate(booking.booking_date)}
                            </Text>
                        </>
                    )}

                    <Text className="text-xs font-onest text-black/30 mx-1">•</Text>
                    <Text className="text-xs font-onest text-black/90 ">
                        ₱{Number(booking.activity_price).toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* Price & Action */}
            <View className="items-end">


                {isPaid && (
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                        <Text className="text-xs font-onest-medium text-green-700">Paid</Text>
                    </View>
                )}

                {isPending && (
                    <View className="bg-yellow-100 px-2 py-1 rounded-full">
                        <Text className="text-xs font-onest-medium text-yellow-700">Pending</Text>
                    </View>
                )}

                {isUnpaid && (
                    <Pressable
                        className="bg-primary px-3 py-1.5 rounded-full active:opacity-80"
                        onPress={() => onPayNow(booking)}
                    >
                        <Text className="text-sm font-onest-semibold text-white">Pay</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}