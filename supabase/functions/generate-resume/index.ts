import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Mustache from "https://esm.sh/mustache@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HTML_TEMPLATE = `<div class="resume-preview" style="font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;color:#000;max-width:8.5in;margin:0 auto;padding:0.5in 0.75in;background:#fff">
<div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #000;padding-bottom:10px">
<h1 style="font-size:24pt;font-weight:bold;margin-bottom:8px;margin-top:0">{{name}}</h1>
<div style="font-size:10pt;color:#333">{{location}} | {{phone}} | {{email}}</div>
</div>
{{#professional_summary}}<div style="margin-top:18px"><div style="font-size:13pt;font-weight:bold;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:10px">Summary</div><div>{{professional_summary}}</div></div>{{/professional_summary}}
{{#education}}<div style="margin-top:18px"><div style="font-size:13pt;font-weight:bold;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:10px">Education</div>{{#education}}<div><div style="display:flex;justify-content:space-between;margin-bottom:3px"><div style="font-weight:bold">{{degree}} in {{field}}</div><div>{{dates}}</div></div><div>{{institution}}, {{location}}</div></div>{{/education}}</div>{{/education}}
{{#work_experience}}<div style="margin-top:18px"><div style="font-size:13pt;font-weight:bold;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:10px">Experience</div>{{#work_experience}}<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><div style="font-weight:bold">{{role}}</div><div>{{dates}}</div></div><div style="font-style:italic">{{company}}, {{location}}</div>{{#bullets}}<ul style="margin-left:20px;margin-top:4px">{{#bullets}}<li style="margin-bottom:3px">{{.}}</li>{{/bullets}}</ul>{{/bullets}}</div>{{/work_experience}}</div>{{/work_experience}}
{{#projects}}<div style="margin-top:18px"><div style="font-size:13pt;font-weight:bold;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:10px">Projects</div>{{#projects}}<div style="margin-bottom:10px"><div style="font-weight:bold">{{name}}</div>{{#bullets}}<ul style="margin-left:20px;margin-top:4px">{{#bullets}}<li style="margin-bottom:3px">{{.}}</li>{{/bullets}}</ul>{{/bullets}}</div>{{/projects}}</div>{{/projects}}
{{#skills}}<div style="margin-top:18px"><div style="font-size:13pt;font-weight:bold;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:10px">Skills</div><div>{{skills}}</div></div>{{/skills}}
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

    // 5. Prepare data for Mustache
    const mustacheData = {
      name: profileContext.name,
      location: profileContext.location,
      phone: profileContext.phone,
      email: profileContext.email,
      github: profileContext.github,
      portfolio: profileContext.portfolio,
      linkedin: profileContext.linkedin,
      professional_summary: generatedContent.professional_summary,
      experience: generatedContent.experience,
      projects: generatedContent.projects,
      education: generatedContent.education,
      skills: generatedContent.skills,
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
