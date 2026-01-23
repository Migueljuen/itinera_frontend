import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_URL from "../../../constants/api";

type Experience = {
    id: number;
    title: string;
    description: string;
    price: string;
    price_estimate: string;
    unit: string;
    destination_name: string;
    location: string;
    tags: string[];
    images: string[];
};

type Category = {
    id: string;
    name: string;
    apiValue: string;
    icon: keyof typeof Ionicons.glyphMap;
};

type City = {
    id: string;
    name: string;
};

// Categories matching your database categories
const CATEGORIES: Category[] = [
    { id: "food", name: "Food & Drinks", apiValue: "Food & Drinks", icon: "restaurant-outline" },
    { id: "nature", name: "Nature & Adventure", apiValue: "Nature & Adventure", icon: "leaf-outline" },
    { id: "culture", name: "Culture & Heritage", apiValue: "Culture & Heritage", icon: "color-palette-outline" },
    { id: "wellness", name: "Wellness & Relaxation", apiValue: "Wellness & Relaxation", icon: "heart-outline" },
    { id: "nightlife", name: "Nightlife & Entertainment", apiValue: "Nightlife & Entertainment", icon: "moon-outline" },
    { id: "shopping", name: "Shopping & Markets", apiValue: "Shopping & Markets", icon: "bag-outline" },
    { id: "water", name: "Water Activities", apiValue: "Water Activities", icon: "water-outline" },
    { id: "sports", name: "Sports & Recreation", apiValue: "Sports & Recreation", icon: "football-outline" },
    { id: "workshops", name: "Workshops & Classes", apiValue: "Workshops & Classes", icon: "construct-outline" },
    { id: "tours", name: "Tours & Sightseeing", apiValue: "Tours & Sightseeing", icon: "map-outline" },
];

// Cities in Negros Occidental
const CITIES: City[] = [
    { id: "bacolod", name: "Bacolod" },
    { id: "silay", name: "Silay" },
    { id: "talisay", name: "Talisay" },
    { id: "victorias", name: "Victorias" },
    { id: "sagay", name: "Sagay" },
    { id: "cadiz", name: "Cadiz" },
    { id: "san-carlos", name: "San Carlos" },
    { id: "la-carlota", name: "La Carlota" },
    { id: "bago", name: "Bago" },
    { id: "kabankalan", name: "Kabankalan" },
    { id: "himamaylan", name: "Himamaylan" },
    { id: "escalante", name: "Escalante" },
    { id: "murcia", name: "Murcia" },
    { id: "don-salvador", name: "Don Salvador Benedicto" },
];

