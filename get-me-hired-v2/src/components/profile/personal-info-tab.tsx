"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, MapPin, FileText, Linkedin, Github, Globe } from "lucide-react";

type PersonalInfoData = {
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

type PersonalInfoTabProps = {
  data: PersonalInfoData;
  isEditMode: boolean;
  onChange: (field: keyof PersonalInfoData, value: string) => void;
};

export function PersonalInfoTab({ data, isEditMode, onChange }: PersonalInfoTabProps) {
  return (
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
          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={data.firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
                placeholder="John"
                disabled={!isEditMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={data.middleName}
                onChange={(e) => onChange("middleName", e.target.value)}
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
                value={data.lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
                placeholder="Doe"
                disabled={!isEditMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input
                id="suffix"
                value={data.suffix}
                onChange={(e) => onChange("suffix", e.target.value)}
                placeholder="Jr., Sr., III"
                disabled={!isEditMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="john.doe@example.com"
              disabled={!isEditMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              disabled={!isEditMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => onChange("location", e.target.value)}
              placeholder="San Francisco, CA"
              disabled={!isEditMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="bio"
            value={data.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            placeholder="Brief professional summary or objective..."
            className="min-h-[120px]"
            disabled={!isEditMode}
          />
        </CardContent>
      </Card>

      {/* Online Presence */}
      <Card>
        <CardHeader>
          <CardTitle>Online Presence</CardTitle>
          <CardDescription>
            Professional links and portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              type="url"
              value={data.linkedin}
              onChange={(e) => onChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/username"
              disabled={!isEditMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </Label>
            <Input
              id="github"
              type="url"
              value={data.github}
              onChange={(e) => onChange("github", e.target.value)}
              placeholder="https://github.com/username"
              disabled={!isEditMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portfolio Website
            </Label>
            <Input
              id="portfolio"
              type="url"
              value={data.portfolio}
              onChange={(e) => onChange("portfolio", e.target.value)}
              placeholder="https://yourwebsite.com"
              disabled={!isEditMode}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
