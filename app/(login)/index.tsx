import { View, Text, Button, ScrollView, Image, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const router = useRouter();

  return (
    <SafeAreaView className="bg-white h-full ">
      <ScrollView>

        <View className="flex justify-center items-start   pt-12">
          <Image source={require('../../assets/images/logo.png')} style={{ width: 250, height: 150, }} />
        </View>
        <View className="px-12 gap-4">
          {/* Username & Password */}
          <TextInput
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            className="  bg-gray-100 rounded-md p-4 mb-4 text-lg "
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            className=" bg-gray-100 rounded-md p-4 text-lg"
          />

          {/* Login Button */}
          <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="bg-primary py-4 rounded-md mt-6">
            <Text className="text-white text-center text-lg font-bold">
              Log in
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-400 text-center text-lg  my-1">
            Or
          </Text>

          <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="bg-white shadow-md shadow-zinc-200  py-4 rounded-md">
            <View className="flex flex-row items-center justify-center">
              <Image source={require('../../assets/images/google.png')} style={{ width: 20, height: 20, }} />
              <Text className="ml-2 text-lg font-medium">
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/")} className="flex justify-center items-center">

            <Text className="my-4 font-medium">
              Don't have an account? <Text className="text-blue-400">Sign Up </Text>
            </Text>

          </TouchableOpacity>


        </View>

        {/* <Text className="text-center mt-8 text-grey">© 2025 Itinera. All rights reserved</Text> */}

      </ScrollView>
    </SafeAreaView>
  );
}