const SearchScreen = () => {
    const router = useRouter();
    const inputRef = useRef<TextInput>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<Experience[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Focus input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Load recent searches
    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        try {
            const searches = await AsyncStorage.getItem("recentSearches");
            if (searches) {
                setRecentSearches(JSON.parse(searches));
            }
        } catch (error) {
            console.error("Error loading recent searches:", error);
        }
    };

    const saveRecentSearch = async (query: string) => {
        try {
            let searches = [...recentSearches];
            searches = searches.filter((s) => s.toLowerCase() !== query.toLowerCase());
            searches.unshift(query);
            searches = searches.slice(0, 10);
            setRecentSearches(searches);
            await AsyncStorage.setItem("recentSearches", JSON.stringify(searches));
        } catch (error) {
            console.error("Error saving recent search:", error);
        }
    };

    const clearRecentSearches = async () => {
        try {
            setRecentSearches([]);
            await AsyncStorage.removeItem("recentSearches");
        } catch (error) {
            console.error("Error clearing recent searches:", error);
        }
    };

    const performSearch = async (
        query?: string,
        city?: string | null,
        category?: string | null
    ) => {
        const searchTerm = query ?? searchQuery;
        const cityFilter = city !== undefined ? city : selectedCity;
        const categoryFilter = category !== undefined ? category : selectedCategory;

        if (!searchTerm && !cityFilter && !categoryFilter) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        Keyboard.dismiss();

        if (searchTerm) {
            saveRecentSearch(searchTerm);
        }

        try {
            const params = new URLSearchParams();

            // Text search
            if (searchTerm) {
                params.append("q", searchTerm);
            }

            // City/location filter
            if (cityFilter) {
                const cityName = CITIES.find((c) => c.id === cityFilter)?.name || cityFilter;
                params.append("location", cityName);
            }

            // Category filter
            if (categoryFilter) {
                const categoryValue = CATEGORIES.find((c) => c.id === categoryFilter)?.apiValue || categoryFilter;
                params.append("category", categoryValue);
            }

            params.append("limit", "50");

            // Use search endpoint if there's a text query, otherwise use active endpoint
            const endpoint = searchTerm
                ? `${API_URL}/experience/search?${params.toString()}`
                : `${API_URL}/experience/active?${params.toString()}`;

            const response = await axios.get(endpoint);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error searching:", error);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCitySelect = (cityId: string) => {
        const newCity = selectedCity === cityId ? null : cityId;
        setSelectedCity(newCity);
        performSearch(searchQuery, newCity, selectedCategory);
    };

    const handleCategorySelect = (categoryId: string) => {
        const newCategory = selectedCategory === categoryId ? null : categoryId;
        setSelectedCategory(newCategory);
        performSearch(searchQuery, selectedCity, newCategory);
    };

    const handleRecentSearchPress = (query: string) => {
        setSearchQuery(query);
        performSearch(query, selectedCity, selectedCategory);
    };

    const clearFilters = () => {
        setSelectedCity(null);
        setSelectedCategory(null);
        setSearchQuery("");
        setSearchResults([]);
        setHasSearched(false);
    };

    const addToRecentlyViewed = async (experienceId: number) => {
        try {
            const viewed = await AsyncStorage.getItem("recentlyViewed");
            let viewedIds: number[] = viewed ? JSON.parse(viewed) : [];
            viewedIds = viewedIds.filter((id) => id !== experienceId);
            viewedIds.unshift(experienceId);
            viewedIds = viewedIds.slice(0, 20);
            await AsyncStorage.setItem("recentlyViewed", JSON.stringify(viewedIds));
        } catch (error) {
            console.error("Error saving recently viewed:", error);
        }
    };

    // ============ RESULT CARD ============
    const ResultCard = ({ item }: { item: Experience }) => {
        const priceNum =
            item.price != null && item.price !== "" ? Number(item.price) : null;

        return (
            <Pressable
                onPress={() => {
                    addToRecentlyViewed(item.id);
                    router.push(`/(experience)/${item.id}`);
                }}
                className="mb-4"
            >
                <View
                    className="bg-white rounded-2xl overflow-hidden flex-row"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                    }}
                >
                    <View className="w-28 h-28 bg-gray-100">
                        {item.images && item.images.length > 0 ? (
                            <Image
                                source={{ uri: `${API_URL}/${item.images[0]}` }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-full h-full items-center justify-center">
                                <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                            </View>
                        )}
                    </View>

                    <View className="flex-1 p-4 justify-center">
                        <Text
                            className="text-base font-onest-semibold text-black/90"
                            numberOfLines={1}
                        >
                            {item.title}
                        </Text>

                        {(() => {
                            if (priceNum != null && !Number.isNaN(priceNum) && priceNum > 0) {
                                return (
                                    <Text className="mt-1 text-black/70 font-onest text-sm">
                                        From ₱{priceNum.toLocaleString()} {item.unit ? "/ person" : ""}
                                    </Text>
                                );
                            }
                            if (item.price_estimate) {
                                return (
                                    <Text className="mt-1 text-black/60 font-onest text-sm">
                                        Around ₱{item.price_estimate}
                                    </Text>
                                );
                            }
                            return null;
                        })()}

                        {item.location && (
                            <Text
                                className="mt-1 text-black/50 font-onest text-xs"
                                numberOfLines={1}
                            >
                                {item.location}
                            </Text>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    // ============ MAIN RENDER ============
    return (
        <SafeAreaView className="bg-white flex-1">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 -ml-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </Pressable>

                <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-3 ml-2">
                    <Ionicons name="search-outline" size={20} color="#6B7280" />
                    <TextInput
                        ref={inputRef}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => performSearch()}
                        placeholder="Search activities..."
                        placeholderTextColor="#9CA3AF"
                        className="flex-1 ml-2 font-onest text-base text-black/90"
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Active Filters */}
            {(selectedCity || selectedCategory) && (
                <View className="flex-row items-center px-4 py-2 bg-gray-50 flex-wrap">
                    <Text className="text-black/50 font-onest text-sm mr-2">Filters:</Text>
                    {selectedCity && (
                        <Pressable
                            onPress={() => handleCitySelect(selectedCity)}
                            className="flex-row items-center bg-primary/10 rounded-full px-3 py-1 mr-2 mb-1"
                        >
                            <Text className="text-primary font-onest-medium text-sm">
                                {CITIES.find((c) => c.id === selectedCity)?.name}
                            </Text>
                            <Ionicons
                                name="close"
                                size={16}
                                color="#1f2937"
                                style={{ marginLeft: 4 }}
                            />
                        </Pressable>
                    )}
                    {selectedCategory && (
                        <Pressable
                            onPress={() => handleCategorySelect(selectedCategory)}
                            className="flex-row items-center bg-primary/10 rounded-full px-3 py-1 mr-2 mb-1"
                        >
                            <Text className="text-primary font-onest-medium text-sm">
                                {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                            </Text>
                            <Ionicons
                                name="close"
                                size={16}
                                color="#1f2937"
                                style={{ marginLeft: 4 }}
                            />
                        </Pressable>
                    )}
                    <Pressable onPress={clearFilters} className="mb-1">
                        <Text className="text-red-500 font-onest text-sm">Clear all</Text>
                    </Pressable>
                </View>
            )}

            {/* Content */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#1f2937" />
                    <Text className="mt-4 text-black/50 font-onest">Searching...</Text>
                </View>
            ) : hasSearched ? (
                // Search Results
                <FlatList
                    data={searchResults}
                    renderItem={({ item }) => <ResultCard item={item} />}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-16">
                            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                            <Text className="text-black/50 font-onest-medium text-lg mt-4">
                                No results found
                            </Text>
                            <Text className="text-black/40 font-onest text-center mt-2 px-8">
                                Try adjusting your search or filters to find what you're looking
                                for
                            </Text>
                        </View>
                    }
                    ListHeaderComponent={
                        searchResults.length > 0 ? (
                            <Text className="text-black/50 font-onest text-sm mb-4">
                                {searchResults.length} result
                                {searchResults.length !== 1 ? "s" : ""} found
                            </Text>
                        ) : null
                    }
                />
            ) : (
                // Browse Mode
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <View className="px-4 pt-4">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-lg font-onest-semibold text-black/90">
                                    Recent Searches
                                </Text>
                                <Pressable onPress={clearRecentSearches}>
                                    <Text className="text-primary font-onest text-sm">Clear</Text>
                                </Pressable>
                            </View>
                            <View className="flex-row flex-wrap">
                                {recentSearches.map((search, index) => (
                                    <Pressable
                                        key={index}
                                        onPress={() => handleRecentSearchPress(search)}
                                        className="flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-2 mb-2"
                                    >
                                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                                        <Text className="text-black/70 font-onest ml-2">
                                            {search}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Browse by City */}
                    <View className="px-4 pt-6">
                        <Text className="text-lg font-onest-semibold text-black/90 mb-3">
                            Browse by City
                        </Text>
                        <View className="flex-row flex-wrap">
                            {CITIES.map((city) => (
                                <Pressable
                                    key={city.id}
                                    onPress={() => handleCitySelect(city.id)}
                                    className={`rounded-full px-4 py-2 mr-2 mb-2 border ${selectedCity === city.id
                                            ? "bg-primary border-primary"
                                            : "bg-white border-gray-200"
                                        }`}
                                >
                                    <Text
                                        className={`font-onest-medium ${selectedCity === city.id ? "text-white" : "text-black/70"
                                            }`}
                                    >
                                        {city.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Browse by Category */}
                    <View className="px-4 pt-6 pb-8">
                        <Text className="text-lg font-onest-semibold text-black/90 mb-3">
                            Browse by Category
                        </Text>
                        <View className="flex-row flex-wrap">
                            {CATEGORIES.map((category) => (
                                <Pressable
                                    key={category.id}
                                    onPress={() => handleCategorySelect(category.id)}
                                    className={`flex-row items-center rounded-full px-4 py-2 mr-2 mb-2 border ${selectedCategory === category.id
                                            ? "bg-primary border-primary"
                                            : "bg-white border-gray-200"
                                        }`}
                                >
                                    <Ionicons
                                        name={category.icon}
                                        size={18}
                                        color={selectedCategory === category.id ? "#fff" : "#6B7280"}
                                    />
                                    <Text
                                        className={`font-onest-medium ml-2 ${selectedCategory === category.id
                                                ? "text-white"
                                                : "text-black/70"
                                            }`}
                                    >
                                        {category.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default SearchScreen;