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
import { ResumeUploadStep } from "@/components/onboarding/resume-upload-step";

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
    responsibilities: string[]; // Changed from description
    achievements: string[];
    location: string;
    skills: string[]; // Renamed from technologies
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
    relevantCoursework: string[]; // Added
    achievements: string[]; // Added
    activities: string[]; // Added
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    projectUrl: string; // Renamed from url
    githubUrl: string; // Added
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    skills: string[]; // Renamed from technologies
    keyFeatures: string[]; // Added
    achievements: string[]; // Added
    roleResponsibilities: string[]; // Added
  }>;
  skills: Array<{
    name: string;
    category: string;
    // Removed proficiencyLevel
  }>;
};

type ParsedResumePersonalInfo = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  professional_summary?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

type ParsedResumeExperience = {
  company?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  responsibilities?: string[];
  achievements?: string[];
  location?: string;
  technologies?: string[];
};

type ParsedResumeEducation = {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  relevant_coursework?: string[];
  achievements?: string[];
  activities?: string[];
};

type ParsedResumeProject = {
  name?: string;
  description?: string;
  project_url?: string;
  technologies?: string[];
  key_features?: string[];
  achievements?: string[];
  role_responsibilities?: string[];
};

type ParsedResumeSkill = {
  name?: string;
  category?: string;
};

export type ParsedResumeData = {
  personal_info?: ParsedResumePersonalInfo;
  experience?: ParsedResumeExperience[];
  education?: ParsedResumeEducation[];
  projects?: ParsedResumeProject[];
  skills?: ParsedResumeSkill[];
};

const STEPS = [
  { id: 0, title: "Resume Upload", description: "Quick start with your resume (optional)" },
  { id: 1, title: "Personal Info", description: "Tell us about yourself" },
  { id: 2, title: "Experience", description: "Your work history" },
  { id: 3, title: "Education", description: "Your academic background" },
  { id: 4, title: "Projects", description: "Showcase your work" },
  { id: 5, title: "Skills", description: "Your expertise" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeDataLoaded, setResumeDataLoaded] = useState(false);

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
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipResumeUpload = () => {
    setCurrentStep(1); // Skip to Personal Info
  };

  const handleResumeDataLoaded = (parsedData: ParsedResumeData) => {
    // Helper function to convert text to title case
    const toTitleCase = (text: string) => {
      return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Helper function to extract and normalize name with suffix
    const parseFullName = (fullName: string) => {
      const suffixes = ['Jr.', 'Jr', 'Sr.', 'Sr', 'II', 'III', 'IV', 'V'];
      let suffix = "";
      let nameWithoutSuffix = fullName.trim();

      // Check if the last part is a suffix
      const parts = nameWithoutSuffix.split(/\s+/);
      const lastPart = parts[parts.length - 1];

      // Check for suffix (case-insensitive)
      const foundSuffix = suffixes.find(s => s.toLowerCase() === lastPart.toLowerCase());
      if (foundSuffix) {
        suffix = foundSuffix;
        parts.pop(); // Remove suffix from parts
        nameWithoutSuffix = parts.join(' ');
      }

      // Normalize to title case
      const normalizedName = toTitleCase(nameWithoutSuffix);
      const normalizedParts = normalizedName.split(' ');

      const firstName = normalizedParts[0] || "";
      const lastName = normalizedParts.length > 1 ? normalizedParts[normalizedParts.length - 1] : "";
      const middleName = normalizedParts.length > 2 ? normalizedParts.slice(1, -1).join(" ") : "";

      return { firstName, middleName, lastName, suffix };
    };

    const fullName = parsedData.personal_info?.name || "";
    const { firstName, middleName, lastName, suffix } = parseFullName(fullName);

    setFormData({
      personalInfo: {
        firstName,
        middleName,
        lastName,
        suffix,
        email: parsedData.personal_info?.email || "",
        phone: parsedData.personal_info?.phone || "",
        location: parsedData.personal_info?.location || "",
        bio: parsedData.personal_info?.professional_summary || "",
        linkedin: parsedData.personal_info?.linkedin || "",
        github: parsedData.personal_info?.github || "",
        portfolio: parsedData.personal_info?.portfolio || "",
      },
      experience: parsedData.experience?.map((exp) => {
        // Merge responsibilities and achievements
        const responsibilities = exp.responsibilities || [];
        const achievements = exp.achievements || [];
        const mergedResponsibilities = [...responsibilities, ...achievements].map(item => {
          const trimmed = item.trim();
          // Add bullet if not already present (smart detection)
          return trimmed.startsWith('•') ? trimmed : `• ${trimmed}`;
        });

        return {
          id: crypto.randomUUID(),
          company: exp.company || "",
          role: exp.role || "",
          startDate: exp.start_date || "",
          endDate: exp.end_date || "",
          isCurrent: !exp.end_date,
          responsibilities: mergedResponsibilities,
          achievements: [],
          location: exp.location || "",
          skills: exp.technologies || [],
        };
      }) || [],
      education: parsedData.education?.map((edu) => ({
        id: crypto.randomUUID(),
        institution: edu.institution || "",
        degree: edu.degree || "",
        fieldOfStudy: edu.field_of_study || "",
        startDate: edu.start_date || "",
        endDate: edu.end_date || "",
        isCurrent: !edu.end_date,
        gpa: edu.gpa || "",
        relevantCoursework: edu.relevant_coursework || [],
        achievements: edu.achievements || [],
        activities: edu.activities || [],
      })) || [],
      projects: parsedData.projects?.map((proj) => ({
        id: crypto.randomUUID(),
        name: proj.name || "",
        description: proj.description || "",
        projectUrl: proj.project_url || "",
        githubUrl: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        skills: proj.technologies || [],
        keyFeatures: proj.key_features || [],
        achievements: proj.achievements || [],
        roleResponsibilities: proj.role_responsibilities || [],
      })) || [],
      skills: parsedData.skills?.map((skill) => {
        // Map any invalid categories to valid ones
        let category = skill.category || "technical";
        const validCategories = ["technical", "soft", "language", "tool"];

        // Map common invalid categories
        if (category === "soft_skill") category = "soft";
        if (category === "framework" || category === "AI/ML" || category === "library") category = "technical";

        // Default to technical if still invalid
        if (!validCategories.includes(category)) {
          category = "technical";
        }

        return {
          name: skill.name || "",
          category,
        };
      }) || [],
    });

    setResumeDataLoaded(true);
    toast.success("Resume data loaded! Review and edit as needed.");
    setCurrentStep(1); // Move to Personal Info step
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
    } catch (error: unknown) {
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
            src="/getmehired-light.svg"
            alt="GetMeHired Logo"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to GetMeHired</h1>
            <p className="text-muted-foreground mt-2">
              {currentStep === 0
                ? "Upload your resume for a quick start, or fill manually"
                : resumeDataLoaded
                ? "Review and edit your information"
                : "Let's build your professional profile"}
            </p>
          </div>
        </div>

        {/* Stepper */}
        <OnboardingStepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(stepId) => setCurrentStep(stepId)}
        />

        {/* Form Card */}
        <Card className="mt-8">
          <CardContent className="p-8">
            {currentStep === 0 && (
              <ResumeUploadStep
                onResumeDataLoaded={handleResumeDataLoaded}
                onSkip={handleSkipResumeUpload}
              />
            )}
            {currentStep === 1 && (
              <PersonalInfoStep
                data={formData.personalInfo}
                onUpdate={updatePersonalInfo}
                onNext={handleNext}
                onBack={handleBack}
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


