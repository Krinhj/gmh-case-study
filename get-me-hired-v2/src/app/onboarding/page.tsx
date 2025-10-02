"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedPrismaticBurst } from "@/components/ui/themed-prismatic-burst";
import Image from "next/image";
import { authHelpers } from "@/lib/auth";
import { saveOnboardingData } from "@/lib/onboarding";
import { toast } from "sonner";

// Import step components (we'll create these next)
import { PersonalInfoStep } from "@/components/onboarding/personal-info-step";
import { WorkExperienceStep } from "@/components/onboarding/work-experience-step";
import { EducationStep } from "@/components/onboarding/education-step";
import { ProjectsStep } from "@/components/onboarding/projects-step";
import { SkillsStep } from "@/components/onboarding/skills-step";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";

export type OnboardingData = {
  personalInfo: {
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
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    location: string;
    skills: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    gpa: string;
    description: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    skills: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    proficiencyLevel: string;
  }>;
};

const STEPS = [
  { id: 1, title: "Personal Info", description: "Tell us about yourself" },
  { id: 2, title: "Experience", description: "Your work history" },
  { id: 3, title: "Education", description: "Your academic background" },
  { id: 4, title: "Projects", description: "Showcase your work" },
  { id: 5, title: "Skills", description: "Your expertise" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    personalInfo: {
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
    },
    experience: [],
    education: [],
    projects: [],
    skills: [],
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const user = await authHelpers.getCurrentUser();
      if (!user) {
        toast.error("You must be logged in to complete onboarding");
        router.push("/auth/login");
        return;
      }

      // Save to Supabase
      const { success, error } = await saveOnboardingData(user.id, formData);

      if (!success || error) {
        toast.error("Failed to save your profile. Please try again.");
        setIsLoading(false);
        return;
      }

      toast.success("Profile created successfully!");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await authHelpers.isAuthenticated();
      if (!isAuth) {
        toast.error("Please log in to continue");
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router]);

  const updatePersonalInfo = (data: Partial<OnboardingData["personalInfo"]>) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...data },
    }));
  };

  const updateExperience = (data: OnboardingData["experience"]) => {
    setFormData((prev) => ({
      ...prev,
      experience: data,
    }));
  };

  const updateEducation = (data: OnboardingData["education"]) => {
    setFormData((prev) => ({
      ...prev,
      education: data,
    }));
  };

  const updateProjects = (data: OnboardingData["projects"]) => {
    setFormData((prev) => ({
      ...prev,
      projects: data,
    }));
  };

  const updateSkills = (data: OnboardingData["skills"]) => {
    setFormData((prev) => ({
      ...prev,
      skills: data,
    }));
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <ThemedPrismaticBurst
          animationType="rotate3d"
          intensity={1.8}
          speed={0.3}
          distort={1.2}
          rayCount={24}
          mixBlendMode="lighten"
          lightColors={['#60a5fa', '#a78bfa', '#22d3ee']}
          darkColors={['#4d3dff', '#ff007a', '#00d4ff']}
        />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo & Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Image
            src="/getmehired.svg"
            alt="GetMeHired Logo"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to GetMeHired</h1>
            <p className="text-muted-foreground mt-2">
              Let's build your professional profile
            </p>
          </div>
        </div>

        {/* Stepper */}
        <OnboardingStepper steps={STEPS} currentStep={currentStep} />

        {/* Form Card */}
        <Card className="mt-8">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <PersonalInfoStep
                data={formData.personalInfo}
                onUpdate={updatePersonalInfo}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <WorkExperienceStep
                data={formData.experience}
                onUpdate={updateExperience}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <EducationStep
                data={formData.education}
                onUpdate={updateEducation}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <ProjectsStep
                data={formData.projects}
                onUpdate={updateProjects}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 5 && (
              <SkillsStep
                data={formData.skills}
                onUpdate={updateSkills}
                onBack={handleBack}
                onComplete={handleComplete}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
