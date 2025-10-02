"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Calendar, Loader2 } from "lucide-react";

type Education = {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  gpa: string | null;
  description: string | null;
};

type EducationSectionProps = {
  userId: string;
};

export function EducationSection({ userId }: EducationSectionProps) {
  const [education, setEducation] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEducation = async () => {
      try {
        const { data, error } = await supabase
          .from("education")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false });

        if (error) {
          console.error("Error loading education:", error);
          return;
        }

        setEducation(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadEducation();
    }
  }, [userId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (education.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No education history added yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Education
        </CardTitle>
        <CardDescription>Your educational background</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {education.map((edu) => (
          <div key={edu.id} className="border-l-2 border-primary/20 pl-4 pb-4 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{edu.degree}</h3>
                {edu.field_of_study && (
                  <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>
                )}
                <p className="text-base font-medium mt-1">{edu.institution}</p>
              </div>
              {edu.gpa && (
                <div className="text-sm text-muted-foreground">
                  GPA: {edu.gpa}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : "Present"}
              </span>
            </div>

            {edu.description && (
              <p className="text-sm text-muted-foreground mt-2">{edu.description}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
