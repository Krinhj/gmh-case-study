# parse-resume Edge Function

Extracts structured data from uploaded resume PDFs with **strict anti-hallucination safeguards**.

## Anti-Hallucination Strategy

This function implements multiple layers of protection against OpenAI hallucinating or fabricating information:

### 1. **System Prompt Safeguards**

The OpenAI system prompt includes 10 critical anti-hallucination rules:

1. ✅ ONLY extract information that is DIRECTLY present in the resume
2. ✅ DO NOT infer, assume, or generate ANY information not explicitly written
3. ✅ If information is not present, use `null` or empty arrays - NEVER make up data
4. ✅ DO NOT add example data, placeholder text, or "typical" information
5. ✅ DO NOT embellish or expand on what is written
6. ✅ If unsure about any information, OMIT it rather than guess
7. ✅ Preserve EXACT wording from resume - do not paraphrase unless necessary
8. ✅ For dates, use ONLY what is written (e.g., "2021-2025")
9. ✅ For achievements/responsibilities, extract ONLY explicitly stated items
10. ✅ NEVER add skills, technologies, or tools that are not mentioned

### 2. **Low Temperature Setting**

- **Temperature: 0.1** (extremely low to reduce creativity/hallucination)
- Forces deterministic, conservative output
- Minimizes AI "imagination"

### 3. **JSON Response Format**

- **Forced JSON structure** using OpenAI's `response_format: { type: "json_object" }`
- Ensures consistent, parseable output
- Prevents free-form text responses

### 4. **Post-Processing Validation**

After OpenAI returns data, we validate EVERY field against the original resume text:

```typescript
function validateParsedData(parsed: ParsedResume, originalText: string): ParsedResume {
  // Check if name exists in original text
  if (!originalText.includes(parsed.personal_info.name)) {
    console.warn('Name validation failed - not found in original text');
    parsed.personal_info.name = '';
  }

  // Remove companies not found in text
  parsed.experience = parsed.experience.filter(exp =>
    lowerText.includes(exp.company.toLowerCase())
  );

  // Remove institutions not found in text
  parsed.education = parsed.education.filter(edu =>
    lowerText.includes(edu.institution.toLowerCase())
  );

  // Remove projects not found in text
  parsed.projects = parsed.projects.filter(proj =>
    lowerText.includes(proj.name.toLowerCase())
  );

  // Remove skills not found in text
  parsed.skills = parsed.skills.filter(skill =>
    lowerText.includes(skill.name.toLowerCase())
  );
}
```

**What this catches:**
- Fabricated company names
- Made-up project titles
- Invented skills
- Hallucinated email addresses
- Any data not actually in the resume

### 5. **Retry with Exponential Backoff**

- Up to 2 attempts if parsing fails
- Exponential backoff between retries (1s, 2s)
- Handles transient API errors gracefully

### 6. **Explicit Null Handling**

The prompt explicitly instructs:
> "If ANY field is not explicitly in the resume, use null or empty string/array. NEVER fabricate information."

Example structured output:
```json
{
  "personal_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "linkedin": null,  // Not in resume - explicitly null
    "github": null     // Not in resume - explicitly null
  }
}
```

## Input

```typescript
{
  file_url: string;  // Supabase Storage URL (e.g., "resumes/{user_id}/resume.pdf")
  user_id: string;   // UUID of authenticated user
}
```

## Output

### Success Response:
```typescript
{
  success: true,
  data: {
    personal_info: {
      name: string;
      email: string;
      phone: string;
      location: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    },
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
    }>,
    education: Array<{...}>,
    projects: Array<{...}>,
    skills: Array<{...}>
  }
}
```

### Error Response:
```typescript
{
  success: false,
  error: string  // Human-readable error message
}
```

## Environment Variables Required

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for Storage access
- `OPENAI_API_KEY` - OpenAI API key (for GPT-4o)
- `PDFCO_API_KEY` (optional) - For better PDF text extraction

## PDF Text Extraction

Uses `_shared/pdf-extractor.ts` which supports:

1. **PDF.co API** (recommended - free tier available)
   - Set `PDFCO_API_KEY` environment variable
   - More reliable than basic extraction
   - Handles complex PDFs and scanned documents

2. **Basic extraction** (fallback)
   - Used if no PDF.co key is set
   - Works for simple text PDFs
   - May struggle with complex layouts

## Error Handling

| Error | Cause | User Message |
|-------|-------|-------------|
| Missing file_url | Invalid request | "file_url and user_id are required" |
| PDF download failed | Storage error | "Failed to download file: ..." |
| Text extraction < 50 chars | Corrupted/image PDF | "Could not extract sufficient text from PDF" |
| OpenAI API error | API issue | "Failed to parse resume after 2 attempts" |
| Validation failed | Hallucinated data | Silently removes invalid data |

## Usage Example

```typescript
// In Next.js API route
const response = await fetch('/api/parse-resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_url: 'resumes/user-123/resume.pdf'
  })
});

const { success, data, error } = await response.json();

if (success) {
  // Use parsed data to pre-fill onboarding form
  setPersonalInfo(data.personal_info);
  setExperience(data.experience);
  // etc.
}
```

## Testing Anti-Hallucination

To verify safeguards work:

1. **Upload a resume with limited information**
   - Missing email → Should return empty string, not fabricate one
   - No GitHub link → Should return null, not generate fake URL

2. **Upload resume with unusual formatting**
   - Check if parser only extracts actual content
   - Verify no "example" or "placeholder" data appears

3. **Check validation logs**
   - Look for console warnings about removed data
   - Example: `"Skill 'React' not found in resume - removing"`

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy parse-resume

# Set environment variables
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set PDFCO_API_KEY=...  # Optional
```

## Known Limitations

1. **Image-based PDFs**: Cannot extract text from scanned documents without OCR
2. **Complex layouts**: Multi-column resumes may have text order issues
3. **Non-English text**: Works best with English resumes (can be extended)

## Future Improvements

- [ ] OCR integration for scanned PDFs
- [ ] Multi-language support
- [ ] Confidence scores for extracted data
- [ ] User confirmation UI for ambiguous data
