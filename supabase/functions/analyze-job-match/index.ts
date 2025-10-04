// analyze-job-match Edge Function
// Analyzes how well user's profile matches job requirements using GPT-4o

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchAnalysisResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strong_points: string[];
  weak_points: string[];
  recommendations: string[];
  should_apply: boolean;
  reasoning: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, job_application_id } = await req.json();

    if (!user_id || !job_application_id) {
      throw new Error("Missing required fields: user_id and job_application_id");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile data
    const { data: personalInfo } = await supabase
      .from("personal_info")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const { data: experience } = await supabase
      .from("work_experience")
      .select("*")
      .eq("user_id", user_id)
      .order("start_date", { ascending: false });

    const { data: education } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", user_id)
      .order("start_date", { ascending: false });

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user_id)
      .order("start_date", { ascending: false });

    const { data: skills } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", user_id);

    // Fetch job application data
    const { data: jobApplication, error: jobError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("id", job_application_id)
      .single();

    if (jobError || !jobApplication) {
      throw new Error("Job application not found");
    }

    // Check if we have enough data to analyze
    if (!jobApplication.job_description && !jobApplication.job_requirements) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Cannot analyze match: Job description or requirements are required",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Format profile data for the prompt
    const formattedExperience = experience
      ?.map(
        (exp) =>
          `${exp.role} at ${exp.company} (${exp.start_date} - ${exp.is_current ? "Present" : exp.end_date})
Location: ${exp.location || "N/A"}
Responsibilities: ${exp.responsibilities?.join(", ") || "N/A"}
Achievements: ${exp.achievements?.join(", ") || "N/A"}
Skills: ${exp.skills?.join(", ") || "N/A"}`
      )
      .join("\n\n") || "No experience data";

    const formattedEducation = education
      ?.map(
        (edu) =>
          `${edu.degree} in ${edu.field_of_study || "N/A"} from ${edu.institution} (${edu.start_date} - ${edu.is_current ? "Present" : edu.end_date})
GPA: ${edu.gpa || "N/A"}
Coursework: ${edu.relevant_coursework?.join(", ") || "N/A"}
Achievements: ${edu.achievements?.join(", ") || "N/A"}`
      )
      .join("\n\n") || "No education data";

    const formattedProjects = projects
      ?.map(
        (proj) =>
          `${proj.name}
Description: ${proj.description || "N/A"}
Technologies: ${proj.skills?.join(", ") || "N/A"}
Key Features: ${proj.key_features?.join(", ") || "N/A"}
Achievements: ${proj.achievements?.join(", ") || "N/A"}`
      )
      .join("\n\n") || "No projects data";

    const formattedSkills = skills
      ?.map((skill) => `${skill.name} (${skill.category})`)
      .join(", ") || "No skills data";

    // Call OpenAI API
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `You are a job matching expert and career advisor. Analyze how well the candidate's profile matches the job requirements.

Evaluate based on:
- Technical skills alignment
- Experience relevance (role, industry, responsibilities)
- Education requirements
- Project portfolio fit
- Years of experience
- Specific achievements that demonstrate required competencies

Return ONLY valid JSON with this structure:
{
  "match_score": 0-100 (integer),
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "strong_points": ["What makes candidate a good fit"],
  "weak_points": ["Areas where candidate may fall short"],
  "recommendations": [
    "Specific advice for improving match",
    "Experiences to highlight in resume",
    "Skills to emphasize in cover letter"
  ],
  "should_apply": true/false,
  "reasoning": "2-3 sentence explanation of match score"
}`;

    const userPrompt = `Candidate Profile:
Name: ${personalInfo?.full_name || "N/A"}
Location: ${personalInfo?.location || "N/A"}
Summary: ${personalInfo?.summary || "N/A"}

Experience:
${formattedExperience}

Education:
${formattedEducation}

Projects:
${formattedProjects}

Skills:
${formattedSkills}

Job Posting:
Company: ${jobApplication.company}
Role: ${jobApplication.role}
Location: ${jobApplication.location || "N/A"}
Work Mode: ${jobApplication.work_mode || "N/A"}
Industry: ${jobApplication.industry || "N/A"}

Job Description: ${jobApplication.job_description || "N/A"}

Requirements/Qualifications: ${jobApplication.job_requirements || "N/A"}

Responsibilities: ${jobApplication.job_responsibilities || "N/A"}

Analyze the match thoroughly and provide actionable insights.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
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
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const analysisResult: MatchAnalysisResult = JSON.parse(
      openaiData.choices[0].message.content
    );

    // Validate match_score is between 0-100
    if (analysisResult.match_score < 0 || analysisResult.match_score > 100) {
      analysisResult.match_score = Math.max(0, Math.min(100, analysisResult.match_score));
    }

    // Update job application with match score only
    // (Full insights will be returned in response and displayed in UI)
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        match_score: analysisResult.match_score,
      })
      .eq("id", job_application_id);

    if (updateError) {
      console.error("Error updating job application:", updateError);
      throw updateError;
    }

    console.log(`Match analysis complete for job ${job_application_id}: ${analysisResult.match_score}%`);

    // Return full analysis results (will be displayed in UI)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...analysisResult,
          analyzed_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in analyze-job-match:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred during match analysis",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
