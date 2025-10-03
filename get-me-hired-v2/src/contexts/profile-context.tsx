"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { authHelpers } from "@/lib/auth";

type ProfileData = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

type ProfileContextType = {
  profileData: ProfileData | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: ProfileData) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    try {
      // Check if user has a valid session first
      const session = await authHelpers.getSession();
      if (!session) {
        setProfileData(null);
        setIsLoading(false);
        return;
      }

      const user = await authHelpers.getCurrentUser();
      if (!user) {
        setProfileData(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("personal_info")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If no profile exists yet (PGRST116), that's okay for new users
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading profile:", error);
        setIsLoading(false);
        return;
      }

      if (data) {
        // Parse full_name back into components
        const nameParts = data.full_name?.split(" ") || [];

        setProfileData({
          firstName: nameParts[0] || "",
          middleName: nameParts.length > 3 ? nameParts.slice(1, -2).join(" ") : (nameParts.length === 3 ? nameParts[1] : ""),
          lastName: nameParts.length > 1 ? nameParts[nameParts.length - (data.full_name?.match(/\b(Jr|Sr|II|III|IV)\b/i) ? 2 : 1)] : "",
          suffix: nameParts[nameParts.length - 1]?.match(/\b(Jr|Sr|II|III|IV)\b/i) ? nameParts[nameParts.length - 1] : "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.summary || "",
          linkedin: data.linkedin_url || "",
          github: data.github_url || "",
          portfolio: data.portfolio_url || "",
        });
      } else {
        // New user with no profile yet - set default empty profile
        setProfileData({
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          email: user.email || "",
          phone: "",
          location: "",
          bio: "",
          linkedin: "",
          github: "",
          portfolio: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    setIsLoading(true);
    await loadProfile();
  };

  const updateProfileData = (data: ProfileData) => {
    setProfileData(data);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profileData, isLoading, refreshProfile, updateProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
