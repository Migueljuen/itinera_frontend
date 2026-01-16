import { LocationPickerModal } from "@/components/LocationPickerModal";
import { ItineraryFormData } from "@/types/itineraryTypes";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import API_URL from "../../../../constants/api";

interface Step3aProps {
  formData: ItineraryFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItineraryFormData>>;
  onNext: (itineraryId: number) => void;
  onBack: () => void;
}

interface LocationData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface MeetingPointData {
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
}

interface TourGuide {
  guide_id: number;
  user_id: number;
  name: string;
  languages: string[] | string;
  bio: string | null;
  areas_covered: string;
  experience_years: number;
  availability_days: string[] | string;
  city: string;
  price_per_day: string | number;
  profile_pic?: string;
  avg_rating: string | number;
  review_count: number;
}

interface CarService {
  vehicle_id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  passenger_capacity: number;
  vehicle_photos?: string[] | string;
  price_per_day: string | number;
  city: string;
  driver_name: string;
  driver_id: number;
  driver_user_id: number;
  avg_rating: string | number;
  review_count: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseLanguages = (languages: string[] | string): string[] => {
  if (!languages) return [];
  if (Array.isArray(languages)) return languages;
  try {
    return JSON.parse(languages);
  } catch {
    return languages.split(',').map(lang => lang.trim());
  }
};

const formatRating = (rating: string | number): string => {
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  return (num || 0).toFixed(1);
};

const formatPrice = (price: string | number): number => {
  return typeof price === 'string' ? parseFloat(price) : price;
};

const Step3aReviewServices: React.FC<Step3aProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
}) => {
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [transportExpanded, setTransportExpanded] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<TourGuide | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarService | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showMeetingPointModal, setShowMeetingPointModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [vehicles, setVehicles] = useState<CarService[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Meeting point state
  const [meetingPoint, setMeetingPoint] = useState<MeetingPointData>({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    notes: '',
  });
  const [tempMeetingPoint, setTempMeetingPoint] = useState<MeetingPointData>({
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    notes: '',
  });

  const fetchGuides = async () => {
    setLoadingGuides(true);
    try {
      const city = (formData as any).destination || (formData.preferences as any)?.destination || '';
      const response = await fetch(`${API_URL}/services/guides${city ? `?city=${encodeURIComponent(city)}` : ''}`);
      const data = await response.json();

      if (data.success && data.guides) {
        setGuides(data.guides);
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
      Alert.alert('Error', 'Failed to load tour guides');
    } finally {
      setLoadingGuides(false);
    }
  };

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const capacity = formData.preferences?.travelerCount || 1;
      const city = (formData as any).destination || (formData.preferences as any)?.destination || '';
      const params = new URLSearchParams();
      if (capacity) params.append('capacity', capacity.toString());
      if (city) params.append('city', city);

      const response = await fetch(`${API_URL}/services/vehicles?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.vehicles) {
        setVehicles(data.vehicles);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const totalDays = useMemo(() => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.start_date, formData.end_date]);

  const guideCost = selectedGuide ? formatPrice(selectedGuide.price_per_day) * totalDays : 0;
  const carCost = selectedCar ? formatPrice(selectedCar.price_per_day) * totalDays : 0;
  const additionalCost = guideCost + carCost;
  const travelerCount = formData.preferences?.travelerCount || 1;

  const totalActivityCost = useMemo(() => {
    if (!formData.items) return 0;
    return formData.items.reduce((sum, item) => {
      const price = Number(item.price || 0);
      if (price <= 0) return sum;
      if (item.unit?.toLowerCase() === "entry" || item.unit?.toLowerCase() === "person") {
        return sum + price * travelerCount;
      }
      return sum + price;
    }, 0);
  }, [formData.items, travelerCount]);

  const availableVehicles = vehicles.filter((car) => car.passenger_capacity >= travelerCount);
  const totalActivities = formData.items?.length || 0;

  // Check if any service is selected (guide or driver)
  const hasSelectedService = selectedGuide !== null || selectedCar !== null;
  const hasMeetingPoint = meetingPoint.name.trim() !== '' || meetingPoint.address.trim() !== '';

  const handleGuideSelect = (guide: TourGuide) => {
    setSelectedGuide(guide);
    setShowGuideModal(false);
    if (!guideExpanded) setGuideExpanded(true);
  };

  const handleCarSelect = (car: CarService) => {
    setSelectedCar(car);
    setShowCarModal(false);
    if (!transportExpanded) setTransportExpanded(true);
  };

  const openGuideModal = () => {
    setShowGuideModal(true);
    if (guides.length === 0) {
      fetchGuides();
    }
  };

  const openCarModal = () => {
    setShowCarModal(true);
    if (vehicles.length === 0) {
      fetchVehicles();
    }
  };

  const openMeetingPointModal = () => {
    setTempMeetingPoint({ ...meetingPoint });
    setShowMeetingPointModal(true);
  };

  const handleLocationSelected = (location: LocationData) => {
    setTempMeetingPoint(prev => ({
      ...prev,
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  };

  const saveMeetingPoint = () => {
    if (!tempMeetingPoint.name.trim() && !tempMeetingPoint.address.trim()) {
      Alert.alert('Required', 'Please enter a location name or address');
      return;
    }
    setMeetingPoint({ ...tempMeetingPoint });
    setShowMeetingPointModal(false);
  };

  const clearMeetingPoint = () => {
    setMeetingPoint({
      name: '',
      address: '',
      latitude: null,
      longitude: null,
      notes: '',
    });
  };

  const handleContinue = async () => {
    if (saving) return;

    if (!formData.items || formData.items.length === 0) {
      Alert.alert(
        "Cannot Save",
        "Your itinerary has no activities. Please go back to adjust your preferences.",
        [{ text: "OK" }]
      );
      return;
    }

    setSaving(true);

    try {
      // Build service assignments array
      const serviceAssignments: Array<{
        service_type: 'Guide' | 'Driver';
        provider_id: number;
        provider_profile_id: number;
        price: number;
      }> = [];

      if (selectedGuide) {
        serviceAssignments.push({
          service_type: 'Guide',
          provider_id: selectedGuide.user_id,
          provider_profile_id: selectedGuide.guide_id,
          price: guideCost,
        });
      }

      if (selectedCar) {
        serviceAssignments.push({
          service_type: 'Driver',
          provider_id: selectedCar.driver_user_id,
          provider_profile_id: selectedCar.driver_id,
          price: carCost,
        });
      }

      // Build meeting point data (only if service selected and meeting point provided)
      const meetingPointData = hasSelectedService && hasMeetingPoint ? {
        requested_name: meetingPoint.name,
        requested_address: meetingPoint.address,
        requested_latitude: meetingPoint.latitude,
        requested_longitude: meetingPoint.longitude,
        requested_notes: meetingPoint.notes,
      } : null;

      const response = await fetch(`${API_URL}/itinerary/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traveler_id: formData.traveler_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          title: formData.title,
          notes: formData.notes,
          items: formData.items,
          total_cost: totalActivityCost,
          traveler_count: formData.preferences?.travelerCount || 1,
          service_assignments: serviceAssignments,
          meeting_point: meetingPointData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to save itinerary");
      }

      if (!data.itinerary_id) {
        throw new Error("No itinerary ID returned from server");
      }

      const updatedFormData = {
        ...formData,
        tourGuide: selectedGuide,
        carService: selectedCar,
        meetingPoint: meetingPoint,
        additionalServices: {
          guideCost,
          carCost,
          totalAdditionalCost: additionalCost,
        },
      };

      setFormData(updatedFormData);
      setTimeout(() => onNext(data.itinerary_id), 500);
    } catch (err) {
      console.error("Error saving itinerary:", err);
      Alert.alert(
        "Save Failed",
        err instanceof Error ? err.message : "Failed to save itinerary. Please try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: handleContinue },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#fff]">
      <View className="py-4 border-b border-gray-200">
        <Text className="text-xl font-onest-semibold text-center text-gray-900">
          Review & Add Services
        </Text>
        <Text className="text-sm text-gray-500 font-onest text-center mt-1">
          Optional services to enhance your experience
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-6">
          {/* Itinerary Summary Card */}
          <View className="mb-6 rounded-lg overflow-hidden">
            <View className="p-6">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-2xl font-onest-semibold text-gray-800 mb-2">
                    {formData.title}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 font-onest ml-2">
                      {formatDate(formData.start_date)} - {formatDate(formData.end_date)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="globe-outline" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 font-onest ml-2">
                      {totalDays} day{totalDays > 1 ? "s" : ""} • {totalActivities}{" "}
                      {totalActivities > 1 ? "activities" : "activity"}
                    </Text>
                  </View>
                </View>
                {travelerCount > 1 && (
                  <View className="bg-indigo-50 rounded-lg px-3 py-2">
                    <Text className="text-indigo-700 font-onest-semibold text-xs">
                      {travelerCount} people
                    </Text>
                  </View>
                )}
              </View>
              <View className="pt-4 border-t border-gray-200">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-600 font-onest">Activities Total</Text>
                  <Text className="text-lg font-onest-bold text-gray-800">
                    ₱{totalActivityCost.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Optional Add-ons Section */}
          <View>
            <Text className="text-lg font-onest-semibold text-start text-gray-900 my-4 px-4">
              Optional Add-ons
            </Text>

            {/* Tour Guide Selection */}
            <View className="mb-6 rounded-lg overflow-hidden">
              <Pressable className="border-b border-gray-100">
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="flex-1">
                        <Text className="text-base font-onest-semibold text-gray-900">
                          Tour Guide
                        </Text>
                        <Text className="text-xs text-gray-500 font-onest">
                          {selectedGuide ? selectedGuide.name : "Optional local expert"}
                        </Text>
                      </View>
                    </View>
                    {selectedGuide && (
                      <View className="bg-green-100 rounded-full px-3 py-1.5 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text className="text-xs font-onest-medium text-green-700 ml-1">
                          Selected
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>

              <View className="py-4">
                {selectedGuide ? (
                  <View className="rounded-lg p-4 border border-gray-200">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-onest-semibold text-gray-900 mb-1">
                          {selectedGuide.name}
                        </Text>
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text className="text-xs text-gray-600 font-onest ml-1">
                            {formatRating(selectedGuide.avg_rating)} ({selectedGuide.review_count || 0} reviews)
                          </Text>
                        </View>
                        <Text className="text-sm text-gray-600 font-onest mb-3">
                          {selectedGuide.bio || 'Experienced local guide'}
                        </Text>
                        <View className="flex-row flex-wrap">
                          {parseLanguages(selectedGuide.languages).map((lang, idx) => (
                            <View key={idx} className="bg-blue-50 rounded-full px-2 py-1 mr-2 mb-2">
                              <Text className="text-xs text-blue-700 font-onest">{lang}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <TouchableOpacity onPress={openGuideModal} className="ml-2">
                        <Text className="text-primary font-onest-medium text-sm">Change</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                      <Text className="text-sm text-gray-600 font-onest">
                        {totalDays} {totalDays === 1 ? "day" : "days"}
                      </Text>
                      <Text className="text-lg font-onest-bold text-primary">
                        ₱{guideCost.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={openGuideModal}
                    className="rounded-lg p-4 border-2 border-dashed border-gray-300 items-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
                    <Text className="text-gray-600 font-onest-medium mt-2">
                      Select a Guide
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Transportation Selection */}
            <View className="mb-6 rounded-lg overflow-hidden">
              <Pressable className="border-b border-gray-100">
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="flex-1">
                        <Text className="text-base font-onest-semibold text-gray-900">
                          Transportation
                        </Text>
                        <Text className="text-xs text-gray-500 font-onest">
                          {selectedCar
                            ? `${selectedCar.vehicle_type} - ${selectedCar.model}`
                            : "Private vehicle with driver"}
                        </Text>
                      </View>
                    </View>
                    {selectedCar && (
                      <View className="bg-green-100 rounded-full px-3 py-1.5 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text className="text-xs font-onest-medium text-green-700 ml-1">
                          Selected
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>

              <View className="p-4">
                {selectedCar ? (
                  <View className="rounded-lg p-4 border border-gray-200">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-onest-semibold text-gray-900 mb-1">
                          {selectedCar.vehicle_type} - {selectedCar.model}
                        </Text>
                        <View className="flex-row items-center mb-3">
                          <Ionicons name="people-outline" size={14} color="#6B7280" />
                          <Text className="text-xs text-gray-600 font-onest ml-1">
                            Up to {selectedCar.passenger_capacity} passengers
                          </Text>
                        </View>
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text className="text-xs text-gray-600 font-onest ml-1">
                            {formatRating(selectedCar.avg_rating)} ({selectedCar.review_count || 0} reviews)
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-500 font-onest mb-3">
                          Driver: {selectedCar.driver_name}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={openCarModal} className="ml-2">
                        <Text className="text-primary font-onest-medium text-sm">Change</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                      <Text className="text-sm text-gray-600 font-onest">
                        {totalDays} {totalDays === 1 ? "day" : "days"}
                      </Text>
                      <Text className="text-lg font-onest-bold text-primary">
                        ₱{carCost.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={openCarModal}
                    className="rounded-lg p-4 border-2 border-dashed border-gray-300 items-center"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
                    <Text className="text-gray-600 font-onest-medium mt-2">
                      Select a Vehicle
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Meeting Point Section - Only show if guide or driver selected */}
            {hasSelectedService && (
              <View className="mb-6 rounded-lg overflow-hidden">
                <Pressable className="border-b border-gray-100">
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="flex-1">
                          <Text className="text-base font-onest-semibold text-gray-900">
                            Meeting Point
                          </Text>
                          <Text className="text-xs text-gray-500 font-onest">
                            {hasMeetingPoint
                              ? meetingPoint.name || meetingPoint.address
                              : "Where should your guide/driver meet you?"}
                          </Text>
                        </View>
                      </View>
                      {hasMeetingPoint && (
                        <View className="bg-green-100 rounded-full px-3 py-1.5 flex-row items-center">
                          <Ionicons name="checkmark-circle" size={14} color="#059669" />
                          <Text className="text-xs font-onest-medium text-green-700 ml-1">
                            Set
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>

                <View className="p-4">
                  {hasMeetingPoint ? (
                    <View className="rounded-lg p-4 border border-gray-200">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <View className="flex-row items-start">
                            <Ionicons name="location" size={20} color="#6366F1" style={{ marginTop: 2 }} />
                            <View className="ml-2 flex-1">
                              {meetingPoint.name ? (
                                <Text className="text-base font-onest-semibold text-gray-900 mb-1">
                                  {meetingPoint.name}
                                </Text>
                              ) : null}
                              {meetingPoint.address ? (
                                <Text className="text-sm text-gray-600 font-onest">
                                  {meetingPoint.address}
                                </Text>
                              ) : null}
                              {meetingPoint.notes ? (
                                <View className="mt-2 bg-gray-50 rounded-lg p-2">
                                  <Text className="text-xs text-gray-500 font-onest">
                                    "{meetingPoint.notes}"
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                        <View className="flex-row ml-2">
                          <TouchableOpacity onPress={openMeetingPointModal} className="mr-3">
                            <Text className="text-primary font-onest-medium text-sm">Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={clearMeetingPoint}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={openMeetingPointModal}
                      className="rounded-lg p-4 border-2 border-dashed border-gray-300 items-center"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={32} color="#9CA3AF" />
                      <Text className="text-gray-600 font-onest-medium mt-2">
                        Set Meeting Point
                      </Text>
                      <Text className="text-gray-400 font-onest text-xs mt-1 text-center">
                        Help your guide/driver find you easily
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          {/* Cost Summary */}
          <View className="mb-6 rounded-lg overflow-hidden border border-gray-200">
            <View className="p-6">
              <Text className="text-lg font-onest-semibold text-gray-900 mb-4">
                Cost Summary
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-gray-600 font-onest">Activities</Text>
                  <Text className="text-sm font-onest-medium text-gray-900">
                    ₱{totalActivityCost.toLocaleString()}
                  </Text>
                </View>
                {guideCost > 0 && (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-gray-600 font-onest">Tour Guide</Text>
                    <Text className="text-sm font-onest-medium text-gray-900">
                      ₱{guideCost.toLocaleString()}
                    </Text>
                  </View>
                )}
                {carCost > 0 && (
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm text-gray-600 font-onest">Transportation</Text>
                    <Text className="text-sm font-onest-medium text-gray-900">
                      ₱{carCost.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row justify-between items-center pt-4 border-t border-gray-200 mt-3">
                <Text className="text-base font-onest-semibold text-gray-900">Total Cost</Text>
                <Text className="text-2xl font-onest-bold text-primary">
                  ₱{(totalActivityCost + additionalCost).toLocaleString()}
                </Text>
              </View>
              {travelerCount > 1 && (
                <Text className="text-xs text-gray-500 font-onest mt-2 text-center">
                  ≈ ₱{Math.round((totalActivityCost + additionalCost) / travelerCount).toLocaleString()}{" "}
                  per person
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Guide Selection Modal */}
      <Modal visible={showGuideModal} animationType="slide" transparent={true} onRequestClose={() => setShowGuideModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#fff] rounded-t-3xl max-h-[100%]">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-onest-bold text-gray-900">Select Tour Guide</Text>
              <TouchableOpacity onPress={() => setShowGuideModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              {loadingGuides ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text className="text-gray-500 font-onest mt-3">Loading guides...</Text>
                </View>
              ) : guides.length === 0 ? (
                <View className="items-center justify-center py-8">
                  <Ionicons name="person-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 font-onest mt-3">No guides available</Text>
                </View>
              ) : (
                guides.map((guide) => (
                  <TouchableOpacity key={guide.guide_id} onPress={() => handleGuideSelect(guide)} className="border border-gray-200 rounded-xl p-4 mb-3" activeOpacity={0.7}>
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-lg font-onest-semibold text-gray-900 flex-1">{guide.name}</Text>
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text className="ml-1 text-sm font-onest-medium text-gray-900">{formatRating(guide.avg_rating)}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500 font-onest mb-2">
                      {guide.review_count || 0} reviews • {guide.experience_years} years experience
                    </Text>
                    <Text className="text-sm text-gray-700 font-onest mb-3">{guide.bio || 'Experienced local guide'}</Text>
                    <View className="flex-row flex-wrap mb-3">
                      {parseLanguages(guide.languages).map((lang, idx) => (
                        <View key={idx} className="bg-blue-50 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-xs text-blue-700 font-onest">{lang}</Text>
                        </View>
                      ))}
                    </View>
                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                      <Text className="text-sm text-gray-600 font-onest">Per day</Text>
                      <Text className="text-lg font-onest-bold text-primary">₱{formatPrice(guide.price_per_day).toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Vehicle Selection Modal */}
      <Modal visible={showCarModal} animationType="slide" transparent={true} onRequestClose={() => setShowCarModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#fff] rounded-t-3xl max-h-[80%]">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-onest-bold text-gray-900">Select Vehicle</Text>
              <TouchableOpacity onPress={() => setShowCarModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              {loadingVehicles ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text className="text-gray-500 font-onest mt-3">Loading vehicles...</Text>
                </View>
              ) : availableVehicles.length > 0 ? (
                availableVehicles.map((car) => (
                  <TouchableOpacity key={car.vehicle_id} onPress={() => handleCarSelect(car)} className="border border-gray-200 rounded-xl p-4 mb-3" activeOpacity={0.7}>
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-onest-semibold text-gray-900 mb-1">{car.vehicle_type}</Text>
                        <Text className="text-sm text-gray-600 font-onest">{car.brand} {car.model} ({car.year})</Text>
                      </View>
                      <View className="bg-indigo-50 rounded-lg px-3 py-1">
                        <Text className="text-xs text-indigo-700 font-onest-semibold">{car.passenger_capacity} seats</Text>
                      </View>
                    </View>
                    <View className="mb-3">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text className="text-xs text-gray-600 font-onest ml-1">
                          {formatRating(car.avg_rating)} ({car.review_count || 0} reviews)
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-600 font-onest ml-1">Driver: {car.driver_name}</Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                      <Text className="text-sm text-gray-600 font-onest">Per day</Text>
                      <Text className="text-lg font-onest-bold text-primary">₱{formatPrice(car.price_per_day).toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="items-center justify-center py-8">
                  <Ionicons name="car-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 font-onest mt-3">
                    No vehicles available for {travelerCount} {travelerCount === 1 ? "person" : "people"}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Meeting Point Modal */}
      <Modal visible={showMeetingPointModal} animationType="slide" transparent={true} onRequestClose={() => setShowMeetingPointModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#fff] rounded-t-3xl">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-xl font-onest-bold text-gray-900">Set Meeting Point</Text>
              <TouchableOpacity onPress={() => setShowMeetingPointModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4">
              <Text className="text-sm text-gray-500 font-onest mb-4">
                Let your guide or driver know where to meet you on the first day of your trip.
              </Text>

              {/* Pick from Map Button */}
              <TouchableOpacity
                onPress={() => setShowLocationPicker(true)}
                className="flex-row items-center justify-center bg-primary/10 rounded-xl py-4 mb-4"
                activeOpacity={0.7}
              >
                <Ionicons name="map" size={20} color="#6366F1" />
                <Text className="font-onest-medium text-primary ml-2">
                  {tempMeetingPoint.latitude ? 'Change Location on Map' : 'Pick Location on Map'}
                </Text>
              </TouchableOpacity>

              {/* Show selected location from map */}
              {tempMeetingPoint.latitude && tempMeetingPoint.longitude && (
                <View className="bg-green-50 rounded-xl p-3 mb-4 flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text className="font-onest text-green-700 text-sm ml-2 flex-1">
                    Location pinned on map
                  </Text>
                </View>
              )}

              <View className="flex-row items-center my-3">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="px-3 text-gray-400 font-onest text-sm">or enter manually</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Location Name */}
              <View className="mb-4">
                <Text className="text-sm font-onest-medium text-gray-700 mb-2">
                  Location Name *
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 font-onest text-gray-900"
                  placeholder="e.g., Seda Hotel Capitol Central"
                  placeholderTextColor="#9CA3AF"
                  value={tempMeetingPoint.name}
                  onChangeText={(text) => setTempMeetingPoint(prev => ({ ...prev, name: text }))}
                />
              </View>

              {/* Address */}
              <View className="mb-4">
                <Text className="text-sm font-onest-medium text-gray-700 mb-2">
                  Address
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 font-onest text-gray-900"
                  placeholder="e.g., Lacson St, Bacolod City"
                  placeholderTextColor="#9CA3AF"
                  value={tempMeetingPoint.address}
                  onChangeText={(text) => setTempMeetingPoint(prev => ({ ...prev, address: text }))}
                />
              </View>

              {/* Notes/Instructions */}
              <View className="mb-6">
                <Text className="text-sm font-onest-medium text-gray-700 mb-2">
                  Additional Instructions
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 font-onest text-gray-900"
                  placeholder="e.g., I'll be waiting at the hotel lobby near reception"
                  placeholderTextColor="#9CA3AF"
                  value={tempMeetingPoint.notes}
                  onChangeText={(text) => setTempMeetingPoint(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ minHeight: 80 }}
                />
              </View>

              {/* Info Note */}
              <View className="bg-blue-50 rounded-xl p-4 mb-6">
                <View className="flex-row">
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text className="text-sm text-blue-700 font-onest ml-2 flex-1">
                    Your guide/driver will confirm this location or suggest an alternative if needed.
                  </Text>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={saveMeetingPoint}
                className="bg-primary rounded-xl py-4 items-center mb-4"
                activeOpacity={0.7}
              >
                <Text className="text-white font-onest-semibold text-base">
                  Save Meeting Point
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelected}
        initialLocation={
          tempMeetingPoint.latitude && tempMeetingPoint.longitude
            ? {
              name: tempMeetingPoint.name,
              address: tempMeetingPoint.address,
              latitude: tempMeetingPoint.latitude,
              longitude: tempMeetingPoint.longitude,
            }
            : null
        }
        title="Select Meeting Point"
      />

      {/* Floating Action Buttons */}
      <View className="px-6 py-4 border-t border-gray-200">
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={onBack}
            className="py-3 px-5 rounded-xl border border-gray-300"
            activeOpacity={0.7}
            disabled={saving}
          >
            <Text className="text-center font-onest-medium text-base text-gray-700">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            className="py-3 px-5 rounded-xl bg-primary"
            activeOpacity={0.7}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-center font-onest-semibold text-base text-white">
                Save & Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Step3aReviewServices;