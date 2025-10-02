"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/dashboard/sidebar";
import { authHelpers } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Save, User, Mail, Phone, MapPin, FileText, Linkedin, Github, Globe, Edit, X } from "lucide-react";
import { useProfile } from "@/contexts/profile-context";

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

export default function ProfilePage() {
  const router = useRouter();
  const { profileData: cachedProfile, isLoading: contextLoading, updateProfileData } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);

  // Load profile from context cache
  useEffect(() => {
    const loadUser = async () => {
      const user = await authHelpers.getCurrentUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
    };

    loadUser();
  }, [router]);

  // Update local state when cached profile is available
  useEffect(() => {
    if (cachedProfile) {
      setProfileData(cachedProfile);
    }
  }, [cachedProfile]);

  const handleSave = async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      // Construct full name
      const fullName = [
        profileData.firstName,
        profileData.middleName,
        profileData.lastName,
        profileData.suffix,
      ]
        .filter(Boolean)
        .join(" ");

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: profileData.phone || null,
        },
      });

      if (authError) {
        console.warn("Could not update auth metadata:", authError);
      }

      // Update personal_info table
      const { error: profileError } = await supabase
        .from("personal_info")
        .upsert(
          {
            user_id: userId,
            full_name: fullName,
            email: profileData.email,
            phone: profileData.phone || null,
            location: profileData.location || null,
            summary: profileData.bio || null,
            linkedin_url: profileData.linkedin || null,
            github_url: profileData.github || null,
            portfolio_url: profileData.portfolio || null,
          },
          {
            onConflict: "user_id",
          }
        );

      if (profileError) {
        console.error("Profile update error:", profileError);
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");
      updateProfileData(profileData); // Update context cache
      setIsEditMode(false); // Exit edit mode after successful save
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore original data to discard changes
    if (originalData) {
      setProfileData(originalData);
    }
    setIsEditMode(false);
  };

  const handleEdit = () => {
    // Save current data before entering edit mode
    setOriginalData({ ...profileData });
    setIsEditMode(true);
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="container max-w-4xl py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your personal information and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              {contextLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              {!isEditMode && !contextLoading && (
                <Button onClick={handleEdit} variant="outline" size="lg">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic information used across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="John"
                    disabled={!isEditMode || contextLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={profileData.middleName}
                    onChange={(e) => updateField("middleName", e.target.value)}
                    placeholder="Michael or M."
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Doe"
                    disabled={!isEditMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    value={profileData.suffix}
                    onChange={(e) => updateField("suffix", e.target.value)}
                    placeholder="Jr., Sr., III"
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="pl-10"
                      placeholder="you@example.com"
                      disabled={!isEditMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="pl-10"
                      placeholder="+1 (555) 000-0000"
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="pl-10"
                    placeholder="San Francisco, CA"
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Summary</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    className="pl-10 min-h-[100px]"
                    placeholder="Brief summary of your professional background and career goals..."
                    disabled={!isEditMode}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A 2-3 sentence overview that will appear on your résumé
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Links */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Professional Links</CardTitle>
              <CardDescription>
                Your online profiles and portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedin"
                    value={profileData.linkedin}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    className="pl-10"
                    placeholder="linkedin.com/in/yourprofile"
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="github"
                    value={profileData.github}
                    onChange={(e) => updateField("github", e.target.value)}
                    className="pl-10"
                    placeholder="github.com/yourusername"
                    disabled={!isEditMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="portfolio"
                    value={profileData.portfolio}
                    onChange={(e) => updateField("portfolio", e.target.value)}
                    className="pl-10"
                    placeholder="yourportfolio.com"
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditMode && (
            <div className="flex justify-end gap-3">
              <Button onClick={handleCancel} variant="outline" size="lg" disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
