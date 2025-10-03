"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sidebar } from "@/components/dashboard/sidebar";
import { authHelpers } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Linkedin,
  Github,
  Globe,
  Edit,
  X,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Plus,
  Trash2,
  Calendar
} from "lucide-react";
import { useProfile } from "@/contexts/profile-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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

type ExperienceEntry = {
  id?: string;
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  location: string;
  is_current: boolean;
};

type EducationEntry = {
  id?: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  relevant_coursework: string[];
  achievements: string[];
  activities: string[];
  gpa: string;
  is_current: boolean;
};

type Project = {
  id?: string;
  name: string;
  description: string;
  project_url: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type Skill = {
  id?: string;
  name: string;
  category: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { profileData: cachedProfile, isLoading: contextLoading, updateProfileData } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");

  // Profile data
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

  // Experience, Education, Projects, Skills
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Dialog states
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // New item states
  const [newExperience, setNewExperience] = useState<ExperienceEntry>({
    company: "",
    role: "",
    start_date: "",
    end_date: "",
    responsibilities: [],
    achievements: [],
    technologies: [],
    location: "",
    is_current: false,
  });

  const [newEducation, setNewEducation] = useState<EducationEntry>({
    institution: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    relevant_coursework: [],
    achievements: [],
    activities: [],
    gpa: "",
    is_current: false,
  });

  const [newProject, setNewProject] = useState<Project>({
    name: "",
    description: "",
    project_url: "",
    start_date: "",
    end_date: "",
    is_current: false,
  });

  const [newSkill, setNewSkill] = useState<Skill>({
    name: "",
    category: "technical",
  });

  // Temp states for array input fields
  const [tempResponsibility, setTempResponsibility] = useState("");
  const [tempAchievement, setTempAchievement] = useState("");
  const [tempTechnology, setTempTechnology] = useState("");
  const [tempCoursework, setTempCoursework] = useState("");
  const [tempEduAchievement, setTempEduAchievement] = useState("");
  const [tempActivity, setTempActivity] = useState("");

  // Load user and profile data
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if user has a valid session first
        const session = await authHelpers.getSession();
        if (!session) {
          router.push("/auth/login");
          return;
        }

        const user = await authHelpers.getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setUserId(user.id);

        // Load experiences, education, projects, skills
        await Promise.all([
          loadExperiences(user.id),
          loadEducation(user.id),
          loadProjects(user.id),
          loadSkills(user.id),
        ]);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/auth/login");
      }
    };

    loadUser();
  }, [router]);

  // Update local state when cached profile is available
  useEffect(() => {
    if (cachedProfile) {
      setProfileData({
        firstName: cachedProfile.firstName || "",
        middleName: cachedProfile.middleName || "",
        lastName: cachedProfile.lastName || "",
        suffix: cachedProfile.suffix || "",
        email: cachedProfile.email || "",
        phone: cachedProfile.phone || "",
        location: cachedProfile.location || "",
        bio: cachedProfile.bio || "",
        linkedin: cachedProfile.linkedin || "",
        github: cachedProfile.github || "",
        portfolio: cachedProfile.portfolio || "",
      });
    }
  }, [cachedProfile]);

  // Load functions
  const loadExperiences = async (uid: string) => {
    const { data, error } = await supabase
      .from("work_experience")
      .select("*")
      .eq("user_id", uid)
      .order("start_date", { ascending: false });

    if (!error && data) {
      setExperiences(data);
    } else if (error) {
      console.error("Error loading experiences:", error);
    }
  };

  const loadEducation = async (uid: string) => {
    const { data, error } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", uid)
      .order("start_date", { ascending: false });

    if (!error && data) {
      setEducation(data);
    } else if (error) {
      console.error("Error loading education:", error);
    }
  };

  const loadProjects = async (uid: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", uid)
      .order("start_date", { ascending: false, nullsFirst: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const loadSkills = async (uid: string) => {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", uid)
      .order("category", { ascending: true });

    if (!error && data) {
      setSkills(data);
    }
  };

  // Save personal info
  const handleSave = async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const fullName = [
        profileData.firstName,
        profileData.middleName,
        profileData.lastName,
        profileData.suffix,
      ]
        .filter(Boolean)
        .join(" ");

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: profileData.phone || null,
        },
      });

      if (authError) {
        console.warn("Could not update auth metadata:", authError);
      }

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
      updateProfileData(profileData);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setProfileData(originalData);
    }
    setIsEditMode(false);
  };

  const handleEdit = () => {
    setOriginalData({ ...profileData });
    setIsEditMode(true);
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // Experience CRUD
  const handleAddExperience = () => {
    setEditingItem(null);
    setNewExperience({
      company: "",
      role: "",
      start_date: "",
      end_date: "",
      responsibilities: [],
      achievements: [],
      technologies: [],
      location: "",
      is_current: false,
    });
    setTempResponsibility("");
    setTempAchievement("");
    setTempTechnology("");
    setShowExperienceDialog(true);
  };

  const handleEditExperience = (exp: ExperienceEntry) => {
    setEditingItem(exp);
    setNewExperience(exp);
    setTempResponsibility("");
    setTempAchievement("");
    setTempTechnology("");
    setShowExperienceDialog(true);
  };

  const handleSaveExperience = async () => {
    if (!userId) return;

    try {
      const experienceData = {
        company: newExperience.company,
        role: newExperience.role,
        start_date: newExperience.start_date || null,
        end_date: newExperience.is_current ? null : (newExperience.end_date || null),
        responsibilities: newExperience.responsibilities || [],
        achievements: newExperience.achievements || [],
        technologies: newExperience.technologies || [],
        location: newExperience.location,
        is_current: newExperience.is_current,
      };

      if (editingItem?.id) {
        // Update
        const { error } = await supabase
          .from("work_experience")
          .update(experienceData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Experience updated successfully!");
      } else {
        // Insert
        const { error } = await supabase.from("work_experience").insert({
          user_id: userId,
          ...experienceData,
        });

        if (error) throw error;
        toast.success("Experience added successfully!");
      }

      await loadExperiences(userId);
      setShowExperienceDialog(false);
      setEditingItem(null);
      setNewExperience({
        company: "",
        role: "",
        start_date: "",
        end_date: "",
        responsibilities: [],
        achievements: [],
        technologies: [],
        location: "",
        is_current: false,
      });
      setTempResponsibility("");
      setTempAchievement("");
      setTempTechnology("");
    } catch (error) {
      console.error("Error saving experience:", error);
      toast.error("Failed to save experience");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("work_experience")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Experience deleted successfully!");
      await loadExperiences(userId);
    } catch (error) {
      console.error("Error deleting experience:", error);
      toast.error("Failed to delete experience");
    }
  };

  const handleCancelExperience = () => {
    setShowExperienceDialog(false);
    setEditingItem(null);
    setNewExperience({
      company: "",
      role: "",
      start_date: "",
      end_date: "",
      responsibilities: [],
      achievements: [],
      technologies: [],
      location: "",
      is_current: false,
    });
    setTempResponsibility("");
    setTempAchievement("");
    setTempTechnology("");
  };

  // Education CRUD
  const handleAddEducation = () => {
    setEditingItem(null);
    setNewEducation({
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      relevant_coursework: [],
      achievements: [],
      activities: [],
      gpa: "",
      is_current: false,
    });
    setTempCoursework("");
    setTempEduAchievement("");
    setTempActivity("");
    setShowEducationDialog(true);
  };

  const handleEditEducation = (edu: EducationEntry) => {
    setEditingItem(edu);
    setNewEducation(edu);
    setTempCoursework("");
    setTempEduAchievement("");
    setTempActivity("");
    setShowEducationDialog(true);
  };

  const handleSaveEducation = async () => {
    if (!userId) return;

    try {
      const educationData = {
        institution: newEducation.institution,
        degree: newEducation.degree,
        field_of_study: newEducation.field_of_study || null,
        start_date: newEducation.start_date || null,
        end_date: newEducation.end_date || null,
        relevant_coursework: newEducation.relevant_coursework || [],
        achievements: newEducation.achievements || [],
        activities: newEducation.activities || [],
        gpa: newEducation.gpa || null,
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from("education")
          .update(educationData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Education updated successfully!");
      } else {
        const { error } = await supabase.from("education").insert({
          user_id: userId,
          ...educationData,
        });

        if (error) throw error;
        toast.success("Education added successfully!");
      }

      await loadEducation(userId);
      setShowEducationDialog(false);
      setEditingItem(null);
      setNewEducation({
        institution: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        relevant_coursework: [],
        achievements: [],
        activities: [],
        gpa: "",
        is_current: false,
      });
      setTempCoursework("");
      setTempEduAchievement("");
      setTempActivity("");
    } catch (error) {
      console.error("Error saving education:", error);
      toast.error("Failed to save education");
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("education")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Education deleted successfully!");
      await loadEducation(userId);
    } catch (error) {
      console.error("Error deleting education:", error);
      toast.error("Failed to delete education");
    }
  };

  const handleCancelEducation = () => {
    setShowEducationDialog(false);
    setEditingItem(null);
    setNewEducation({
      institution: "",
      degree: "",
      field_of_study: "",
      start_date: "",
      end_date: "",
      relevant_coursework: [],
      achievements: [],
      activities: [],
      gpa: "",
      is_current: false,
    });
    setTempCoursework("");
    setTempEduAchievement("");
    setTempActivity("");
  };

  // Project CRUD
  const handleAddProject = () => {
    setEditingItem(null);
    setNewProject({
      name: "",
      description: "",
      project_url: "",
      start_date: "",
      end_date: "",
      is_current: false,
    });
    setShowProjectDialog(true);
  };

  const handleEditProject = (proj: Project) => {
    setEditingItem(proj);
    setNewProject(proj);
    setShowProjectDialog(true);
  };

  const handleSaveProject = async () => {
    if (!userId) return;

    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description || null,
        project_url: newProject.project_url || null,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
      };

      if (editingItem?.id) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Project updated successfully!");
      } else {
        const { error } = await supabase.from("projects").insert({
          user_id: userId,
          ...projectData,
        });

        if (error) throw error;
        toast.success("Project added successfully!");
      }

      await loadProjects(userId);
      setShowProjectDialog(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Project deleted successfully!");
      await loadProjects(userId);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Skills CRUD
  const handleAddSkill = () => {
    setEditingItem(null);
    setNewSkill({
      name: "",
      category: "technical",
    });
    setShowSkillDialog(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingItem(skill);
    setNewSkill(skill);
    setShowSkillDialog(true);
  };

  const handleSaveSkill = async () => {
    if (!userId) return;

    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from("skills")
          .update({
            name: newSkill.name,
            category: newSkill.category,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Skill updated successfully!");
      } else {
        const { error } = await supabase.from("skills").insert({
          user_id: userId,
          name: newSkill.name,
          category: newSkill.category,
        });

        if (error) throw error;
        toast.success("Skill added successfully!");
      }

      await loadSkills(userId);
      setShowSkillDialog(false);
    } catch (error) {
      console.error("Error saving skill:", error);
      toast.error("Failed to save skill");
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Skill deleted successfully!");
      await loadSkills(userId);
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Failed to delete skill");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="container max-w-5xl py-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Profile</h1>
              <p className="text-muted-foreground mt-2">
                Manage your personal information and professional details
              </p>
            </div>
            <div className="flex items-center gap-3">
              {contextLoading && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              {!isEditMode && activeTab === "personal" && (
                <Button onClick={handleEdit} variant="outline" size="lg">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="personal">
                <User className="mr-2 h-4 w-4" />
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="experience">
                <Briefcase className="mr-2 h-4 w-4" />
                Experience
              </TabsTrigger>
              <TabsTrigger value="education">
                <GraduationCap className="mr-2 h-4 w-4" />
                Education
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FolderGit2 className="mr-2 h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="skills">
                <Award className="mr-2 h-4 w-4" />
                Skills
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <div className="space-y-6">

                {/* Personal Information */}
                <Card>
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
                <Card>
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
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Work Experience</h2>
                    <p className="text-muted-foreground mt-1">
                      Add your professional work history
                    </p>
                  </div>
                  <Button onClick={handleAddExperience}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Experience
                  </Button>
                </div>

                {experiences.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No work experience added yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {experiences.map((exp) => (
                      <Card key={exp.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{exp.role}</h3>
                              <p className="text-muted-foreground">{exp.company}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(exp.start_date)} - {exp.is_current ? "Present" : formatDate(exp.end_date)}
                                </span>
                                {exp.location && (
                                  <>
                                    <span>•</span>
                                    <span>{exp.location}</span>
                                  </>
                                )}
                              </div>

                              {/* Responsibilities */}
                              {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Responsibilities:</p>
                                  <ul className="text-sm space-y-1 list-disc list-inside">
                                    {exp.responsibilities.map((resp, idx) => (
                                      <li key={idx}>{resp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Achievements */}
                              {exp.achievements && exp.achievements.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Achievements:</p>
                                  <ul className="text-sm space-y-1 list-disc list-inside">
                                    {exp.achievements.map((achievement, idx) => (
                                      <li key={idx}>{achievement}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Technologies */}
                              {exp.technologies && exp.technologies.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Technologies:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {exp.technologies.map((tech, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditExperience(exp)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exp.id && handleDeleteExperience(exp.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Education Tab */}
            <TabsContent value="education">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Education</h2>
                    <p className="text-muted-foreground mt-1">
                      Add your educational background
                    </p>
                  </div>
                  <Button onClick={handleAddEducation}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Education
                  </Button>
                </div>

                {education.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No education added yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {education.map((edu) => (
                      <Card key={edu.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {edu.degree}{edu.field_of_study && ` in ${edu.field_of_study}`}
                              </h3>
                              <p className="text-muted-foreground">{edu.institution}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                                </span>
                                {edu.gpa && (
                                  <>
                                    <span>•</span>
                                    <span>GPA: {edu.gpa}</span>
                                  </>
                                )}
                              </div>

                              {/* Relevant Coursework */}
                              {edu.relevant_coursework && edu.relevant_coursework.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Relevant Coursework:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {edu.relevant_coursework.map((course, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {course}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Achievements */}
                              {edu.achievements && edu.achievements.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Achievements & Honors:</p>
                                  <ul className="text-sm space-y-1 list-disc list-inside">
                                    {edu.achievements.map((achievement, idx) => (
                                      <li key={idx}>{achievement}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Activities */}
                              {edu.activities && edu.activities.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Activities & Leadership:</p>
                                  <ul className="text-sm space-y-1 list-disc list-inside">
                                    {edu.activities.map((activity, idx) => (
                                      <li key={idx}>{activity}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEducation(edu)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => edu.id && handleDeleteEducation(edu.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Projects</h2>
                    <p className="text-muted-foreground mt-1">
                      Showcase your personal and professional projects
                    </p>
                  </div>
                  <Button onClick={handleAddProject}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                  </Button>
                </div>

                {projects.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FolderGit2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No projects added yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {projects.map((proj) => (
                      <Card key={proj.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{proj.name}</h3>
                              {proj.project_url && (
                                <a
                                  href={proj.project_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  {proj.project_url}
                                </a>
                              )}
                              {(proj.start_date || proj.end_date) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {formatDate(proj.start_date)} - {formatDate(proj.end_date)}
                                  </span>
                                </div>
                              )}
                              {proj.description && (
                                <p className="text-sm mt-3 whitespace-pre-line">{proj.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProject(proj)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => proj.id && handleDeleteProject(proj.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Skills</h2>
                    <p className="text-muted-foreground mt-1">
                      Add your technical and professional skills
                    </p>
                  </div>
                  <Button onClick={handleAddSkill}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Skill
                  </Button>
                </div>

                {skills.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No skills added yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Group skills by category */}
                    {["technical", "soft", "language", "tool"].map((category) => {
                      const categorySkills = skills.filter((s) => s.category === category);
                      if (categorySkills.length === 0) return null;

                      return (
                        <Card key={category}>
                          <CardHeader>
                            <CardTitle className="capitalize">
                              {category === "soft" ? "Soft Skills" : `${category} Skills`}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {categorySkills.map((skill) => (
                                <Badge
                                  key={skill.id}
                                  variant="secondary"
                                  className="text-sm px-3 py-1.5 flex items-center gap-2"
                                >
                                  <span>{skill.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => handleEditSkill(skill)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() => skill.id && handleDeleteSkill(skill.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Experience Dialog */}
      <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Experience" : "Add Experience"}</DialogTitle>
            <DialogDescription>
              Add details about your work experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-company">Company *</Label>
                <Input
                  id="exp-company"
                  value={newExperience.company}
                  onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-role">Role *</Label>
                <Input
                  id="exp-role"
                  value={newExperience.role}
                  onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
                  placeholder="Job title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-location">Location</Label>
              <Input
                id="exp-location"
                value={newExperience.location}
                onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                placeholder="City, State"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="exp-start">Start Date *</Label>
                <Input
                  id="exp-start"
                  type="date"
                  value={newExperience.start_date}
                  onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-end">End Date</Label>
                <Input
                  id="exp-end"
                  type="date"
                  value={newExperience.end_date || ""}
                  onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                  disabled={newExperience.is_current}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="exp-current"
                checked={newExperience.is_current}
                onChange={(e) => setNewExperience({ ...newExperience, is_current: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="exp-current" className="cursor-pointer">
                I currently work here
              </Label>
            </div>

            {/* Responsibilities */}
            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <div className="space-y-2">
                {newExperience.responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={resp} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...newExperience.responsibilities];
                        updated.splice(index, 1);
                        setNewExperience({ ...newExperience, responsibilities: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={tempResponsibility}
                    onChange={(e) => setTempResponsibility(e.target.value)}
                    placeholder="Add a responsibility..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempResponsibility.trim()) {
                        e.preventDefault();
                        setNewExperience({
                          ...newExperience,
                          responsibilities: [...newExperience.responsibilities, tempResponsibility.trim()]
                        });
                        setTempResponsibility("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempResponsibility.trim()) {
                        setNewExperience({
                          ...newExperience,
                          responsibilities: [...newExperience.responsibilities, tempResponsibility.trim()]
                        });
                        setTempResponsibility("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
              <Label>Achievements</Label>
              <div className="space-y-2">
                {newExperience.achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={achievement} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...newExperience.achievements];
                        updated.splice(index, 1);
                        setNewExperience({ ...newExperience, achievements: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={tempAchievement}
                    onChange={(e) => setTempAchievement(e.target.value)}
                    placeholder="Add an achievement..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempAchievement.trim()) {
                        e.preventDefault();
                        setNewExperience({
                          ...newExperience,
                          achievements: [...newExperience.achievements, tempAchievement.trim()]
                        });
                        setTempAchievement("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempAchievement.trim()) {
                        setNewExperience({
                          ...newExperience,
                          achievements: [...newExperience.achievements, tempAchievement.trim()]
                        });
                        setTempAchievement("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Technologies */}
            <div className="space-y-2">
              <Label>Technologies Used</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {newExperience.technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      {tech}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                        onClick={() => {
                          const updated = [...newExperience.technologies];
                          updated.splice(index, 1);
                          setNewExperience({ ...newExperience, technologies: updated });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tempTechnology}
                    onChange={(e) => setTempTechnology(e.target.value)}
                    placeholder="Add a technology (e.g., React, Node.js)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempTechnology.trim()) {
                        e.preventDefault();
                        setNewExperience({
                          ...newExperience,
                          technologies: [...newExperience.technologies, tempTechnology.trim()]
                        });
                        setTempTechnology("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempTechnology.trim()) {
                        setNewExperience({
                          ...newExperience,
                          technologies: [...newExperience.technologies, tempTechnology.trim()]
                        });
                        setTempTechnology("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelExperience}>
              Cancel
            </Button>
            <Button onClick={handleSaveExperience}>
              {editingItem ? "Update" : "Add"} Experience
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Education" : "Add Education"}</DialogTitle>
            <DialogDescription>
              Add details about your educational background
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edu-institution">Institution *</Label>
              <Input
                id="edu-institution"
                value={newEducation.institution}
                onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                placeholder="University or school name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-degree">Degree *</Label>
                <Input
                  id="edu-degree"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                  placeholder="Bachelor's, Master's, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-field">Field of Study</Label>
                <Input
                  id="edu-field"
                  value={newEducation.field_of_study}
                  onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
                  placeholder="Computer Science, etc."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edu-start">Start Date</Label>
                <Input
                  id="edu-start"
                  type="date"
                  value={newEducation.start_date}
                  onChange={(e) => setNewEducation({ ...newEducation, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edu-end">End Date</Label>
                <Input
                  id="edu-end"
                  type="date"
                  value={newEducation.end_date || ""}
                  onChange={(e) => setNewEducation({ ...newEducation, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edu-gpa">GPA</Label>
              <Input
                id="edu-gpa"
                value={newEducation.gpa}
                onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                placeholder="3.8"
              />
            </div>

            {/* Relevant Coursework */}
            <div className="space-y-2">
              <Label>Relevant Coursework</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {newEducation.relevant_coursework.map((course, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      {course}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                        onClick={() => {
                          const updated = [...newEducation.relevant_coursework];
                          updated.splice(index, 1);
                          setNewEducation({ ...newEducation, relevant_coursework: updated });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tempCoursework}
                    onChange={(e) => setTempCoursework(e.target.value)}
                    placeholder="Add a course..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempCoursework.trim()) {
                        e.preventDefault();
                        setNewEducation({
                          ...newEducation,
                          relevant_coursework: [...newEducation.relevant_coursework, tempCoursework.trim()]
                        });
                        setTempCoursework("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempCoursework.trim()) {
                        setNewEducation({
                          ...newEducation,
                          relevant_coursework: [...newEducation.relevant_coursework, tempCoursework.trim()]
                        });
                        setTempCoursework("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
              <Label>Achievements & Honors</Label>
              <div className="space-y-2">
                {newEducation.achievements.map((achievement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={achievement} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...newEducation.achievements];
                        updated.splice(index, 1);
                        setNewEducation({ ...newEducation, achievements: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={tempEduAchievement}
                    onChange={(e) => setTempEduAchievement(e.target.value)}
                    placeholder="Add an achievement or honor..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempEduAchievement.trim()) {
                        e.preventDefault();
                        setNewEducation({
                          ...newEducation,
                          achievements: [...newEducation.achievements, tempEduAchievement.trim()]
                        });
                        setTempEduAchievement("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempEduAchievement.trim()) {
                        setNewEducation({
                          ...newEducation,
                          achievements: [...newEducation.achievements, tempEduAchievement.trim()]
                        });
                        setTempEduAchievement("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-2">
              <Label>Activities & Leadership</Label>
              <div className="space-y-2">
                {newEducation.activities.map((activity, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={activity} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = [...newEducation.activities];
                        updated.splice(index, 1);
                        setNewEducation({ ...newEducation, activities: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={tempActivity}
                    onChange={(e) => setTempActivity(e.target.value)}
                    placeholder="Add an activity or leadership role..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempActivity.trim()) {
                        e.preventDefault();
                        setNewEducation({
                          ...newEducation,
                          activities: [...newEducation.activities, tempActivity.trim()]
                        });
                        setTempActivity("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tempActivity.trim()) {
                        setNewEducation({
                          ...newEducation,
                          activities: [...newEducation.activities, tempActivity.trim()]
                        });
                        setTempActivity("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEducation}>
              Cancel
            </Button>
            <Button onClick={handleSaveEducation}>
              {editingItem ? "Update" : "Add"} Education
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Project" : "Add Project"}</DialogTitle>
            <DialogDescription>
              Add details about your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Project Name *</Label>
              <Input
                id="proj-name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="My Awesome Project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-url">Project URL</Label>
              <Input
                id="proj-url"
                value={newProject.project_url}
                onChange={(e) => setNewProject({ ...newProject, project_url: e.target.value })}
                placeholder="https://github.com/username/project"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="proj-start">Start Date</Label>
                <Input
                  id="proj-start"
                  type="date"
                  value={newProject.start_date || ""}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-end">End Date</Label>
                <Input
                  id="proj-end"
                  type="date"
                  value={newProject.end_date || ""}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proj-description">Description *</Label>
              <Textarea
                id="proj-description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe the project, technologies used, and key features..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject}>
              {editingItem ? "Update" : "Add"} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Skill" : "Add Skill"}</DialogTitle>
            <DialogDescription>
              Add a skill to your profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name *</Label>
              <Input
                id="skill-name"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="JavaScript, Project Management, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-category">Category *</Label>
              <select
                id="skill-category"
                value={newSkill.category}
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="technical">Technical</option>
                <option value="soft">Soft Skill</option>
                <option value="language">Language</option>
                <option value="tool">Tool</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSkill}>
              {editingItem ? "Update" : "Add"} Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
