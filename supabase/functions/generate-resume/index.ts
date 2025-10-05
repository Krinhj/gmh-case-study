import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Mustache from "https://esm.sh/mustache@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HTML_TEMPLATE = `<div class="resume-preview" style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.5;color:#111;max-width:8.5in;margin:0 auto;padding:0.6in 0.75in;background:#fff">
  <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px">
    <h1 style="font-size:24pt;font-weight:700;margin:0 0 8px">{{name}}</h1>
    <div style="font-size:10pt;color:#333">{{contact_line}}</div>
  </div>

  {{#has_summary}}
  <div style="margin-top:18px">
    <div style="font-size:13pt;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px">Summary</div>
    <div>{{professional_summary}}</div>
  </div>
  {{/has_summary}}

  {{#has_experience}}
  <div style="margin-top:18px">
    <div style="font-size:13pt;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px">Experience</div>
    {{#experience}}
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px">
        <div style="font-weight:700">{{role}}</div>
        <div>{{dates}}</div>
      </div>
      {{#company_line}}<div style="font-style:italic;margin-bottom:4px">{{company_line}}</div>{{/company_line}}
      {{#summary}}<div style="margin-bottom:6px">{{summary}}</div>{{/summary}}
      {{#hasBullets}}
      <ul style="margin-left:20px;margin-top:4px">
        {{#bullets}}<li style="margin-bottom:4px">{{.}}</li>{{/bullets}}
      </ul>
      {{/hasBullets}}
    </div>
    {{/experience}}
  </div>
  {{/has_experience}}

  {{#has_projects}}
  <div style="margin-top:18px">
    <div style="font-size:13pt;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px">Projects</div>
    {{#projects}}
    <div style="margin-bottom:14px">
      <div style="font-weight:700;margin-bottom:4px">{{name}}</div>
      {{#description}}<div style="margin-bottom:6px">{{description}}</div>{{/description}}
      {{#hasBullets}}
      <ul style="margin-left:20px;margin-top:4px">
        {{#bullets}}<li style="margin-bottom:4px">{{.}}</li>{{/bullets}}
      </ul>
      {{/hasBullets}}
    </div>
    {{/projects}}
  </div>
  {{/has_projects}}

  {{#has_education}}
  <div style="margin-top:18px">
    <div style="font-size:13pt;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px">Education</div>
    {{#education}}
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:4px">
        <div style="font-weight:700">{{title}}</div>
        <div>{{dates}}</div>
      </div>
      {{#institution_line}}<div>{{institution_line}}</div>{{/institution_line}}
      {{#hasBullets}}
      <ul style="margin-left:20px;margin-top:4px">
        {{#bullets}}<li style="margin-bottom:4px">{{.}}</li>{{/bullets}}
      </ul>
      {{/hasBullets}}
    </div>
    {{/education}}
  </div>
  {{/has_education}}

  {{#has_skills}}
  <div style="margin-top:18px">
    <div style="font-size:13pt;font-weight:700;border-bottom:1px solid #000;padding-bottom:4px;margin-bottom:10px">Skills</div>
    <div>{{skills}}</div>
  </div>
  {{/has_skills}}
</div>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "OPENAI_API_KEY not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { user_id, job_application_id, preview = false } = await req.json();

    if (!user_id || !job_application_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Fetch user profile data
    const [personalInfo, workExperience, education, projects, skills] = await Promise.all([
      supabase.from("personal_info").select("*").eq("user_id", user_id).single(),
      supabase.from("work_experience").select("*").eq("user_id", user_id).order("start_date", { ascending: false }),
      supabase.from("education").select("*").eq("user_id", user_id).order("start_date", { ascending: false }),
      supabase.from("projects").select("*").eq("user_id", user_id).order("created_at", { ascending: false }),
      supabase.from("skills").select("*").eq("user_id", user_id),
    ]);

    if (!personalInfo.data) {
      return new Response(
        JSON.stringify({ success: false, error: "User profile not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 2. Fetch job application data
    const { data: jobApp, error: jobError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", job_application_id)
      .eq("user_id", user_id)
      .single();

    if (jobError || !jobApp) {
      return new Response(
        JSON.stringify({ success: false, error: "Job application not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // 3. Format profile data for OpenAI prompt
    const profileContext = {
      name: personalInfo.data.full_name,
      email: personalInfo.data.email,
      phone: personalInfo.data.phone,
      location: personalInfo.data.location,
      github: personalInfo.data.github_url,
      portfolio: personalInfo.data.portfolio_url,
      linkedin: personalInfo.data.linkedin_url,
      work_experience: workExperience.data?.map((exp) => ({
        company: exp.company,
        role: exp.role,
        dates: `${exp.start_date} - ${exp.end_date || "Present"}`,
        location: exp.location,
        responsibilities: exp.responsibilities || [],
        achievements: exp.achievements || [],
        skills: exp.skills || [],
      })) || [],
      education: education.data?.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field_of_study,
        dates: `${edu.start_date} - ${edu.end_date || "Present"}`,
        location: edu.location,
        gpa: edu.gpa,
        relevant_coursework: edu.relevant_coursework || [],
        honors: edu.honors || [],
      })) || [],
      projects: projects.data?.map((proj) => ({
        name: proj.name,
        description: proj.description,
        skills: proj.skills || [],
        key_features: proj.key_features || [],
        github_url: proj.github_url,
        live_url: proj.live_url,
      })) || [],
      skills: skills.data || [],
    };

    const jobContext = {
      company: jobApp.company,
      role: jobApp.role,
      description: jobApp.job_description || "",
      requirements: jobApp.job_requirements || "",
      responsibilities: jobApp.job_responsibilities || "",
    };

    // 4. Call OpenAI to generate tailored content
    const systemPrompt = "You are an expert resume writer. Return only valid JSON with structure: {professional_summary, experience, projects, education, skills}. Tailor content to job. Keep concise. Skills should be a single string with comma-separated values.";

    const userPrompt = "Generate resume for: " + JSON.stringify({
      name: profileContext.name,
      work_experience: profileContext.work_experience,
      education: profileContext.education,
      projects: profileContext.projects,
      skills: profileContext.skills.map(s => s.name),
      job: {
        company: jobContext.company,
        role: jobContext.role,
        description: jobContext.description,
        requirements: jobContext.requirements,
      }
    });

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = JSON.parse(openaiData.choices[0].message.content);

    const toText = (value: unknown): string => {
      if (typeof value === "string") {
        return value.trim();
      }
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
          .join(" ");
      }
      if (value && typeof value === "object" && "text" in (value as Record<string, unknown>)) {
        const textValue = (value as Record<string, unknown>).text;
        return typeof textValue === "string" ? textValue.trim() : "";
      }
      return "";
    };

    const toEntryArray = (value: unknown): Record<string, unknown>[] => {
      if (Array.isArray(value)) {
        return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
      }
      if (value && typeof value === "object") {
        return [value as Record<string, unknown>];
      }
      return [];
    };

    const toStringList = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      }
      if (typeof value === "string") {
        return value
          .split(/\r?\n|•|\u2022|\-|\u2013|\u2014/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    };

    const professionalSummary = toText(
      generatedContent.professional_summary ?? generatedContent.summary ?? ""
    );

    const experienceEntries = toEntryArray(
      generatedContent.experience ?? generatedContent.work_experience ?? []
    )
      .map((expItem) => {
        const exp = expItem as Record<string, unknown>;
        const role =
          toText(exp.role ?? exp.title ?? "") ||
          toText(exp.position ?? "");
        const company = toText(exp.company ?? "");
        const location = toText(exp.location ?? "");
        const companyLine = [company, location].filter(Boolean).join(", ");
        const dates = toText(exp.dates ?? exp.timeline ?? exp.duration ?? "");
        const summary = toText(exp.summary ?? exp.description ?? "");
        const bullets = [
          exp.bullets,
          exp.responsibilities,
          exp.achievements,
          exp.highlights,
          exp.points,
        ].flatMap(toStringList);

        return {
          role: role || company || "Professional Experience",
          company_line: companyLine,
          dates,
          summary,
          bullets,
          hasBullets: bullets.length > 0,
        };
      })
      .filter((item) => item.role || item.company_line || item.summary || item.hasBullets);

    const projectEntries = toEntryArray(
      generatedContent.projects ?? profileContext.projects ?? []
    )
      .map((projItem) => {
        const proj = projItem as Record<string, unknown>;
        const name = toText(proj.name ?? proj.title ?? "") || "Project";
        const description = toText(proj.description ?? proj.summary ?? "");
        const bullets = [
          proj.bullets,
          proj.highlights,
          proj.key_features,
          proj.points,
          proj.responsibilities,
        ].flatMap(toStringList);

        return {
          name,
          description,
          bullets,
          hasBullets: bullets.length > 0,
        };
      })
      .filter((item) => item.name || item.description || item.hasBullets);

    const educationEntries = toEntryArray(
      generatedContent.education ?? profileContext.education ?? []
    )
      .map((eduItem) => {
        const edu = eduItem as Record<string, unknown>;
        const degree = toText(edu.degree ?? edu.title ?? "");
        const field = toText(edu.field ?? edu.field_of_study ?? "");
        const institution = toText(edu.institution ?? edu.school ?? "");
        const location = toText(edu.location ?? "");
        const title = degree && field ? `${degree} in ${field}` : degree || field || institution || "Education";
        const institutionLine = [institution, location].filter(Boolean).join(", ");
        const dates = toText(edu.dates ?? edu.timeline ?? edu.duration ?? "");
        const bullets = [
          edu.highlights,
          edu.achievements,
          edu.relevant_coursework,
          edu.coursework,
          edu.notes,
        ].flatMap(toStringList);

        return {
          title,
          institution_line: institutionLine,
          dates,
          bullets,
          hasBullets: bullets.length > 0,
        };
      })
      .filter((item) => item.title || item.institution_line || item.dates || item.hasBullets);

    const skillsField = generatedContent.skills ?? profileContext.skills ?? [];
    let skillsOutput = "";
    if (typeof skillsField === "string") {
      skillsOutput = skillsField.trim();
    } else if (Array.isArray(skillsField)) {
      const values = skillsField
        .map((skill) => {
          if (typeof skill === "string") {
            return skill.trim();
          }
          if (skill && typeof skill === "object" && "name" in skill) {
            const nameValue = (skill as Record<string, unknown>).name;
            return typeof nameValue === "string" ? nameValue.trim() : "";
          }
          return "";
        })
        .filter(Boolean);
      skillsOutput = values.join(", ");
    }

    if (!skillsOutput && Array.isArray(profileContext.skills)) {
      const values = profileContext.skills
        .map((skill: { name?: string }) => (skill?.name ? skill.name.trim() : ""))
        .filter(Boolean);
      skillsOutput = values.join(", ");
    }

    const contactParts = [profileContext.location, profileContext.phone, profileContext.email]
      .map((part) => toText(part))
      .filter(Boolean);
    const contactLine = contactParts.join(" | ");

    const mustacheData = {
      name: profileContext.name,
      contact_line: contactLine,
      professional_summary: professionalSummary,
      has_summary: Boolean(professionalSummary),
      has_experience: experienceEntries.length > 0,
      experience: experienceEntries,
      has_projects: projectEntries.length > 0,
      projects: projectEntries,
      has_education: educationEntries.length > 0,
      education: educationEntries,
      has_skills: Boolean(skillsOutput),
      skills: skillsOutput,
    };

    const compiledHtml = Mustache.render(HTML_TEMPLATE, mustacheData);

    // 6. Return HTML and content for client-side PDF generation
    // The client will use jsPDF + html2canvas to convert HTML to PDF
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          html: compiledHtml,
          content: generatedContent,
          metadata: {
            company: jobApp.company,
            role: jobApp.role,
            user_id: user_id,
            job_application_id: job_application_id,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error in generate-resume:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
