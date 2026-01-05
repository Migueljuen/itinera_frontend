
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
  const [saving, setSaving] = useState(false);
  const [guides, setGuides] = useState<TourGuide[]>([]);
  const [vehicles, setVehicles] = useState<CarService[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const fetchGuides = async () => {
    setLoadingGuides(true);
    try {
      // Get city from formData - adjust this based on where you store destination/city
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
      // Get city from formData - adjust this based on where you store destination/city
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
          total_cost: totalActivityCost + additionalCost,
          traveler_count: formData.preferences?.travelerCount || 1,
          tour_guide_id: selectedGuide ? selectedGuide.guide_id : null,
          car_service_id: selectedCar ? selectedCar.vehicle_id : null,
          guide_cost: guideCost,
          car_cost: carCost,
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
    <View className="flex-1 bg-gray-50">
      <View className="py-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-onest-semibold text-center text-gray-900">
          Review & Add Services
        </Text>
        <Text className="text-sm text-gray-500 font-onest text-center mt-1">
          Optional services to enhance your experience
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="py-6">
          <View className="mb-6 rounded-lg overflow-hidden border border-gray-200">
            <View className="p-6 bg-white">
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

          <View className=" border border-gray-200">
            <Text className="text-lg font-onest-semibold text-start text-gray-900 my-4 px-4">
              Optional Add-ons
            </Text>
            <View className="mb-6 rounded-lg overflow-hidden ">

              <Pressable
                className="bg-white border-b border-gray-100"
              >
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


              <View className="p-4 bg-gray-50">
                {selectedGuide ? (
                  <View className="bg-white rounded-lg p-4 border border-gray-200">
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
                    className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 items-center"
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

            <View className="mb-6 rounded-lg overflow-hidden">
              <Pressable

                className="bg-white border-b border-gray-100"
              >
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


              <View className="p-4 bg-gray-50">
                {selectedCar ? (
                  <View className="bg-white rounded-lg p-4 border border-gray-200">
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
                    className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300 items-center"
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
          </View>

          <View className="mb-6 rounded-lg overflow-hidden border border-gray-200">
            <View className="p-6 bg-white">
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

      <Modal visible={showGuideModal} animationType="slide" transparent={true} onRequestClose={() => setShowGuideModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[80%]">

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
                  <TouchableOpacity key={guide.guide_id} onPress={() => handleGuideSelect(guide)} className="bg-white border border-gray-200 rounded-xl p-4 mb-3" activeOpacity={0.7}>
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

      <Modal visible={showCarModal} animationType="slide" transparent={true} onRequestClose={() => setShowCarModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
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
                  <TouchableOpacity key={car.vehicle_id} onPress={() => handleCarSelect(car)} className="bg-white border border-gray-200 rounded-xl p-4 mb-3" activeOpacity={0.7}>
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

      {/* Floating Action Buttons */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
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
            className="py-3 px-5 rounded-xl  bg-primary"
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