import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useAuth } from "../../contexts/AuthContext";

type FocusableFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  inputRef: React.RefObject<TextInput | null>;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
};

function FocusableField({
  label,
  value,
  onChangeText,
  inputRef,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  secureTextEntry = false,
  error,
  rightElement,
}: FocusableFieldProps) {
  return (
    <View>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        className="flex flex-col items-start border border-black/50 rounded-lg px-4 py-2"
        style={{ height: 55 }}
      >
        <Text className="text-sm font-onest text-black/50">{label}</Text>

        <View className="flex-row items-center w-full flex-1">
          <TextInput
            ref={inputRef}

            className="flex-1 text-lg font-onest text-black/90"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            multiline={false}
          />

          {rightElement ? <View className="ml-2">{rightElement}</View> : null}
        </View>
      </TouchableOpacity>

      {error ? (
        <Text className="text-red-500 text-sm ml-1 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";

    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        const user = result.user;

        // 🚫 Status gate (Travelers can login regardless; others must be Approved)
        if (user.status !== "Approved" && user.role !== "Traveler") {
          toast.error(
            user.status === "Pending"
              ? "Your account is still pending approval."
              : "Your account has been rejected."
          );
          return;
        }

        toast.success(`Welcome back, ${user.first_name}!`);

        switch (user.role) {
          case "Traveler":
            router.replace("/(traveler)");
            break;
          case "Creator":
            router.replace("/(creator)");
            break;
          case "Guide":
            router.replace("/(guide)");
            break;
          case "Driver":
            router.replace("/(driver)");
            break;
          case "Admin":
            router.replace("/(admin)");
            break;
          default:
            toast.error("Invalid user role.");
        }
      } else {
        toast.error(result.error || "Invalid email or password");
      }
    } catch (error) {
      toast.error("Error Occurred - Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex justify-center items-center mt-12 p-12 gap-4">
          <Text className="font-onest-semibold">Itinera</Text>
          <Text className="text-3xl">Let's get you logged in</Text>
          <Text className="text-black/60 text-lg">
            We're glad to have you back—let’s get started.
          </Text>
        </View>

        <View className="px-12 gap-4">
          {/* Email */}
          <FocusableField
            label="Email"
            value={email}
            onChangeText={setEmail}
            inputRef={emailRef}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          {/* Password */}
          <FocusableField
            label="Password"
            value={password}
            onChangeText={setPassword}
            inputRef={passwordRef}
            secureTextEntry={!showPassword}
            error={errors.password}
            rightElement={
              <TouchableOpacity
                onPress={() => {
                  setShowPassword((prev) => !prev);
                  passwordRef.current?.focus();
                }}
                className="absolute bottom-0 right-0"
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            }
          />

          {/* Forgot Password */}
          <TouchableOpacity className="self-end" onPress={() => router.push("/forgot")}>
            <Text className="text-blue-400 font-onest-medium">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isSubmitting}
            className="bg-[#191313] py-4 rounded-xl mt-6"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center text-lg font-bold">Log in</Text>
            )}
          </Pressable>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            className="flex justify-center items-center"
          >
            <Text className="my-4 font-onest-medium">
              Don't have an account? <Text className="text-blue-400">Sign Up</Text>
            </Text>
          </TouchableOpacity>
          <Pressable
            onPress={() => router.push("/partnerSignup/partnerOnboardingForm")}
            className="bg-white rounded-xl flex-row gap-6 items-center px-4 py-2"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Image
              source={require("@/assets/images/plane.png")}
              className="w-20 h-20"
              resizeMode="contain"
            />
            <View>
              <Text className="text-xl font-onest-medium text-black/90">
                Become a partner
              </Text>
              <Text className="text-base font-onest text-black/50">
                Join us and earn extra income
              </Text>
            </View>
          </Pressable>


        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
