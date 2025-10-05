import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Mustache from "https://esm.sh/mustache@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COVER_LETTER_TEMPLATE = `<div style="font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.6;color:#111;background:#fff;max-width:8.5in;margin:0 auto;padding:1in;border:1px solid #f0f0f0">
  <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:28px">
    <div>
      <div style="font-size:18pt;font-weight:700">{{name}}</div>
      {{#tagline}}<div style="font-size:11pt;color:#555;margin-top:4px">{{tagline}}</div>{{/tagline}}
    </div>
    <div style="text-align:right;font-size:10pt;color:#444;line-height:1.5">
      {{#location}}<div>{{location}}</div>{{/location}}
      {{#phone}}<div>{{phone}}</div>{{/phone}}
      {{#email}}<div><a href="mailto:{{email}}" style="color:#444;text-decoration:none">{{email}}</a></div>{{/email}}
      {{#links}}<div><a href="{{url}}" style="color:#444;text-decoration:none">{{label}}</a></div>{{/links}}
    </div>
  </div>

  <div style="margin-bottom:20px">{{current_date}}</div>

  <div style="margin-bottom:20px;font-size:11pt;line-height:1.4">
    {{#recipient_name}}<div>{{recipient_name}}</div>{{/recipient_name}}
    <div>{{company}}</div>
    {{#company_address}}<div>{{company_address}}</div>{{/company_address}}
  </div>

  <div style="margin-bottom:20px">{{salutation}},</div>

  <div style="margin-bottom:28px">
    {{#paragraphs}}<p style="margin-bottom:16px;text-align:justify">{{.}}</p>{{/paragraphs}}
  </div>

  <div>
    <div style="margin-bottom:40px">Sincerely,</div>
    <div style="font-weight:700">{{name}}</div>
  </div>
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
        responsibilities: exp.responsibilities || [],
        achievements: exp.achievements || [],
        skills: exp.skills || [],
      })) || [],
      education: education.data || [],
      projects: projects.data || [],
      skills: skills.data?.map(s => s.name) || [],
    };

    const jobContext = {
      company: jobApp.company,
      role: jobApp.role,
      description: jobApp.job_description || "",
      requirements: jobApp.job_requirements || "",
      responsibilities: jobApp.job_responsibilities || "",
      location: jobApp.location,
    };

    // 4. Call OpenAI to generate cover letter
    const systemPrompt = `You are an expert cover letter writer specializing in creating compelling, personalized cover letters.

Your task: Write a professional cover letter that showcases the candidate's relevant experience and enthusiasm for the role.

IMPORTANT: Return ONLY a JSON object with the structure below.

Guidelines:
- Professional and enthusiastic tone
- 3-4 paragraphs total (opening, 1-2 body paragraphs, closing)
- Highlight 2-3 most relevant experiences/achievements
- Show knowledge of the company and role
- Express genuine interest and cultural fit
- Each paragraph should be 3-5 sentences
- Avoid generic phrases and clichés
- Be specific about skills and achievements

Return JSON with this EXACT structure:
{
  "salutation": "Dear Hiring Manager" or "Dear [Name]" if provided,
  "paragraphs": [
    "Opening paragraph expressing interest and brief introduction",
    "Body paragraph 1 highlighting relevant experience and achievements",
    "Body paragraph 2 (optional) connecting skills to job requirements",
    "Closing paragraph expressing enthusiasm and call to action"
  ]
}`;

    const userPrompt = `Candidate Profile:
Name: ${profileContext.name}
Location: ${profileContext.location}

Most Recent Experience:
${profileContext.work_experience.slice(0, 3).map((exp) =>
  `- ${exp.role} at ${exp.company} (${exp.dates})
   Key Achievements: ${exp.achievements.slice(0, 3).join(", ")}
   Skills: ${exp.skills.join(", ")}`
).join("\n\n")}

Education:
${profileContext.education.slice(0, 2).map((edu: any) =>
  `- ${edu.degree} in ${edu.field_of_study} from ${edu.institution}`
).join("\n")}

Notable Projects:
${profileContext.projects.slice(0, 2).map((proj: any) =>
  `- ${proj.name}: ${proj.description}`
).join("\n")}

Key Skills: ${profileContext.skills.join(", ")}

Job Posting:
Company: ${jobContext.company}
Role: ${jobContext.role}
Location: ${jobContext.location || "Not specified"}
Description: ${jobContext.description}
Requirements: ${jobContext.requirements}
Responsibilities: ${jobContext.responsibilities}

Write a compelling cover letter for this application.`;

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
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = JSON.parse(openaiData.choices[0].message.content);

    const toPlainText = (value: unknown): string => {
      if (typeof value === "string") {
        return value.trim();
      }
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
          .join(" ");
      }
      return "";
    };

    const toParagraphs = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      }
      if (typeof value === "string") {
        return value
          .split(/\r?\n\r?\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);
      }
      return [];
    };

    const paragraphs = toParagraphs(generatedContent.paragraphs);
    if (!paragraphs.length) {
      const fallbackParagraph = toPlainText(
        generatedContent.body ?? generatedContent.content ?? ""
      );
      if (fallbackParagraph) {
        paragraphs.push(fallbackParagraph);
      }
    }

    const links: Array<{ label: string; url: string }> = [];
    if (profileContext.linkedin) {
      links.push({ label: "LinkedIn", url: profileContext.linkedin });
    }
    if (profileContext.github) {
      links.push({ label: "GitHub", url: profileContext.github });
    }
    if (profileContext.portfolio) {
      links.push({ label: "Portfolio", url: profileContext.portfolio });
    }

    const recipientName =
      toPlainText(generatedContent.recipient ?? generatedContent.hiring_manager ?? "") ||
      undefined;

    const salutation =
      toPlainText(generatedContent.salutation) || "Dear Hiring Manager";

    const mustacheData = {
      name: profileContext.name,
      tagline: jobContext.role ? `${jobContext.role} Candidate` : undefined,
      location: profileContext.location,
      phone: profileContext.phone,
      email: profileContext.email,
      links,
      current_date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      recipient_name: recipientName,
      company: jobContext.company,
      company_address: jobContext.location || "",
      salutation,
      paragraphs,
    };

    const compiledHtml = Mustache.render(COVER_LETTER_TEMPLATE, mustacheData);

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
    console.error("Error in generate-cover-letter:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
