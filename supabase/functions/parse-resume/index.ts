// parse-resume Edge Function
// Extracts structured data from uploaded resume PDF with anti-hallucination safeguards

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { extractText } from "npm:unpdf";

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseResumeRequest {
  file_url: string;
  user_id: string;
}

interface ParsedResume {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  experience: Array<{
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string | null;
    description: string;
    responsibilities: string[];
    achievements: string[];
    technologies: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
    location: string;
    start_date: string;
    end_date: string | null;
    gpa?: string;
    relevant_coursework: string[];
    achievements: string[];
    activities: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    project_url?: string;
    technologies: string[];
    key_features: string[];
    achievements: string[];
    role_responsibilities: string[];
  }>;
  skills: Array<{
    name: string;
    category: 'technical' | 'soft_skill' | 'language' | 'tool';
    proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { file_url, user_id }: ParseResumeRequest = await req.json();

    if (!file_url || !user_id) {
      throw new Error('file_url and user_id are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('File URL received:', file_url);

    // Download PDF from Supabase Storage
    let filePath = file_url;
    if (file_url.includes('http')) {
      filePath = file_url.replace(`${supabaseUrl}/storage/v1/object/public/resumes/`, '');
    }

    console.log('Downloading file from storage:', filePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Extract text using unpdf (modern pdf-parse alternative)
    console.log('Extracting text from PDF using unpdf...');
    const pdfBuffer = await fileData.arrayBuffer();

    // unpdf returns { totalPages, text } where text is string[] by default
    // Use mergePages: true to get a single string
    const result = await extractText(new Uint8Array(pdfBuffer), { mergePages: true });
    const pdfText = result.text;

    console.log(`Extracted text from ${result.totalPages} pages`);
    console.log(`Total text length: ${pdfText.length} characters`);

    if (!pdfText || pdfText.trim().length < 50) {
      throw new Error('Could not extract sufficient text from PDF. File may be corrupted or image-based.');
    }

    // Call OpenAI with STRICT anti-hallucination prompts
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Calling OpenAI API for parsing...');
    const parsedData = await parseResumeWithOpenAI(pdfText, openaiApiKey);

    // Validate parsed data
    const validatedData = validateParsedData(parsedData, pdfText);

    return new Response(
      JSON.stringify({ success: true, data: validatedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function parseResumeWithOpenAI(resumeText: string, apiKey: string): Promise<ParsedResume> {
  const systemPrompt = `You are a precise resume parser. Your task is to extract ONLY information that is EXPLICITLY stated in the resume text.

CRITICAL ANTI-HALLUCINATION RULES:
1. ONLY extract information that is DIRECTLY present in the resume text
2. DO NOT infer, assume, or generate ANY information not explicitly written
3. If information is not present, use null or empty arrays - NEVER make up data
4. DO NOT add example data, placeholder text, or "typical" information
5. DO NOT embellish or expand on what is written
6. If you're unsure about any information, OMIT it rather than guess
7. Preserve EXACT wording from the resume - do not paraphrase unless necessary for structure
8. For dates, use ONLY what is written (e.g., "2021-2025", "February 2025 - May 2025")
9. For achievements/responsibilities, extract ONLY what is explicitly bullet-pointed or stated
10. NEVER add skills, technologies, or tools that are not mentioned in the resume

Return ONLY valid JSON with this exact structure. Use empty arrays [] for missing sections:

{
  "personal_info": {
    "name": "EXACT name from resume or empty string",
    "email": "EXACT email or empty string",
    "phone": "EXACT phone or empty string",
    "location": "EXACT location or empty string",
    "linkedin": "EXACT URL or null",
    "github": "EXACT URL or null",
    "portfolio": "EXACT URL or null"
  },
  "experience": [
    {
      "company": "EXACT company name",
      "role": "EXACT role title",
      "location": "EXACT location or empty string",
      "start_date": "EXACT start date as written",
      "end_date": "EXACT end date or null if current",
      "description": "First paragraph/summary if present, otherwise empty string",
      "responsibilities": ["ONLY explicitly listed responsibilities"],
      "achievements": ["ONLY explicitly listed achievements"],
      "technologies": ["ONLY technologies/tools explicitly mentioned for this role"]
    }
  ],
  "education": [
    {
      "institution": "EXACT institution name",
      "degree": "EXACT degree name",
      "field_of_study": "EXACT field/major",
      "location": "EXACT location or empty string",
      "start_date": "EXACT start date",
      "end_date": "EXACT end date or null if current",
      "gpa": "EXACT GPA if stated, otherwise null",
      "relevant_coursework": ["ONLY if explicitly listed"],
      "achievements": ["ONLY if explicitly listed"],
      "activities": ["ONLY if explicitly listed"]
    }
  ],
  "projects": [
    {
      "name": "EXACT project name",
      "description": "EXACT description as written",
      "project_url": "EXACT URL if provided, otherwise null",
      "technologies": ["ONLY technologies explicitly listed for this project"],
      "key_features": ["ONLY features explicitly mentioned"],
      "achievements": ["ONLY achievements explicitly stated"],
      "role_responsibilities": ["ONLY if role is explicitly described"]
    }
  ],
  "skills": [
    {
      "name": "EXACT skill name as written",
      "category": "technical|soft_skill|language|tool (best fit based on context)",
      "proficiency_level": null (do not guess proficiency unless explicitly stated)
    }
  ]
}

REMEMBER: If ANY field is not explicitly in the resume, use null or empty string/array. NEVER fabricate information.`;

  const userPrompt = `Extract structured information from this resume. Follow ALL anti-hallucination rules strictly.

Resume text:
${resumeText}

Return ONLY the JSON object, no additional text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  return JSON.parse(content) as ParsedResume;
}

function validateParsedData(parsed: ParsedResume, originalText: string): ParsedResume {
  const lowerText = originalText.toLowerCase();

  if (parsed.personal_info.name && !originalText.includes(parsed.personal_info.name)) {
    console.warn('Name validation failed - not found in original text');
    parsed.personal_info.name = '';
  }

  if (parsed.personal_info.email && !lowerText.includes(parsed.personal_info.email.toLowerCase())) {
    console.warn('Email validation failed - not found in original text');
    parsed.personal_info.email = '';
  }

  parsed.experience = parsed.experience.filter(exp => {
    if (!lowerText.includes(exp.company.toLowerCase())) {
      console.warn(`Company "${exp.company}" not found in resume - removing`);
      return false;
    }
    return true;
  });

  parsed.education = parsed.education.filter(edu => {
    if (!lowerText.includes(edu.institution.toLowerCase())) {
      console.warn(`Institution "${edu.institution}" not found in resume - removing`);
      return false;
    }
    return true;
  });

  parsed.projects = parsed.projects.filter(proj => {
    if (!lowerText.includes(proj.name.toLowerCase())) {
      console.warn(`Project "${proj.name}" not found in resume - removing`);
      return false;
    }
    return true;
  });

  parsed.skills = parsed.skills.filter(skill => {
    if (!lowerText.includes(skill.name.toLowerCase())) {
      console.warn(`Skill "${skill.name}" not found in resume - removing`);
      return false;
    }
    return true;
  });

  console.log('Validation complete - hallucinated data removed');
  return parsed;
}
