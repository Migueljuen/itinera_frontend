// app/(auth)/partnerOnboardingForm.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { toast } from "sonner-native";

// Step components
import Step00Requirements from "./steps/Step00Requirements";
import Step00RoleSelection from "./steps/Step00RoleSelection";
import Step01PartnerInfo from "./steps/Step01PartnerInfo";
import Step02Verification from "./steps/Step02Verification";
import Step03Driver from "./steps/Step03Driver";
import Step03Guide from "./steps/Step03Guide";
import Step04ReviewSubmit from "./steps/Step04ReviewSubmit";
import Step04VehicleDetails from "./steps/Step04VehicleDetails";

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

export type UploadAsset = {
  uri: string;
  name?: string;
  type?: string;
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
  selfie_document: UploadAsset | null;
  timezone: string;
  is_first_login: 1;
  status: "Pending" | "Approved" | "Rejected";
  short_description: string;

  // UI helper
  creator_role_label: string;

  // verification
  id_document: UploadAsset | null;

  // ✅ NEW: Registration payment fields (all roles)
  gcash_reference: string;
  registration_payment_proof: UploadAsset | null;

  // ✅ NEW: Business permit (Creator only)
  business_permit_document: UploadAsset | null;

  // driver_profiles
  service_area: string;
  is_multi_day: boolean;
  driver_availability_days: DayOfWeek[];
  license_document: UploadAsset | null;

  // driver_vehicles
  vehicle_plate_number: string;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_color: string;
  vehicle_passenger_capacity: string;
  vehicle_price_per_day: string;
  or_cr_document: UploadAsset | null;
  vehicle_photos: UploadAsset[];

  // guide_profiles
  guide_certificate_document: UploadAsset | null;
  expertise_category_id: number | null;
  languages: string[];
  areas_covered: string;
  experience_years: number;
  guide_availability_days: DayOfWeek[];
};

const DEFAULT_TIMEZONE = "Asia/Manila";

