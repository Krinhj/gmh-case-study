"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Plus, Trash2, GraduationCap, School, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  gpa: string;
  description: string;
};

type EducationStepProps = {
  data: EducationEntry[];
  onUpdate: (data: EducationEntry[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function EducationStep({ data, onUpdate, onNext, onBack }: EducationStepProps) {
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>(
    data.length > 0 ? data : []
  );

  const addEducation = () => {
    const newEntry: EducationEntry = {
      id: crypto.randomUUID(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      gpa: "",
      description: "",
    };
    const updated = [...educationEntries, newEntry];
    setEducationEntries(updated);
    onUpdate(updated);
  };

  const removeEducation = (id: string) => {
    const updated = educationEntries.filter((edu) => edu.id !== id);
    setEducationEntries(updated);
    onUpdate(updated);
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: any) => {
    const updated = educationEntries.map((edu) =>
      edu.id === id ? { ...edu, [field]: value } : edu
    );
    setEducationEntries(updated);
    onUpdate(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Education</h2>
        <p className="text-muted-foreground">
          Add your educational background. Start with your most recent degree.
        </p>
      </div>

      {/* Education Entries */}
      {educationEntries.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No education added yet</p>
          <Button type="button" onClick={addEducation} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your Education
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {educationEntries.map((edu, index) => (
            <Card key={edu.id} className="p-6">
              <div className="space-y-4">
                {/* Header with delete button */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Education {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(edu.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Institution & Degree */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Institution *</Label>
                    <div className="relative">
                      <School className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="University Name"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Degree *</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Bachelor of Science"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Field of Study & GPA */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      placeholder="Computer Science"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>GPA (Optional)</Label>
                    <Input
                      placeholder="3.8 / 4.0"
                      value={edu.gpa}
                      onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date {edu.isCurrent && "(Expected)"}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                        className="pl-10"
                        disabled={edu.isCurrent}
                        required={!edu.isCurrent}
                      />
                    </div>
                  </div>
                </div>

                {/* Currently Enrolled Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`current-${edu.id}`}
                    checked={edu.isCurrent}
                    onCheckedChange={(checked) => {
                      updateEducation(edu.id, "isCurrent", checked);
                      if (checked) {
                        updateEducation(edu.id, "endDate", "");
                      }
                    }}
                  />
                  <label
                    htmlFor={`current-${edu.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Currently enrolled
                  </label>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Additional Details (Optional)</Label>
                  <Textarea
                    placeholder="Relevant coursework, honors, activities, achievements..."
                    value={edu.description}
                    onChange={(e) => updateEducation(edu.id, "description", e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Add Another Button */}
          <Button type="button" onClick={addEducation} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Degree
          </Button>
        </div>
      )}

      {/* Skip Option */}
      {educationEntries.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Skip this section if not applicable
          </p>
          <Button type="button" variant="link" onClick={onNext}>
            Skip to Projects
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {educationEntries.length > 0 && (
          <Button type="submit" className="gap-2">
            Continue to Projects
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
