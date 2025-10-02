"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Plus, Trash2, Briefcase, Building2, MapPin, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  location: string;
  skills: string[];
};

type WorkExperienceStepProps = {
  data: ExperienceEntry[];
  onUpdate: (data: ExperienceEntry[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function WorkExperienceStep({ data, onUpdate, onNext, onBack }: WorkExperienceStepProps) {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(
    data.length > 0 ? data : []
  );

  const addExperience = () => {
    const newExperience: ExperienceEntry = {
      id: crypto.randomUUID(),
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      location: "",
      skills: [],
    };
    const updated = [...experiences, newExperience];
    setExperiences(updated);
    onUpdate(updated);
  };

  const removeExperience = (id: string) => {
    const updated = experiences.filter((exp) => exp.id !== id);
    setExperiences(updated);
    onUpdate(updated);
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: any) => {
    const updated = experiences.map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    setExperiences(updated);
    onUpdate(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Work Experience</h2>
        <p className="text-muted-foreground">
          Add your professional work history. Start with your most recent position.
        </p>
      </div>

      {/* Experience Entries */}
      {experiences.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No work experience added yet</p>
          <Button type="button" onClick={addExperience} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Position
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp, index) => (
            <Card key={exp.id} className="p-6">
              <div className="space-y-4">
                {/* Header with delete button */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Position {index + 1}</h3>
                  {experiences.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(exp.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Company & Role */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Company Name"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Title *</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Software Engineer"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="San Francisco, CA"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                      className="pl-10"
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
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date {exp.isCurrent && "(Current)"}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                        className="pl-10"
                        disabled={exp.isCurrent}
                        required={!exp.isCurrent}
                      />
                    </div>
                  </div>
                </div>

                {/* Current Position Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`current-${exp.id}`}
                    checked={exp.isCurrent}
                    onCheckedChange={(checked) => {
                      updateExperience(exp.id, "isCurrent", checked);
                      if (checked) {
                        updateExperience(exp.id, "endDate", "");
                      }
                    }}
                  />
                  <label
                    htmlFor={`current-${exp.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I currently work here
                  </label>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Job Description</Label>
                  <Textarea
                    placeholder="Describe your responsibilities, achievements, and impact..."
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use bullet points or short paragraphs. Focus on achievements and quantifiable results.
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {/* Add Another Button */}
          <Button type="button" onClick={addExperience} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Position
          </Button>
        </div>
      )}

      {/* Skip Option */}
      {experiences.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Don't have work experience yet?
          </p>
          <Button type="button" variant="link" onClick={onNext}>
            Skip to Education
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {experiences.length > 0 && (
          <Button type="submit" className="gap-2">
            Continue to Education
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
