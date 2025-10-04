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
    professional_summary?: string;
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
    category: 'technical' | 'soft' | 'language' | 'tool';
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

    // Normalize dates to YYYY-MM format
    const normalizedData = normalizeDates(validatedData);

    return new Response(
      JSON.stringify({ success: true, data: normalizedData }),
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

SPECIAL PARSING INSTRUCTIONS:
- For names: Extract EXACTLY as written in the resume, including ALL parts (first, middle, last, suffix) - DO NOT normalize or modify
- For bullet points: Include ALL bullet points, including the first one in each list
- For professional summaries: Extract the professional summary/objective section if present
- For dates: Extract dates exactly as written, including formats like "February 2025 - May 2025" or "2021-2025"

Return ONLY valid JSON with this exact structure. Use empty arrays [] for missing sections:

{
  "personal_info": {
    "name": "EXACT full name from resume as written, including suffix if present",
    "email": "EXACT email or empty string",
    "phone": "EXACT phone or empty string",
    "location": "EXACT location or empty string",
    "linkedin": "EXACT URL or null",
    "github": "EXACT URL or null",
    "portfolio": "EXACT URL or null",
    "professional_summary": "Professional summary/objective section if present, otherwise null"
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
      "category": "technical|soft|language|tool (best fit based on context - use 'technical' for programming languages, frameworks, and libraries; use 'soft' for soft skills like communication; use 'language' for human languages; use 'tool' for software tools and platforms)"
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

function normalizeDates(parsed: ParsedResume): ParsedResume {
  // Helper function to convert various date formats to YYYY-MM
  const normalizeDate = (dateStr: string | null): string | null => {
    if (!dateStr || dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'current') {
      return null;
    }

    try {
      // Handle "YYYY-YYYY" format (e.g., "2021-2025") - take the first year
      const yearRangeMatch = dateStr.match(/^(\d{4})-(\d{4})$/);
      if (yearRangeMatch) {
        // For education start/end, we'll just use the year and assume January for start, December for end
        // But we need to know if this is start or end date - we'll handle this in the mapping below
        return dateStr; // Keep original format for now, will handle in mapping
      }

      // Handle "YYYY" format (e.g., "2021")
      const yearOnlyMatch = dateStr.match(/^\d{4}$/);
      if (yearOnlyMatch) {
        return `${dateStr}-01`; // Default to January
      }

      // Handle "Month YYYY" or "Month YYYY - Month YYYY" format
      const monthYearMatch = dateStr.match(/([A-Za-z]+)\s+(\d{4})/);
      if (monthYearMatch) {
        const monthName = monthYearMatch[1];
        const year = monthYearMatch[2];
        const monthMap: Record<string, string> = {
          'january': '01', 'jan': '01',
          'february': '02', 'feb': '02',
          'march': '03', 'mar': '03',
          'april': '04', 'apr': '04',
          'may': '05',
          'june': '06', 'jun': '06',
          'july': '07', 'jul': '07',
          'august': '08', 'aug': '08',
          'september': '09', 'sep': '09', 'sept': '09',
          'october': '10', 'oct': '10',
          'november': '11', 'nov': '11',
          'december': '12', 'dec': '12'
        };
        const month = monthMap[monthName.toLowerCase()];
        if (month) {
          return `${year}-${month}`;
        }
      }

      // If we can't parse it, return original
      return dateStr;
    } catch (e) {
      console.warn(`Failed to normalize date: ${dateStr}`, e);
      return dateStr;
    }
  };

  // Normalize experience dates
  parsed.experience = parsed.experience.map(exp => {
    // Handle "Month YYYY - Month YYYY" format by splitting
    if (exp.start_date && exp.start_date.includes(' - ')) {
      const parts = exp.start_date.split(' - ');
      exp.start_date = normalizeDate(parts[0].trim()) || exp.start_date;
      exp.end_date = normalizeDate(parts[1].trim()) || exp.end_date;
    } else {
      exp.start_date = normalizeDate(exp.start_date) || exp.start_date;
      exp.end_date = normalizeDate(exp.end_date);
    }
    return exp;
  });

  // Normalize education dates
  parsed.education = parsed.education.map(edu => {
    // Handle "YYYY-YYYY" format specifically for education
    if (edu.start_date && edu.start_date.match(/^(\d{4})-(\d{4})$/)) {
      const years = edu.start_date.split('-');
      edu.start_date = `${years[0]}-01`; // Start year, January
      edu.end_date = `${years[1]}-12`; // End year, December
    } else if (edu.start_date && edu.start_date.includes(' - ')) {
      // Handle "Month YYYY - Month YYYY" format
      const parts = edu.start_date.split(' - ');
      edu.start_date = normalizeDate(parts[0].trim()) || edu.start_date;
      edu.end_date = normalizeDate(parts[1].trim()) || edu.end_date;
    } else {
      edu.start_date = normalizeDate(edu.start_date) || edu.start_date;
      edu.end_date = normalizeDate(edu.end_date);
    }
    return edu;
  });

  console.log('Date normalization complete');
  return parsed;
}
