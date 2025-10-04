"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Plus, Trash2, FolderKanban, Link as LinkIcon, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

type ProjectEntry = {
  id: string;
  name: string;
  description: string;
  projectUrl: string;
  githubUrl: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  skills: string[];
  keyFeatures: string[];
  achievements: string[];
  roleResponsibilities: string[];
};

type ProjectsStepProps = {
  data: ProjectEntry[];
  onUpdate: (data: ProjectEntry[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function ProjectsStep({ data, onUpdate, onNext, onBack }: ProjectsStepProps) {
  const [projects, setProjects] = useState<ProjectEntry[]>(
    data.length > 0 ? data : []
  );

  const addProject = () => {
    const newProject: ProjectEntry = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      skills: [],
      keyFeatures: [],
      achievements: [],
      roleResponsibilities: [],
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    onUpdate(updated);
  };

  const removeProject = (id: string) => {
    const updated = projects.filter((proj) => proj.id !== id);
    setProjects(updated);
    onUpdate(updated);
  };

  const updateProject = (id: string, field: keyof ProjectEntry, value: any) => {
    const updated = projects.map((proj) =>
      proj.id === id ? { ...proj, [field]: value } : proj
    );
    setProjects(updated);
    onUpdate(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Projects</h2>
        <p className="text-muted-foreground">
          Showcase personal or professional projects that demonstrate your skills.
        </p>
      </div>

      {/* Project Entries - Scrollable */}
      {projects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No projects added yet</p>
          <Button type="button" onClick={addProject} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {projects.map((project, index) => (
            <Card key={project.id} className="p-6">
              <div className="space-y-4">
                {/* Header with delete button */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Project {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProject(project.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Project Name */}
                <div className="space-y-2">
                  <Label>Project Name *</Label>
                  <div className="relative">
                    <FolderKanban className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="E-commerce Platform"
                      value={project.name}
                      onChange={(e) => updateProject(project.id, "name", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Project URL */}
                <div className="space-y-2">
                  <Label>Project URL (Optional)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://myproject.com"
                      value={project.projectUrl}
                      onChange={(e) => updateProject(project.id, "projectUrl", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Live demo or portfolio link
                  </p>
                </div>

                {/* GitHub URL */}
                <div className="space-y-2">
                  <Label>GitHub URL (Optional)</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="https://github.com/username/project"
                      value={project.githubUrl}
                      onChange={(e) => updateProject(project.id, "githubUrl", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="month"
                        value={project.startDate}
                        onChange={(e) => updateProject(project.id, "startDate", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date {project.isCurrent && "(Ongoing)"}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="month"
                        value={project.endDate}
                        onChange={(e) => updateProject(project.id, "endDate", e.target.value)}
                        className="pl-10"
                        disabled={project.isCurrent}
                      />
                    </div>
                  </div>
                </div>

                {/* Ongoing Project Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`current-${project.id}`}
                    checked={project.isCurrent}
                    onCheckedChange={(checked) => {
                      const isChecked = !!checked;
                      // Update both isCurrent and endDate in a single state update
                      const updated = projects.map((p) =>
                        p.id === project.id
                          ? { ...p, isCurrent: isChecked, endDate: isChecked ? "" : p.endDate }
                          : p
                      );
                      setProjects(updated);
                      onUpdate(updated);
                    }}
                  />
                  <label
                    htmlFor={`current-${project.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    This is an ongoing project
                  </label>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="What did you build? What problem does it solve?"
                    value={project.description}
                    onChange={(e) => updateProject(project.id, "description", e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a brief overview of the project
                  </p>
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                  <Label>Key Features (Optional)</Label>
                  <Textarea
                    placeholder="Enter each feature on a new line&#10;User authentication with OAuth&#10;Real-time notifications&#10;Responsive mobile design"
                    value={project.keyFeatures.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim().length > 0);
                      updateProject(project.id, "keyFeatures", lines);
                    }}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Role & Responsibilities */}
                <div className="space-y-2">
                  <Label>Role & Responsibilities (Optional)</Label>
                  <Textarea
                    placeholder="Enter each responsibility on a new line&#10;Led frontend development&#10;Designed database schema&#10;Implemented API endpoints"
                    value={project.roleResponsibilities.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim().length > 0);
                      updateProject(project.id, "roleResponsibilities", lines);
                    }}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Achievements */}
                <div className="space-y-2">
                  <Label>Achievements & Impact (Optional)</Label>
                  <Textarea
                    placeholder="Enter each achievement on a new line&#10;Reduced load time by 60%&#10;Gained 10,000+ active users&#10;Won Best Project Award"
                    value={project.achievements.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim().length > 0);
                      updateProject(project.id, "achievements", lines);
                    }}
                    className="min-h-[60px]"
                  />
                </div>

                {/* Skills/Technologies Used */}
                <div className="space-y-2">
                  <Label>Technologies & Skills Used (Optional)</Label>
                  <Textarea
                    placeholder="Enter each technology/skill on a new line&#10;React&#10;Node.js&#10;PostgreSQL"
                    value={project.skills.join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(line => line.trim().length > 0);
                      updateProject(project.id, "skills", lines);
                    }}
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Add Another Button */}
          <Button type="button" onClick={addProject} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Project
          </Button>
        </div>
      )}

      {/* Skip Option */}
      {projects.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Skip this section if not applicable
          </p>
          <Button type="button" variant="link" onClick={onNext}>
            Skip to Skills
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {projects.length > 0 && (
          <Button type="submit" className="gap-2">
            Continue to Skills
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
