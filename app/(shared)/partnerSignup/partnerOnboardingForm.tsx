// app/(auth)/partner-onboarding.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

// Step components (create RN versions of these)
import Step00RoleSelection from "./steps/Step00RoleSelection";
import Step01PartnerInfo from "./steps/Step01PartnerInfo";
import Step02Verification from "./steps/Step02Verification";
import Step03Driver from "./steps/Step03Driver";
import Step03Guide from "./steps/Step03Guide";
import Step04ReviewSubmit from "./steps/Step04ReviewSubmit";

import API_URL from "../../../constants/api";

// --- Types ---
export type CreatorRole = "" | "Guide" | "Driver" | "Creator";
export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// In web you used `{ file }`. In RN you typically store an asset object you can upload.
export type UploadAsset = {
  uri: string; // file://... or content://...
  name?: string; // e.g. profile.jpg
  type?: string; // e.g. image/jpeg, application/pdf
};

export type PartnerOnboardingFormData = {
  // users table
  creator_role: CreatorRole;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password: string;

  profile_pic: UploadAsset | null;
  timezone: string;
  is_first_login: 1;
  status: "Pending" | "Approved" | "Rejected";
  short_description: string;

  // UI helper
  creator_role_label: string;

  // verification
  id_document: UploadAsset | null;

  // driver_profiles
  service_area: string;
  is_multi_day: boolean;
  driver_availability_days: DayOfWeek[];
  license_document: UploadAsset | null;

  // guide_profiles
  expertise_category_id: number | null;
  languages: string[];
  areas_covered: string;
  experience_years: number;
  guide_availability_days: DayOfWeek[];
};

const DEFAULT_TIMEZONE = "Asia/Manila"; // RN can't rely on Intl timezone consistently without extra libs

export default function PartnerOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0);
  const stepCount = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PartnerOnboardingFormData>({
    creator_role: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    password: "",
    profile_pic: null,
    timezone: DEFAULT_TIMEZONE,
    is_first_login: 1,
    status: "Pending",
    short_description: "",

    creator_role_label: "",
    id_document: null,

    service_area: "",
    is_multi_day: false,
    driver_availability_days: [],
    license_document: null,

    expertise_category_id: null,
    languages: [],
    areas_covered: "",
    experience_years: 0,
    guide_availability_days: [],
  });

  const handleNext = () => {
    setStep((prev) => {
      // If moving from Step02 and role is Creator, skip to Step04
      if (prev === 2 && formData.creator_role === "Creator") return 4;
      return Math.min(prev + 1, stepCount - 1);
    });
  };

  const handleBack = () => {
    setStep((prev) => {
      // If going back from Step04 and role is Creator, skip Step03
      if (prev === 4 && formData.creator_role === "Creator") return 2;
      return Math.max(prev - 1, 0);
    });
  };

  const appendFile = (
    fd: FormData,
    key: string,
    asset: UploadAsset | null
  ) => {
    if (!asset?.uri) return;

    const name = asset.name ?? `${key}-${Date.now()}`;
    const type = asset.type ?? "application/octet-stream";

    // React Native FormData expects this "file-like" object
    fd.append(key, {
      uri: asset.uri,
      name,
      type,
    } as any);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const toastId = toast.loading("Submitting your application...");

      const fd = new FormData();

      // User fields
      fd.append("role", formData.creator_role);
      fd.append("first_name", formData.first_name);
      fd.append("last_name", formData.last_name);
      fd.append("email", formData.email);
      fd.append("mobile_number", formData.mobile_number);
      fd.append("short_description", formData.short_description);
      fd.append("password", formData.password);
      fd.append("timezone", formData.timezone);

      // Files
      appendFile(fd, "profile_pic", formData.profile_pic);
      appendFile(fd, "id_document", formData.id_document);

      // Role-specific fields
      if (formData.creator_role === "Driver") {
        fd.append("service_area", formData.service_area);
        fd.append("is_multi_day", formData.is_multi_day ? "1" : "0");
        fd.append("availability_days", JSON.stringify(formData.driver_availability_days));
        appendFile(fd, "license_document", formData.license_document);
      }

      if (formData.creator_role === "Guide") {
        // backend expects this field name exactly like your web code
        fd.append("expertise_category_id", String(formData.expertise_category_id ?? ""));
        fd.append("languages", JSON.stringify(formData.languages));
        fd.append("areas_covered", formData.areas_covered);
        fd.append("experience_years", String(formData.experience_years));
        fd.append("guide_availability_days", JSON.stringify(formData.guide_availability_days));
      }

      const response = await fetch(`${API_URL}/partner/register`, {
        method: "POST",
        body: fd,
        // IMPORTANT: do NOT set Content-Type manually for multipart/form-data in RN fetch.
      });

      const result = await response.json().catch(() => ({}));

      toast.dismiss(toastId);

      if (response.ok) {
        toast.success(result?.message || "Registration successful! Application submitted.");
        // Go home (match your web navigate("/"))
        setTimeout(() => router.replace("/"), 1200);
      } else {
        toast.error(result?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit application. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepNode = useMemo(() => {
    switch (step) {
      case 0:
        return (
          <Step00RoleSelection
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
          />
        );

      case 1:
        return (
          <Step01PartnerInfo
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 2:
        return (
          <Step02Verification
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 3:
        if (formData.creator_role === "Guide") {
          return (
            <Step03Guide
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        }

        if (formData.creator_role === "Driver") {
          return (
            <Step03Driver
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        }

        // If somehow we reach step 3 with Creator role, skip to step 4
        return null;

      case 4:
        return (
          <Step04ReviewSubmit
            formData={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        );

      default:
        return null;
    }
  }, [step, formData, isSubmitting]);

  return (
    <View className="flex-1 bg-white">
      {stepNode}
    </View>
  );
}
