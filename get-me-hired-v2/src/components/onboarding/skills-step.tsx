"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X, Code, Lightbulb, Languages, Wrench } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Skill = {
  name: string;
  category: string;
};

type SkillsStepProps = {
  data: Skill[];
  onUpdate: (data: Skill[]) => void;
  onBack: () => void;
  onComplete: () => void;
  isLoading: boolean;
};

const SKILL_CATEGORIES = [
  { value: "technical", label: "Technical", icon: Code },
  { value: "soft", label: "Soft Skill", icon: Lightbulb },
  { value: "language", label: "Language", icon: Languages },
  { value: "tool", label: "Tool/Software", icon: Wrench },
];

export function SkillsStep({ data, onUpdate, onBack, onComplete, isLoading }: SkillsStepProps) {
  const [skills, setSkills] = useState<Skill[]>(data);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("technical");

  const addSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newSkillName.trim()) return;

    const skill: Skill = {
      name: newSkillName.trim(),
      category: newSkillCategory,
    };

    const updated = [...skills, skill];
    setSkills(updated);
    onUpdate(updated);

    // Reset form
    setNewSkillName("");
    setNewSkillCategory("technical");
  };

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    onUpdate(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  const skillsByCategory = SKILL_CATEGORIES.map((category) => ({
    ...category,
    skills: skills.filter((s) => s.category === category.value),
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Skills</h2>
        <p className="text-muted-foreground">
          Add your technical skills, soft skills, languages, and tools you&apos;re proficient in.
        </p>
      </div>

      {/* Add Skill Form */}
      <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
        <Label>Add a Skill</Label>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="skillName">Skill Name</Label>
            <Input
              id="skillName"
              placeholder="e.g., JavaScript, Leadership, Spanish"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skillCategory">Category</Label>
            <Select value={newSkillCategory} onValueChange={setNewSkillCategory}>
              <SelectTrigger id="skillCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => addSkill()}
              disabled={!newSkillName.trim()}
              className="w-full"
            >
              Add Skill
            </Button>
          </div>
        </div>
      </div>

      {/* Skills List */}
      {skills.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No skills added yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start adding skills using the form above
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {skillsByCategory.map((category) => {
            if (category.skills.length === 0) return null;

            const Icon = category.icon;

            return (
              <div key={category.value} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{category.label}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({category.skills.length})
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, index) => {
                    const skillIndex = skills.findIndex(
                      (s) => s.name === skill.name && s.category === skill.category
                    );

                    return (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 pr-1 pl-3 py-1.5"
                      >
                        <span className="text-sm">{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skillIndex)}
                          className="ml-1 hover:bg-background/50 rounded-sm p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skip Option */}
      {skills.length === 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            You can add skills later from your profile
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Completing..." : "Complete Profile"}
        </Button>
      </div>
    </form>
  );
}