export default function PartnerOnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0);

  // Step mapping:
  // 0 Role
  // 1 Requirements
  // 2 Partner Info
  // 3 Verification (ID + Selfie + Payment, license/cert if needed)
  // 4 Role-specific (Guide/Driver) OR skipped for Creator
  // 5 Vehicle details (Driver only)
  // 6 Review/Submit
  const stepCount = 7;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PartnerOnboardingFormData>({
    creator_role: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    password: "",
    profile_pic: null,
    selfie_document: null,
    timezone: DEFAULT_TIMEZONE,
    is_first_login: 1,
    status: "Pending",
    short_description: "",

    creator_role_label: "",
    id_document: null,

    // ✅ NEW: Registration payment defaults
    gcash_reference: "",
    registration_payment_proof: null,
    business_permit_document: null,

    service_area: "",
    is_multi_day: false,
    driver_availability_days: [],
    license_document: null,

    // vehicle defaults
    vehicle_plate_number: "",
    vehicle_type: "",
    vehicle_brand: "",
    vehicle_model: "",
    vehicle_year: "",
    vehicle_color: "",
    vehicle_passenger_capacity: "",
    vehicle_price_per_day: "",
    or_cr_document: null,
    vehicle_photos: [],

    guide_certificate_document: null,
    expertise_category_id: null,
    languages: [],
    areas_covered: "",
    experience_years: 0,
    guide_availability_days: [],
  });

  const handleNext = () => {
    setStep((prev) => {
      // Creator skips role steps
      if (prev === 3 && formData.creator_role === "Creator") return 6;

      // Guide goes from Step03Guide (step 4) straight to Review (step 6)
      if (prev === 4 && formData.creator_role === "Guide") return 6;

      // Driver goes from Step03Driver (step 4) to Vehicle step (step 5)
      if (prev === 4 && formData.creator_role === "Driver") return 5;

      // Driver vehicle step to review
      if (prev === 5 && formData.creator_role === "Driver") return 6;

      return Math.min(prev + 1, stepCount - 1);
    });
  };

  const handleBack = () => {
    setStep((prev) => {
      // From Review:
      if (prev === 6) {
        if (formData.creator_role === "Creator") return 3;
        if (formData.creator_role === "Guide") return 4;
        if (formData.creator_role === "Driver") return 5;
      }

      // From Vehicle step, go back to Driver step
      if (prev === 5 && formData.creator_role === "Driver") return 4;

      return Math.max(prev - 1, 0);
    });
  };

  const appendFile = (fd: FormData, key: string, asset: UploadAsset | null) => {
    if (!asset?.uri) return;

    const name = asset.name ?? `${key}-${Date.now()}`;
    const type = asset.type ?? "application/octet-stream";

    fd.append(
      key,
      {
        uri: asset.uri,
        name,
        type,
      } as any
    );
  };

  const appendFiles = (fd: FormData, key: string, assets: UploadAsset[]) => {
    (assets || []).forEach((asset, idx) => {
      if (!asset?.uri) return;

      const name = asset.name ?? `${key}-${idx + 1}-${Date.now()}`;
      const type = asset.type ?? "application/octet-stream";

      fd.append(
        key,
        {
          uri: asset.uri,
          name,
          type,
        } as any
      );
    });
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

      // ✅ NEW: Registration payment ref (all roles)
      fd.append("gcash_reference", (formData.gcash_reference || "").trim());

      // Files (all roles)
      appendFile(fd, "profile_pic", formData.profile_pic);
      appendFile(fd, "id_document", formData.id_document);
      appendFile(fd, "selfie_document", formData.selfie_document);

      // ✅ NEW: Registration payment proof (all roles)
      appendFile(fd, "registration_payment_proof", formData.registration_payment_proof);

      // Creator-specific
      if (formData.creator_role === "Creator") {
        appendFile(fd, "business_permit_document", formData.business_permit_document);
      }

      // Driver role-specific
      if (formData.creator_role === "Driver") {
        fd.append("service_area", formData.service_area);
        fd.append("is_multi_day", formData.is_multi_day ? "1" : "0");
        fd.append("availability_days", JSON.stringify(formData.driver_availability_days));
        appendFile(fd, "license_document", formData.license_document);

        // Vehicle fields
        fd.append("vehicle_plate_number", formData.vehicle_plate_number);
        fd.append("vehicle_type", formData.vehicle_type);
        fd.append("vehicle_brand", formData.vehicle_brand);
        fd.append("vehicle_model", formData.vehicle_model);
        fd.append("vehicle_year", formData.vehicle_year);
        fd.append("vehicle_color", formData.vehicle_color);
        fd.append("vehicle_passenger_capacity", formData.vehicle_passenger_capacity);
        fd.append("vehicle_price_per_day", formData.vehicle_price_per_day);

        appendFile(fd, "or_cr_document", formData.or_cr_document);
        appendFiles(fd, "vehicle_photos", formData.vehicle_photos);
      }

      // Guide role-specific
      if (formData.creator_role === "Guide") {
        fd.append("expertise_category_id", String(formData.expertise_category_id ?? ""));
        fd.append("languages", JSON.stringify(formData.languages));
        fd.append("areas_covered", formData.areas_covered);
        fd.append("experience_years", String(formData.experience_years));
        fd.append("guide_availability_days", JSON.stringify(formData.guide_availability_days));
        appendFile(fd, "guide_certificate_document", formData.guide_certificate_document);
      }

      const response = await fetch(`${API_URL}/partner/register`, {
        method: "POST",
        body: fd,
      });

      const result = await response.json().catch(() => ({}));
      toast.dismiss(toastId);

      if (response.ok) {
        toast.success(
          result?.message ||
          "Registration successful! Your application and payment proof have been submitted for verification."
        );
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
          <Step00Requirements
            formData={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 2:
        return (
          <Step01PartnerInfo
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 3:
        return (
          <Step02Verification
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 4:
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

        return null;

      case 5:
        // Driver-only vehicle step
        if (formData.creator_role === "Driver") {
          return (
            <Step04VehicleDetails
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        }
        return null;

      case 6:
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

  return <View className="flex-1 bg-[#fff]">{stepNode}</View>;
}