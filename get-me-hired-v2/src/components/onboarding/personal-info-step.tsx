"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Mail, Phone, MapPin, FileText, Linkedin, Github, Globe } from "lucide-react";

type PersonalInfoStepProps = {
  data: {
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
  onUpdate: (data: Partial<PersonalInfoStepProps["data"]>) => void;
  onNext: () => void;
  onBack?: () => void;
};

export function PersonalInfoStep({ data, onUpdate, onNext, onBack }: PersonalInfoStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Personal Information</h2>
        <p className="text-muted-foreground">
          Let&apos;s start with the basics. This information will appear on your résumé.
        </p>
      </div>

      {/* Name Fields */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={data.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              type="text"
              placeholder="A."
              value={data.middleName}
              onChange={(e) => onUpdate({ middleName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suffix">Suffix</Label>
            <Input
              id="suffix"
              type="text"
              placeholder="Jr., Sr., III"
              value={data.suffix}
              onChange={(e) => onUpdate({ suffix: e.target.value })}
            />
          </div>
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
              placeholder="you@example.com"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              className="pl-10"
              required
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
              placeholder="+1 (555) 000-0000"
              value={data.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              className="pl-10"
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
            type="text"
            placeholder="San Francisco, CA"
            value={data.location}
            onChange={(e) => onUpdate({ location: e.target.value })}
            className="pl-10"
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
            placeholder="Brief summary of your professional background and career goals..."
            value={data.bio}
            onChange={(e) => onUpdate({ bio: e.target.value })}
            className="pl-10 min-h-[100px]"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          A 2-3 sentence overview that will appear at the top of your résumé
        </p>
      </div>

      {/* Links */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold">Professional Links (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Add links to your online profiles and portfolio
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="linkedin"
                type="text"
                placeholder="linkedin.com/in/yourprofile"
                value={data.linkedin}
                onChange={(e) => onUpdate({ linkedin: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <div className="relative">
              <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="github"
                type="text"
                placeholder="github.com/yourusername"
                value={data.github}
                onChange={(e) => onUpdate({ github: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="portfolio"
                type="text"
                placeholder="yourportfolio.com"
                value={data.portfolio}
                onChange={(e) => onUpdate({ portfolio: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <Button type="submit" className="gap-2 ml-auto">
          Continue to Experience
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

