# LaTeX Templates for GetMeHired

This directory contains LaTeX templates used for generating tailored resumes and cover letters.

## Templates

### `latex/resume.tex`
ATS-optimized resume template based on Ronnie Talabucon Jr.'s resume structure.

**Mustache Placeholders:**
- `{{name}}` - Full name
- `{{location}}` - City, State/Province
- `{{phone}}` - Phone number
- `{{email}}` - Email address
- `{{github}}` - GitHub profile URL
- `{{portfolio}}` - Portfolio website URL
- `{{linkedin}}` - LinkedIn profile URL
- `{{professional_summary}}` - AI-generated professional summary (2-3 sentences)
- `{{#education}}` - Education entries array
  - `{{institution}}` - University/School name
  - `{{dates}}` - Date range (e.g., "2021-2025")
  - `{{degree}}` - Degree name
  - `{{field}}` - Field of study
  - `{{location}}` - School location
  - `{{gpa}}` - GPA (optional)
  - `{{#relevant_coursework}}` - Array of relevant courses
  - `{{#honors}}` - Array of honors/achievements
- `{{#experience}}` - Work experience entries array
  - `{{role}}` - Job title
  - `{{dates}}` - Date range or single date
  - `{{company}}` - Company name
  - `{{location}}` - Job location
  - `{{#bullets}}` - Array of achievement/responsibility bullets (AI-tailored)
- `{{#projects}}` - Projects array
  - `{{name}}` - Project name
  - `{{#technologies}}` - Array of technologies used
  - `{{#bullets}}` - Array of project highlights/achievements
- `{{#skills}}` - Skills object
  - `{{#skills.languages}}` - Programming languages array
  - `{{#skills.frameworks}}` - Frameworks/libraries array
  - `{{#skills.tools}}` - Tools & platforms array
  - `{{#skills.ai_ml}}` - AI/ML technologies array

### `latex/cover-letter.tex`
Professional cover letter template.

**Mustache Placeholders:**
- `{{name}}` - Full name
- `{{location}}` - City, State/Province
- `{{phone}}` - Phone number
- `{{email}}` - Email address
- `{{company}}` - Company name
- `{{company_address}}` - Company address (optional)
- `{{hiring_manager}}` - Hiring manager name (if known)
- `{{salutation}}` - Opening salutation (e.g., "Dear Hiring Manager")
- `{{#paragraphs}}` - Array of cover letter paragraphs (AI-generated)

## Usage in Edge Functions

1. **Load template:**
   ```typescript
   const template = await Deno.readTextFile('./templates/latex/resume.tex');
   ```

2. **Prepare data:**
   ```typescript
   const templateData = {
     name: "Ronnie Talabucon Jr.",
     email: "ron.talabuconjr.dev@gmail.com",
     professional_summary: aiGeneratedSummary,
     experience: aiTailoredExperience,
     // ... etc
   };
   ```

3. **Render with Mustache:**
   ```typescript
   import Mustache from 'mustache';
   const filledLatex = Mustache.render(template, templateData);
   ```

4. **Compile to PDF:**
   ```typescript
   const pdfBuffer = await compileLatexToPdf(filledLatex);
   ```

## Template Features

- **ATS-Optimized:** Clean structure that parses well in Applicant Tracking Systems
- **Professional Formatting:** Uses standard LaTeX packages for professional appearance
- **Dynamic Sections:** Conditional rendering based on data availability
- **Font Awesome Icons:** Modern icons for contact information
- **Single Page:** Optimized to fit on one page
- **Hyperlinks:** Clickable links for email, GitHub, portfolio, LinkedIn

## Compilation

Templates are compiled using [LaTeX.Online](https://latexonline.cc/compile) API in the Edge Functions.

**API Endpoint:** `https://latexonline.cc/compile`
**Method:** POST with LaTeX string in body
**Response:** PDF buffer

## Customization

To modify the template style:
1. Edit the LaTeX file directly
2. Maintain Mustache placeholder syntax `{{variable}}` and `{{#array}}...{{/array}}`
3. Test compilation locally before deploying

## Notes

- All templates use UTF-8 encoding
- Templates support conditional sections (Mustache `{{#variable}}...{{/variable}}`)
- Empty arrays are handled gracefully (section won't render if array is empty)
- Special characters in content should be escaped for LaTeX (handled by Edge Function)
