# GetMeHired – Case Study Technical Documentation

## 1. Overview

**GetMeHired** is a lightweight career productivity app built with Next.js 15 and Supabase. It helps users manage job applications, maintain a professional profile, and generate AI-tailored résumés and cover letters.

This version is designed as a case study project to demonstrate:

- **Data ingestion and parsing** – Resume upload → auto-fill profile
- **Workflow automation** – Tracking applications, automated document generation
- **LLM-powered features** – Tailored résumés + cover letters

## 2. Key Features

### 🔹 Landing Page with Try-Out Mode

- Visitors can try the app without logging in
- **Try-Out Feature**: Paste a job posting → choose data source → generate a draft résumé + cover letter
- **Data Source Options**:
  - **Fill with own details**: User provides basic info (name, email, brief experience, skills)
  - **Use default/placeholder**: System uses demo data for quick preview
- **Job Match Insights**: AI analyzes job posting against user data and provides match score/recommendations
  - If mismatch detected → Warning: "Your profile may not be a strong match for this role"
  - Shows missing skills/requirements
- Encourages engagement before signup

### 🔹 Job Application Tracker

- **Full CRUD interface** with modals for:
  - Adding new applications
  - Editing existing applications
  - Confirmation dialogs for deletion
- **List View** (`/applications`): Display all job applications (table or card grid)
- **Detail View** (`/applications/[id]`):
  - Click list item → Quick preview modal with key details
  - "View Full Details" → Navigate to dedicated route `/applications/[id]`
  - Full detail page shows complete job posting, notes, timeline, status history
- **In-Context Document Generation**:
  - Primary CTA: Generate Resume/Cover Letter directly from `/applications/[id]`
  - Opens modal/drawer with generation options
  - Shows job match insights before generation
- **Fields**: company name, role, job posting link/description, status (applied/interviewing/offer/rejected), notes, date applied
- Stored in Supabase
- Demonstrates structured data management + workflow automation

### 🔹 Profile Page & Onboarding

**Multi-Stage Onboarding Flow:**

After signup, users go through streamlined onboarding:

1. **Stage 1: Resume Upload (Optional)**
   - "Skip the forms! Upload your resume and we'll auto-fill everything"
   - Upload PDF/Docx → AI parses and extracts:
     - Personal Info (name, email, phone, location)
     - Work Experience (company, role, dates, descriptions)
     - Education (degree, institution, dates)
     - Projects (name, description, tech stack)
     - Skills (technical + soft skills)
   - Stored temporarily for review

2. **Stage 2: Review & Verify**
   - System displays parsed data in organized sections
   - User reviews each section with inline editing
   - Add/remove/edit entries
   - Flag for "This looks correct" or "Let me edit this"

3. **Stage 3: Fill Missing Details (if manual entry)**
   - If no resume uploaded → Traditional form with sections:
     - Personal Info
     - Experience (dynamic add/remove)
     - Education
     - Projects
     - Skills (tag input)

4. **Stage 4: Completion**
   - Profile saved to Supabase
   - Redirect to Dashboard

**Post-Onboarding:**
- Profile page allows manual editing of all sections
- Re-upload resume anytime → Option to "Replace all" or "Merge with existing"
- Demonstrates data ingestion + parsing capabilities

**AI Skill Detection & Suggestion (Planned Feature):**
- When users add/edit Experience, Education, or Projects entries with rich data (technologies, coursework, etc.)
- AI system automatically detects skills/technologies mentioned in array fields
- Compares against existing skills in Skills tab
- If new technologies/skills are detected:
  - Show toast notification: "We detected [React, TypeScript, AWS] in your recent entry. Would you like to add these to your Skills?"
  - User can click to review and selectively add
  - Prevents duplicate skills across entries
  - Ensures Skills tab stays comprehensive and up-to-date
- **Implementation**: Client-side check after save → Compare arrays against skills table → Prompt user with confirmation modal

### 🔹 Résumé & Cover Letter Generator

**Two Access Points:**

1. **Primary: In-context generation** (from `/applications/[id]`)
   - Generate Resume/Cover Letter for specific job application
   - Pre-filled with job posting details

2. **Secondary: Standalone generator page** (`/generate`)
   - Select from list of saved job applications
   - Useful for landing page "Try-Out Mode"
   - Batch operations and comparison

**RAG Workflow:**
- Implements a **Retrieval-Augmented Generation (RAG)** workflow:
  1. Retrieve structured user data from Supabase
  2. Combine with job posting text
  3. **Job Match Analysis** (pre-generation):
     - AI analyzes profile vs. job requirements
     - Match score + missing skills/qualifications
     - Warning if low match → user can still proceed or cancel
  4. Send to LLM (via n8n workflow)
  5. Generate tailored résumé (LaTeX → PDF) and matching cover letter
- Output stored in Supabase Storage with a download link

## 3. Design System & Theming

### Color Palette

**Enhanced Multi-Color System** (not just blue!)

**Brand Colors:**
- **Primary**: Blue (#4F8EF7) - Professional, trustworthy
- **Secondary**: Indigo/Purple (#6366F1) - Elegant, sophisticated
- **Accent**: Teal/Cyan (#06B6D4) - Vibrant, energetic

**Semantic Colors:**
- **Success**: Green (#10B981) - Positive actions, offers
- **Warning**: Amber (#F59E0B) - Attention needed, interviewing
- **Destructive**: Red (#EF4444) - Errors, rejections
- **Info**: Sky Blue (#0EA5E9) - Informational messages

**Status Colors** (Job Applications):
- **Saved**: Gray - Not yet applied
- **Applied**: Blue - Application submitted
- **Interviewing**: Amber - In progress
- **Offer**: Green - Offer received
- **Rejected**: Red - Not selected
- **Accepted**: Purple - Accepted offer

**Match Score Colors:**
- **High (80-100%)**: Green
- **Medium (50-79%)**: Yellow/Amber
- **Low (0-49%)**: Red

---

### Dark Mode Support

Full light and dark mode implementations:
- All colors adjusted for optimal contrast
- Sidebar adapts to dark theme
- Cards and backgrounds properly elevated
- Text hierarchy maintained

**Toggle Implementation:**
```typescript
// Uses next-themes package
import { useTheme } from 'next-themes'
const { theme, setTheme } = useTheme()
```

---

### Typography

**Font Stack:**
- **Sans-serif**: Geist Sans (Next.js default, clean and modern)
- **Monospace**: Geist Mono (for code/data display if needed)

**Hierarchy:**
```
h1: text-4xl (36px) / lg:text-5xl (48px)
h2: text-3xl (30px)
h3: text-2xl (24px)
h4: text-xl (20px)
h5: text-lg (18px)
h6: text-base (16px)
body: text-base (16px)
```

---

### Spacing & Layout

**Border Radius:**
```css
--radius: 0.5rem (8px) - Default
--radius-sm: 4px - Tight corners
--radius-md: 6px - Medium
--radius-lg: 8px - Standard
--radius-xl: 12px - Soft corners
```

**Shadows (Elevation):**
```css
--elevation-1: Subtle shadow for cards
--elevation-2: Medium shadow for dropdowns
--elevation-3: Strong shadow for modals
--elevation-4: Maximum elevation for toasts
```

---

### Component Patterns

**Status Badges:**
```tsx
<Badge className="status-applied">Applied</Badge>
<Badge className="status-interviewing">Interviewing</Badge>
<Badge className="status-offer">Offer</Badge>
```

**Match Score Indicator:**
```tsx
<div className={cn(
  "font-semibold",
  score >= 80 ? "match-high" :
  score >= 50 ? "match-medium" : "match-low"
)}>
  {score}% Match
</div>
```

**Gradient Text (for headings):**
```tsx
<h1 className="gradient-text">
  AI-Powered Résumés
</h1>
```

---

### Loading States

**Skeleton Components:**
- Use shadcn `<Skeleton />` for loading states
- Apply to cards, tables, forms while data loads
- Maintains layout consistency

**Example:**
```tsx
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Card>{content}</Card>
)}
```

---

### Toast Notifications

**Implementation:** `sonner` package (shadcn default)

**Usage:**
```tsx
import { toast } from 'sonner'

toast.success("Resume generated successfully!")
toast.error("Failed to upload file")
toast.info("Job match score: 85%")
toast.warning("Profile incomplete")
```

**Positioning:** Bottom-right
**Duration:** 4 seconds (configurable)
**Actions:** Dismissible, actionable (undo, etc.)

---

### Sidebar Navigation (Collapsible)

**Layout:**
- Fixed left sidebar on desktop
- Collapsible to icon-only mode
- Hidden on mobile (hamburger menu)
- Smooth transitions

**Navigation Items:**
- Dashboard
- Applications
- Generate (documents)
- Profile
- Settings (optional)

**State:** Persisted in localStorage

---

### Responsive Breakpoints

```css
sm: 640px   - Mobile landscape
md: 768px   - Tablet
lg: 1024px  - Desktop
xl: 1280px  - Large desktop
2xl: 1536px - Extra large
```

**Mobile-First Approach:**
- Default styles for mobile
- Progressively enhance for larger screens
- Sidebar → Top nav on mobile
- Card grids → Single column on mobile

---

## 4. Tech Stack

### Frontend / Fullstack

- **Next.js 15** – App Router, API Routes
- **Tailwind CSS v4** – Styling with CSS-based configuration
- **shadcn/ui** – Component library (Enhanced with custom theme)
- **Lucide React** – Icon library
- **ReactBits** – Additional UI components and utilities
- **next-themes** – Dark mode toggle
- **sonner** – Toast notifications
- **Framer Motion** – Animations (optional)

### Backend / Database

- **Supabase** – Postgres DB, Auth (JWT-based with email verification), Storage, Row Level Security (RLS)
- **@supabase/ssr** – Supabase client for Next.js Server Components + API Routes

### Automation & AI

- **n8n** – Workflow orchestration
- **OpenAI** (via n8n) – Résumé + cover letter generation
- **RAG pipeline** – Profile data + job posting → AI-generated docs

### Document Generation

- **LaTeX** – Résumé template → compiled to PDF
- Stored in Supabase Storage

## 4. Page Layouts & Navigation

### 🏠 Landing Page (`/`)

**Layout:**
- **Hero Section**
  - Headline: "Get hired faster with AI-powered résumés"
  - Subheadline: Value proposition
  - CTA: "Try it now - No signup required" → Scrolls to Try-Out section
  - CTA: "Sign Up" → `/auth/signup`

- **Try-Out Mode Section**
  - Two-column layout:
    - **Left**: Job posting input (textarea)
    - **Right**: Data source selector
      - Radio buttons: "Use my info" / "Use demo data"
      - If "Use my info" → Collapsible form (name, email, experience, skills)
  - "Generate Sample Documents" button
  - Results display area (match insights + download links)

- **Features Overview** (3-column grid)
  - Track Applications
  - AI-Powered Generation
  - Smart Job Matching

- **Footer**
  - Links, social, built by credit

---

### 🔐 Login/Signup Pages (`/auth/login`, `/auth/signup`)

**Layout:**
- Centered card (max-width 400px)
- Logo + heading
- **Auth Options:**
  - OAuth providers (Google, GitHub) with provider buttons
  - OR divider
  - Email/Password form (shadcn Form components)
- Toggle link: "Don't have an account? Sign up"
- Background: Subtle gradient or pattern

**Post-Signup Flow:**
- Redirect to `/onboarding` (multi-stage flow)

---

### 🎯 Main Dashboard (`/dashboard`)

**Layout:**
- **Sidebar Navigation** (left, fixed)
  - Logo
  - Nav items: Dashboard, Applications, Generate, Profile
  - User menu (bottom): Settings, Logout

- **Main Content Area**
  - **Top Bar**: Page title, search (optional), user avatar

  - **Dashboard Widgets** (grid layout):
    - **Stats Cards** (4-column grid)
      - Total Applications
      - Active Applications
      - Documents Generated
      - Match Score Average

    - **Recent Applications** (table/list)
      - Company, Role, Status, Date Applied
      - Quick actions: View, Generate Docs

    - **Quick Actions** (buttons)
      - Add New Application
      - Generate Documents
      - Upload Resume

---

### 📋 Job Applications Page (`/applications`)

**Layout:**
- **Top Bar**
  - Page title: "Job Applications"
  - Filters: Status dropdown, date range, search
  - "Add Application" button (opens modal)

- **Main Content**
  - **List/Table View** (cards or table, user preference toggle?)
    - Each item shows: Company logo, Role, Company, Status badge, Date, Match Score
    - Click → Opens quick preview modal
    - Actions dropdown: View Full, Edit, Delete, Generate Docs

- **Modals:**
  - **Add/Edit Modal**: Form with fields (company, role, job posting URL, description, status, notes, date)
  - **Delete Confirmation Modal**: "Are you sure? This action cannot be undone"
  - **Quick Preview Modal**: Summary + "View Full Details" button → Navigate to `/applications/[id]`

---

### 📄 Application Detail Page (`/applications/[id]`)

**Layout:**
- **Breadcrumbs**: Applications > [Company Name]

- **Header Section**
  - Company name + logo
  - Role title
  - Status badge
  - Action buttons: Edit, Delete, Back to List

- **Content Sections** (tabs or accordion)
  - **Overview Tab**
    - Job posting text (formatted)
    - Job posting URL (link)
    - Date applied
    - Notes

  - **Match Analysis Tab**
    - Match score (circular progress)
    - Missing skills/requirements
    - Recommendations
    - "Re-analyze" button

  - **Documents Tab**
    - List of generated documents (resume, cover letter)
    - Download buttons
    - "Generate New Resume" / "Generate Cover Letter" buttons (opens generation modal)

- **Generation Modal** (opened from Documents tab)
  - Preview: Profile data + Job posting data
  - Options: Resume style, include cover letter checkbox
  - "Generate" button → Shows loading → Display download link

---

### ⚡ Generation Page (`/generate`)

**Layout:**
- **Top Section**
  - Heading: "Generate Documents"
  - Description: "Select a job application to generate tailored documents"

- **Main Content** (two-column layout)
  - **Left Column (40%)**
    - Dropdown/Select: "Choose Job Application"
    - Selected application preview card:
      - Company, Role
      - Job posting snippet
      - Match score

  - **Right Column (60%)**
    - Profile data preview (collapsible sections):
      - Experience
      - Education
      - Skills
      - Projects
    - Generation options:
      - Document type: Resume / Cover Letter / Both
      - Resume style/template selector
    - "Generate Documents" button

- **Results Section** (appears after generation)
  - Success message
  - Download buttons
  - "Generate Another" button

---

### 👤 Profile Page (`/profile`)

**Layout:**
- **Tab Navigation** (horizontal tabs)
  - Personal Info
  - Experience
  - Education
  - Projects
  - Skills

- **Each Tab Content:**
  - Section heading + "Edit" button (inline editing mode)
  - Display data in cards/list
  - **Experience/Education/Projects**: List with Add/Remove/Edit per item
  - **Skills**: Tag input with add/remove

- **Top Section** (above tabs)
  - Profile picture upload
  - Name + email (editable)
  - "Re-upload Resume" button
    - Opens modal: Upload → Choose "Replace All" or "Merge with Existing"

- **Bottom Section**
  - "Save Changes" button (sticky/fixed)
  - "Discard Changes" button

---

### Common Layout Elements

**All Authenticated Pages Share:**
- Sidebar navigation (Dashboard, Applications, Generate, Profile)
- Top bar with user menu
- Consistent spacing, typography, color scheme (shadcn Neutral theme)
- Loading states (skeletons)
- Toast notifications (success/error messages)
- Modals for forms and confirmations

---

## 5. Authentication & Security

### Authentication Strategy: Supabase Auth

**Technology:**
- **Supabase Auth** - JWT-based authentication with built-in email verification
- **@supabase/ssr** - Server-side auth for Next.js (App Router compatible)

**Supported Sign-in Methods:**
1. **Email/Password** (with email verification required)
2. **OAuth Providers:**
   - Google
   - GitHub
   - (Other providers can be added via Supabase dashboard)

---

### Email/Password Flow

**Signup:**
1. User submits email + password on `/auth/signup`
2. Next.js calls Supabase Auth API: `supabase.auth.signUp()`
3. Supabase creates user in `auth.users` table
4. **Email verification sent** automatically
5. User sees: "Check your email to verify your account"
6. User clicks verification link → Redirected to app
7. Email verified → Can now log in

**Login:**
1. User submits email + password on `/auth/login`
2. Next.js calls: `supabase.auth.signInWithPassword()`
3. If email not verified → Error: "Please verify your email first"
4. If verified → Supabase returns JWT (access token + refresh token)
5. Tokens stored in **httpOnly cookies** (secure, not accessible via JS)
6. Redirect to `/onboarding` (first time) or `/dashboard` (returning user)

**Email Verification Settings:**
- Enabled by default in Supabase
- Customizable email templates (branding, copy)
- Verification link expires in 24 hours (configurable)

---

### OAuth Flow (Google/GitHub)

**Sign in with OAuth:**
1. User clicks "Continue with Google" on `/auth/login`
2. Next.js calls: `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. Redirects to Google OAuth consent screen
4. User authorizes → Google redirects back to callback URL (`/auth/callback`)
5. Supabase automatically:
   - Creates user account (if new)
   - **Email already verified** (trusted provider)
   - Issues JWT tokens
6. Redirect to `/onboarding` or `/dashboard`

**Configuration:**
- OAuth providers configured in Supabase dashboard
- Need to set up OAuth apps in Google/GitHub developer consoles
- Callback URL: `https://your-project.supabase.co/auth/v1/callback`

---

### JWT Token Management

**How JWTs Work:**
- **Access Token**: Short-lived (1 hour), used for API requests
- **Refresh Token**: Long-lived (30 days), used to get new access tokens
- Both stored in **httpOnly cookies** by `@supabase/ssr`

**Token Validation:**
- Every API route/Server Component checks: `await supabase.auth.getUser()`
- Supabase validates JWT signature automatically
- If expired → Uses refresh token to get new access token
- If refresh token expired → User must log in again

**Token Contents (JWT payload):**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1234567890
}
```

---

### Row Level Security (RLS)

**Database-Level Authorization:**
- Supabase uses JWT to enforce RLS policies
- Each table has policies like:
  ```sql
  -- Users can only read their own profile
  CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

  -- Users can only insert their own data
  CREATE POLICY "Users can insert own data"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  ```

**Benefits:**
- Even if your API has a bug, users can't access each other's data
- No need to manually check user permissions in every API route
- Security at the database level

---

### Session Management

**Client-Side (Browser):**
- `@supabase/ssr` automatically handles session refresh
- Checks session on every page load
- Refreshes access token when expired

**Server-Side (API Routes/Server Components):**
- Create Supabase client with request cookies
- Client automatically validates session
- If invalid → Returns null user

**Logout:**
- Call `supabase.auth.signOut()`
- Clears cookies
- Redirect to `/auth/login`

---

### Protected Routes

**Implementation:**
```typescript
// middleware.ts (Next.js)
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  // Protect authenticated routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect('/auth/login')
  }

  // Redirect authenticated users away from auth pages
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect('/dashboard')
  }
}
```

**Protected Routes:**
- `/dashboard`, `/applications`, `/generate`, `/profile`, `/onboarding`
- Redirect to `/auth/login` if not authenticated

**Public Routes:**
- `/`, `/auth/login`, `/auth/signup`

---

### Password Reset Flow

1. User clicks "Forgot Password" on login page
2. Enters email → Supabase sends reset link
3. User clicks link → Redirected to `/auth/reset-password`
4. User enters new password
5. Password updated → Redirect to `/auth/login`

---

### Email Customization

**Supabase Email Templates:**
- Confirmation email (signup)
- Magic link email (passwordless login, optional)
- Password reset email
- Email change confirmation

**Customizable via Supabase Dashboard (Authentication > Email Templates):**
- Full HTML templates with variables: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`
- Sender name and email (default uses Supabase, can use custom domain)
- Subject lines
- Branding (logo, colors, styling)

**⚠️ Polish TODO:**
- Default emails are very basic and unprofessional
- **Must customize** before launch with:
  - GetMeHired branding (logo, colors)
  - Professional HTML/CSS styling
  - Clear call-to-action buttons
  - Helpful copy explaining what the email is for
  - Footer with unsubscribe/contact info
- Consider using email template builder or copying from professional email templates (e.g., Really Good Emails)

---

## 6. Architecture

```
Frontend (Next.js)
   |
   v
API Routes (Next.js)
   |
   v
Supabase (DB/Auth/Storage)
   |
   v
n8n Workflows
   | - Parse resumes
   | - Generate AI content
   | - Format LaTeX PDFs
   v
LLM (OpenAI API)
```

## 7. Database Schema (Supabase)

### Core Tables

#### `profiles`
**Purpose:** Store user personal information (not skills - those are separate)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  location text,
  bio text,
  profile_picture_url text,
  contact_links jsonb, -- { "linkedin": "url", "github": "url", "portfolio": "url" }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

#### `experience_entries`
**Purpose:** Store work experience history

```sql
CREATE TABLE experience_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  start_date date NOT NULL,
  end_date date, -- NULL if current position
  description text,
  location text,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_experience_user_id ON experience_entries(user_id);
CREATE INDEX idx_experience_dates ON experience_entries(start_date DESC, end_date DESC);
```

---

#### `education_entries`
**Purpose:** Store education history

```sql
CREATE TABLE education_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_date date NOT NULL,
  end_date date, -- NULL if currently enrolled
  description text,
  gpa text,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_education_user_id ON education_entries(user_id);
CREATE INDEX idx_education_dates ON education_entries(start_date DESC, end_date DESC);
```

---

#### `projects`
**Purpose:** Store personal/professional projects with rich structured data

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  project_url text, -- GitHub, demo link, etc.
  technologies text[], -- Tech stack used (matches job technical_requirements)
  key_features text[], -- Main features/capabilities built
  achievements text[], -- Measurable outcomes (users, performance metrics, etc.)
  role_responsibilities text[], -- Your specific role/contributions (if team project)
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

**Rich Data Fields Rationale:**
- **technologies[]**: Enables AI to match project tech stack with job requirements
- **key_features[]**: Demonstrates scope and complexity of work
- **achievements[]**: Shows measurable impact (e.g., "Increased performance by 40%", "Served 10k users")
- **role_responsibilities[]**: Clarifies your contribution in team projects vs solo work

---

#### `skills`
**Purpose:** Master skills table (separate from profiles)

```sql
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text, -- 'technical', 'soft_skill', 'language', 'tool', etc.
  proficiency_level text, -- 'beginner', 'intermediate', 'advanced', 'expert' (optional)
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name) -- No duplicate skills per user
);

CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_skills_category ON skills(category);
```

---

### Junction Tables (Many-to-Many Relationships)

#### `experience_skills`
**Purpose:** Link skills to specific work experiences

```sql
CREATE TABLE experience_skills (
  experience_id uuid REFERENCES experience_entries(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (experience_id, skill_id)
);

CREATE INDEX idx_exp_skills_exp ON experience_skills(experience_id);
CREATE INDEX idx_exp_skills_skill ON experience_skills(skill_id);
```

---

#### `project_skills`
**Purpose:** Link skills to specific projects

```sql
CREATE TABLE project_skills (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, skill_id)
);

CREATE INDEX idx_proj_skills_proj ON project_skills(project_id);
CREATE INDEX idx_proj_skills_skill ON project_skills(skill_id);
```

---

#### `education_skills` (Optional)
**Purpose:** Link skills learned in education (e.g., coursework)

```sql
CREATE TABLE education_skills (
  education_id uuid REFERENCES education_entries(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (education_id, skill_id)
);

CREATE INDEX idx_edu_skills_edu ON education_skills(education_id);
CREATE INDEX idx_edu_skills_skill ON education_skills(skill_id);
```

---

### Application & Document Tables

#### `job_applications`
**Purpose:** Track job applications with match analysis

```sql
CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company text NOT NULL,
  role text NOT NULL,
  job_posting_url text,
  job_posting_text text NOT NULL,
  status text NOT NULL DEFAULT 'applied',
    -- Options: 'saved', 'applied', 'interviewing', 'offer', 'rejected', 'accepted'
  notes text,
  date_applied date,
  match_score integer CHECK (match_score >= 0 AND match_score <= 100),
  match_insights jsonb, -- { "missing_skills": [], "matching_skills": [], "recommendations": [] }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_job_apps_user_id ON job_applications(user_id);
CREATE INDEX idx_job_apps_status ON job_applications(status);
CREATE INDEX idx_job_apps_date ON job_applications(date_applied DESC);
CREATE INDEX idx_job_apps_match_score ON job_applications(match_score DESC);
```

---

#### `generated_documents`
**Purpose:** Track generated resumes and cover letters

```sql
CREATE TABLE generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_application_id uuid REFERENCES job_applications(id) ON DELETE SET NULL,
    -- NULL if generated without specific job application (e.g., Try-Out Mode)
  document_type text NOT NULL, -- 'resume' or 'cover_letter'
  file_url text NOT NULL, -- Supabase Storage path
  file_name text NOT NULL,
  template_used text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_gen_docs_user_id ON generated_documents(user_id);
CREATE INDEX idx_gen_docs_job_app ON generated_documents(job_application_id);
CREATE INDEX idx_gen_docs_type ON generated_documents(document_type);
CREATE INDEX idx_gen_docs_created ON generated_documents(created_at DESC);
```

---

### Design Decisions & Rationale

**1. `user_id` references `auth.users(id)`**
- Standard Supabase pattern
- Enables RLS with `auth.uid()`
- `ON DELETE CASCADE` ensures data cleanup

**2. Junction tables for skills**
- Enables querying: "Which experiences used React?"
- AI can match job requirements to specific experiences/projects
- No data duplication
- Flexible for resume generation (include only relevant skills per job)

**3. Separate skills table**
- Profiles contain only personal data
- Skills tracked independently with relationships
- Can categorize skills (technical vs soft)
- Optional proficiency levels

**4. Simple document tracking (MVP)**
- Basic fields for now
- Can add `generation_status`, `error_message`, etc. later if needed

**5. Indexes on frequently queried columns**
- `user_id` on all tables (most common filter)
- Dates in DESC order (recent first)
- Status, match_score for filtering/sorting

**6. `jsonb` for flexible data**
- `contact_links` in profiles
- `match_insights` in job_applications
- Easy to query with Postgres jsonb operators

---

### Row Level Security (RLS) Policies

**Enable RLS on all tables:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
```

**Standard policies for all user-owned tables:**

```sql
-- Example for profiles (apply similar pattern to all tables)

-- SELECT: Users can view their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own data
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own data
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own data
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);
```

**Junction table policies (slightly different):**

```sql
-- Example for experience_skills
CREATE POLICY "Users can view own experience skills"
  ON experience_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experience_entries
      WHERE experience_entries.id = experience_skills.experience_id
      AND experience_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own experience skills"
  ON experience_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM experience_entries
      WHERE experience_entries.id = experience_skills.experience_id
      AND experience_entries.user_id = auth.uid()
    )
  );
```

**Why RLS is critical:**
- Even if your API has a bug, users can't access other users' data
- Database enforces security automatically
- No manual permission checks needed in application code

---

### Database Functions & Triggers

**Auto-update `updated_at` timestamp:**

```sql
-- Create function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_updated_at
  BEFORE UPDATE ON experience_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON education_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_apps_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Auto-create profile on user signup:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Benefits:**
- Profile automatically created when user signs up
- No need to manually create profile in application code
- Works for both email/password and OAuth signups

---

### Supabase Storage Buckets

**Three storage buckets needed:**

#### 1. `resumes` bucket
**Purpose:** Store uploaded resume files (PDF/Docx) for parsing

```sql
-- Create bucket (via Supabase dashboard or SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false);

-- RLS policies for resumes bucket
CREATE POLICY "Users can upload own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**File structure:** `resumes/{user_id}/original_resume.pdf`

---

#### 2. `generated-documents` bucket
**Purpose:** Store AI-generated resumes and cover letters

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-documents', 'generated-documents', false);

-- Same RLS policies as resumes bucket
```

**File structure:** `generated-documents/{user_id}/{job_app_id}_resume.pdf`

---

#### 3. `profile-pictures` bucket
**Purpose:** Store user profile pictures

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true); -- Public for display

CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own profile picture"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile picture"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**File structure:** `profile-pictures/{user_id}/avatar.jpg`

---

### Future Enhancement: `/documents` Page (Phase 2)

**Route:** `/documents`

**Purpose:** Central view of all generated documents across all job applications

**Layout:**
- Data table with columns:
  - Document Type (Resume/Cover Letter)
  - Job Application (Company - Role)
  - Created Date
  - Actions (Download, Delete)
- Filters:
  - Document Type
  - Date Range
  - Job Application (searchable dropdown)
- Sort by: Date (newest first), Document Type

**Why Phase 2:**
- MVP users can access documents from `/applications/[id]` Documents tab
- Central view is nice-to-have, not critical for core workflow
- Can be added quickly later (simple query + table UI)

---

## 8. AI Integration via Supabase Edge Functions

### Overview

**Supabase Edge Functions** serve as the serverless compute layer for all AI-powered features:
- Resume parsing (PDF/Docx → structured JSON)
- Job matching analysis (profile + job posting → match score + insights)
- Document generation (profile + job posting → LaTeX → PDF)
- Document preview (generate preview without saving to database)

**Architecture:**
```
Next.js App → Next.js API Route → Supabase Edge Function → OpenAI API → LaTeX Compiler → Response
                                          ↓
                                   Supabase Database
                                          ↓
                                   Supabase Storage
```

**Why Edge Functions instead of n8n?**
- ✅ **Cost-effective:** No monthly subscription, pay-per-use OpenAI calls only
- ✅ **Performance:** Direct API calls, no webhook latency
- ✅ **Control:** Full TypeScript code, easier debugging and customization
- ✅ **Deployment:** Built-in with Supabase, no separate infrastructure
- ✅ **Portfolio Value:** Demonstrates custom system design vs. no-code tools
- ✅ **Scalability:** Auto-scaling serverless functions

---

### Edge Function 1: `parse-resume`

**Purpose:** Extract structured data from uploaded resume (PDF/Docx)

**Endpoint:** `POST /functions/v1/parse-resume`

**Input (JSON):**
```typescript
{
  file_url: string;  // Supabase Storage URL
  user_id: string;
}
```

**Function Logic:**

1. **Fetch file from Supabase Storage**
   - Use Supabase client to download file from Storage bucket
   - Handle authentication with service role key

2. **Extract text from PDF**
   - Use `pdf-parse` library (Deno-compatible)
   - Extract raw text from PDF buffer
   - For Docx: Use text extraction library

3. **Call OpenAI API to parse structured data**
   - **Model:** `gpt-4o`
   - **System Prompt:**
     ```
     You are a resume parser. Extract structured information from the resume text.
     Return ONLY valid JSON with this exact structure:
     {
       "personal_info": {
         "name": "string",
         "email": "string",
         "phone": "string",
         "location": "string",
         "linkedin": "string",
         "github": "string",
         "portfolio": "string"
       },
       "experience": [
         {
           "company": "string",
           "role": "string",
           "location": "string",
           "start_date": "YYYY-MM",
           "end_date": "YYYY-MM or null if current",
           "description": "string",
           "responsibilities": ["item1", "item2"],
           "achievements": ["achievement1"],
           "technologies": ["tech1", "tech2"]
         }
       ],
       "education": [
         {
           "institution": "string",
           "degree": "string",
           "field_of_study": "string",
           "location": "string",
           "start_date": "YYYY-MM",
           "end_date": "YYYY-MM or null if current",
           "gpa": "string",
           "relevant_coursework": ["course1"],
           "achievements": ["achievement1"],
           "activities": ["activity1"]
         }
       ],
       "projects": [
         {
           "name": "string",
           "description": "string",
           "project_url": "string",
           "technologies": ["tech1", "tech2"],
           "key_features": ["feature1"],
           "achievements": ["achievement1"],
           "role_responsibilities": ["role1"]
         }
       ],
       "skills": [
         {
           "name": "string",
           "category": "technical|soft_skill|language|tool",
           "proficiency_level": "beginner|intermediate|advanced|expert"
         }
       ]
     }
     ```
   - **User Prompt:** `Parse this resume:\n\n${resume_text}`

4. **Validate and clean response**
   - Ensure all required fields are present
   - Format dates consistently (YYYY-MM-DD)
   - Handle parsing errors gracefully

**Output (JSON):**
```typescript
{
  success: boolean;
  data?: {
    personal_info: {...},
    experience: [...],
    education: [...],
    projects: [...],
    skills: [...]
  };
  error?: string;
}
```

**Error Handling:**
- Retry OpenAI calls up to 2 times with exponential backoff
- Log errors to Edge Function logs
- Return user-friendly error messages

**Next.js API Route Wrapper:**
```typescript
// app/api/parse-resume/route.ts
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { file_url } = await request.json();

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('parse-resume', {
    body: { file_url, user_id: user.id }
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
```

---

### Edge Function 2: `analyze-job-match`

**Purpose:** Analyze how well user's profile matches job requirements

**Endpoint:** `POST /functions/v1/analyze-job-match`

**Input (JSON):**
```typescript
{
  user_id: string;
  job_application_id: string;
}
```

**Function Logic:**

1. **Fetch user profile data from Supabase**
   - Query all profile tables: `personal_info`, `work_experience`, `education`, `projects`, `skills`
   - Combine into structured profile object
   - Include rich array data (skills, achievements, responsibilities, key_features, etc.)

2. **Fetch job application data**
   - Query `job_applications` table for job posting details
   - Extract: company, role, location, work_mode, industry, job_description, job_requirements, job_responsibilities
   - Validate minimum required data (job_description or job_requirements must be present)

3. **Format data for OpenAI prompt**
   - Convert profile arrays into readable format with bullet points
   - Structure job requirements clearly with labeled sections
   - Prepare comprehensive context including all available profile data

4. **Call OpenAI API to analyze match**
   - **Model:** `gpt-4o`
   - **System Prompt:**
     ```
     You are a job matching expert and career advisor. Analyze how well the candidate's profile matches the job requirements.

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
     }
     ```
   - **User Prompt:**
     ```
     Candidate Profile:
     Name: ${name}

     Experience:
     ${formatted_experience}

     Education:
     ${formatted_education}

     Projects:
     ${formatted_projects}

     Skills:
     ${formatted_skills}

     Job Posting:
     Company: ${company}
     Role: ${role}
     Description: ${job_description}
     Required Skills: ${required_skills}
     Preferred Skills: ${preferred_skills}
     Responsibilities: ${responsibilities}
     Qualifications: ${qualifications}

     Analyze the match thoroughly.
     ```

5. **Validate response and update database**
   - Ensure match_score is 0-100
   - Validate JSON structure
   - Update `job_applications` table with `match_score` only
   - Return full insights in API response (not stored in database)

**Output (JSON):**
```typescript
{
  success: boolean;
  data?: {
    match_score: number;
    matching_skills: string[];
    missing_skills: string[];
    strong_points: string[];
    weak_points: string[];
    recommendations: string[];
    should_apply: boolean;
    reasoning: string;
  };
  error?: string;
}
```

**Error Handling:**
- Returns 400 error if job description and requirements are both missing
- Validates match_score is between 0-100 (clamps if necessary)
- Logs errors for debugging
- Returns user-friendly error messages
- Gracefully handles missing optional profile fields

**Implementation Details:**
- **Manual Trigger:** Match analysis runs on-demand when user clicks "Re-calculate" button
- **UI Integration:** Match score displayed as color-coded badge in application cards
  - 🟢 Green (80-100%): Strong match
  - 🟡 Yellow (50-79%): Medium match
  - 🔴 Red (0-49%): Low match
- **Match Insights Storage:** Smart hybrid caching approach
  - Only `match_score` (integer) stored in database
  - Full insights cached in `sessionStorage` with key pattern `match_insights_${applicationId}`
  - Insights generated on-demand to prevent stale data
  - sessionStorage cleared on logout/profile updates
  - Staleness indicators show age of insights (green < 24h, yellow 1-7d, red > 7d)
- **Re-analysis:** Users can trigger re-analysis from:
  - Application list page (re-calculate button next to match score)
  - Application detail page (View Insights modal with re-analyze button)

**Next.js API Route Wrapper:**
```typescript
// app/api/analyze-match/route.ts
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { job_application_id } = await request.json();

  // Verify job application belongs to user
  const { data: jobApp } = await supabase
    .from("job_applications")
    .select("id, user_id")
    .eq("id", job_application_id)
    .single();

  if (jobApp.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('analyze-job-match', {
    body: { user_id: user.id, job_application_id }
  });

  if (error || !data.success) {
    return NextResponse.json({ error: error?.message || data.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data.data });
}
```

**User Flow:**
1. User adds/edits job application with job description
2. On save → API automatically calls `/api/analyze-match`
3. Edge Function analyzes match → Updates database
4. UI displays match score badge immediately
5. User can view detailed insights in Match Analysis tab
6. User can click "Re-analyze" to update score after profile changes

---

### Edge Function 3: `generate-resume`

**Purpose:** Generate tailored resume PDF from profile + job posting

**Endpoint:** `POST /functions/v1/generate-resume`

**Input (JSON):**
```typescript
{
  user_id: string;
  job_application_id: string;
  preview?: boolean;  // If true, return content without saving to database/storage
}
```

**Function Logic:**

1. **Fetch user profile data from Supabase**
   - Query all profile tables with rich data
   - Personal info (name, email, phone, location, links)
   - Work experience (with responsibilities[], achievements[], technologies[])
   - Education (with relevant_coursework[], achievements[], activities[])
   - Projects (with technologies[], key_features[], achievements[], role_responsibilities[])
   - Skills (categorized)

2. **Fetch job application data**
   - Job posting details (company, role, description, requirements)

3. **Call OpenAI API to generate tailored content**
   - **Model:** `gpt-4o`
   - **System Prompt:**
     ```
     You are an expert resume writer and ATS optimization specialist.

     Your task: Generate tailored resume CONTENT (not the full LaTeX file) that highlights the candidate's most relevant experiences and skills for this specific job.

     IMPORTANT: Return ONLY structured JSON content that will be injected into a LaTeX template.

     Guidelines:
     - Tailor the professional summary to the job role
     - Prioritize and reorder experiences based on relevance to the job
     - Rewrite experience bullets to emphasize achievements matching job requirements
     - Highlight technical skills and technologies mentioned in the job posting
     - Include only the most relevant projects (2-3 max)
     - Use action verbs and quantifiable achievements
     - Optimize for ATS (Applicant Tracking Systems)

     Return ONLY valid JSON with this structure:
     {
       "professional_summary": "2-3 sentence summary tailored to the role",
       "experience": [
         {
           "company": "Company Name",
           "role": "Job Title",
           "location": "City, State",
           "dates": "Month YYYY - Month YYYY",
           "bullets": [
             "Tailored achievement with metrics",
             "Relevant responsibility emphasizing required skills"
           ]
         }
       ],
       "education": [
         {
           "institution": "University Name",
           "degree": "Degree Name",
           "field": "Field of Study",
           "location": "City, State",
           "dates": "Month YYYY - Month YYYY",
           "gpa": "3.8/4.0",
           "honors": ["Honor 1", "Honor 2"],
           "relevant_coursework": ["Course 1", "Course 2"]
         }
       ],
       "projects": [
         {
           "name": "Project Name",
           "technologies": ["Tech1", "Tech2"],
           "bullets": [
             "Key feature or achievement",
             "Impact or result"
           ]
         }
       ],
       "skills": {
         "technical": ["Skill1", "Skill2"],
         "tools": ["Tool1", "Tool2"],
         "languages": ["Language1"]
       }
     }
     ```
   - **User Prompt:**
     ```
     Candidate Profile:
     ${formatted_profile}

     Job Posting:
     Company: ${company}
     Role: ${role}
     Description: ${job_description}
     Required Skills: ${required_skills}
     Qualifications: ${qualifications}

     Generate tailored resume content optimized for this job.
     ```

4. **Load LaTeX template and inject content**
   - Use **Mustache.js** (Deno-compatible) for template injection
   - Load base LaTeX template (ATS-optimized resume template)
   - Inject AI-generated content + personal info from database
   - Handle arrays (loop through experiences, projects, skills)
   - Output: Complete LaTeX string

5. **Compile LaTeX to PDF**
   - POST LaTeX string to **LaTeX.Online API** (`https://latexonline.cc/compile`)
   - Receive PDF buffer in response
   - Handle compilation errors (invalid LaTeX syntax)

6. **If preview mode:**
   - Return PDF as base64 or direct buffer
   - Do NOT save to storage or database
   - Allow user to preview before saving

7. **If NOT preview mode (final generation):**
   - Upload PDF to Supabase Storage (`generated-documents` bucket)
   - Path: `${user_id}/${job_application_id}_resume_${timestamp}.pdf`
   - Insert record into `generated_documents` table
   - Return download URL

**Output (JSON):**
```typescript
{
  success: boolean;
  data?: {
    file_url?: string;        // Only if not preview
    file_name?: string;       // Only if not preview
    document_id?: string;     // Only if not preview
    pdf_base64?: string;      // Only if preview
    latex_content?: string;   // For debugging
  };
  error?: string;
}
```

**LaTeX Template Structure (Mustache):**
```latex
\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
% ... ATS-optimized preamble from user's resume ...

\begin{document}

% Personal Info (from database)
\begin{center}
  {\Huge \scshape {{name}}} \\ \vspace{1pt}
  {{phone}} $|$ {{email}} $|$ {{location}} \\
  {{#linkedin}}\href{ {{linkedin}} }{LinkedIn}{{/linkedin}} $|$
  {{#github}}\href{ {{github}} }{GitHub}{{/github}} $|$
  {{#portfolio}}\href{ {{portfolio}} }{Portfolio}{{/portfolio}}
\end{center}

% Professional Summary (from OpenAI)
\section{Professional Summary}
{{professional_summary}}

% Experience (from OpenAI - tailored)
\section{Experience}
{{#experience}}
  \textbf{ {{role}} } \hfill {{dates}} \\
  \textit{ {{company}} } \hfill {{location}}
  \begin{itemize}[leftmargin=0.15in, label={}]
    {{#bullets}}
    \item {{.}}
    {{/bullets}}
  \end{itemize}
{{/experience}}

% Projects (from OpenAI - most relevant)
\section{Projects}
{{#projects}}
  \textbf{ {{name}} } $|$ \textit{ {{#technologies}}{{.}}, {{/technologies}} } \\
  \begin{itemize}[leftmargin=0.15in, label={}]
    {{#bullets}}
    \item {{.}}
    {{/bullets}}
  \end{itemize}
{{/projects}}

% Education (from OpenAI)
\section{Education}
{{#education}}
  \textbf{ {{institution}} } \hfill {{dates}} \\
  {{degree}} in {{field}} {{#gpa}}-- GPA: {{gpa}}{{/gpa}} \hfill {{location}}
  {{#relevant_coursework}}
  \\ \textit{Relevant Coursework:} {{#relevant_coursework}}{{.}}, {{/relevant_coursework}}
  {{/relevant_coursework}}
{{/education}}

% Skills (from OpenAI - prioritized)
\section{Technical Skills}
\textbf{Technical:} {{#skills.technical}}{{.}}, {{/skills.technical}} \\
\textbf{Tools \& Frameworks:} {{#skills.tools}}{{.}}, {{/skills.tools}} \\
{{#skills.languages}}\textbf{Languages:} {{#skills.languages}}{{.}}, {{/skills.languages}}{{/skills.languages}}

\end{document}
```

**Error Handling:**
- Retry OpenAI calls up to 2 times
- If LaTeX compilation fails, return error with LaTeX source for debugging
- Handle missing profile data gracefully

**Next.js API Route Wrapper:**
```typescript
// app/api/generate-resume/route.ts
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { job_application_id, preview = false } = await request.json();

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('generate-resume', {
    body: { user_id: user.id, job_application_id, preview }
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
```

---

### Edge Function 4: `generate-cover-letter`

**Purpose:** Generate tailored cover letter PDF

**Endpoint:** `POST /functions/v1/generate-cover-letter`

**Input (JSON):**
```typescript
{
  user_id: string;
  job_application_id: string;
  preview?: boolean;  // If true, return content without saving
}
```

**Function Logic:**

1. **Fetch profile and job data** (same as resume generation)

2. **Call OpenAI API to generate cover letter**
   - **Model:** `gpt-4o`
   - **System Prompt:**
     ```
     You are an expert cover letter writer.

     Write a compelling, personalized cover letter that connects the candidate's experience to the job requirements.

     Format: 3-4 paragraphs
     1. Introduction - Express genuine interest, mention how you found the role or connection to company
     2. Body (1-2 paragraphs) - Highlight 2-3 specific relevant experiences/achievements with metrics
     3. Connection - Explain why you're uniquely suited for this role and company
     4. Closing - Strong call to action, express enthusiasm

     Tone: Professional but personable, enthusiastic but not desperate, confident but humble.
     Length: 300-400 words

     Return ONLY valid JSON:
     {
       "paragraphs": [
         "Introduction paragraph",
         "Body paragraph 1",
         "Body paragraph 2",
         "Closing paragraph"
       ],
       "salutation": "Dear Hiring Manager" or "Dear [Name]" if known
     }
     ```
   - **User Prompt:** Include full profile + job details

3. **Inject into LaTeX cover letter template**
   - Simple professional letter format
   - Include personal info, date, company address
   - Format paragraphs properly

4. **Compile LaTeX to PDF** (LaTeX.Online API)

5. **Preview or Save** (same logic as resume)

**Output:** Same structure as resume generation

**LaTeX Cover Letter Template (Mustache):**
```latex
\documentclass[11pt]{letter}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}

\signature{ {{name}} }
\address{
  {{name}} \\
  {{location}} \\
  {{phone}} \\
  {{email}}
}

\begin{document}

\begin{letter}{
  Hiring Manager \\
  {{company}} \\
  [Company Address if known]
}

\opening{ {{salutation}}, }

{{#paragraphs}}
{{.}}

{{/paragraphs}}

\closing{Sincerely,}

\end{letter}
\end{document}
```

**Next.js API Route Wrapper:**
```typescript
// app/api/generate-cover-letter/route.ts
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { job_application_id, preview = false } = await request.json();

  const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
    body: { user_id: user.id, job_application_id, preview }
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
```

---

### Environment Variables & Configuration

**Supabase Edge Functions (Secrets):**
```bash
# Set via CLI or Supabase dashboard
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set LATEX_ONLINE_URL=https://latexonline.cc/compile
```

**Edge Function Access:**
- Environment variables accessed via `Deno.env.get('OPENAI_API_KEY')`
- Supabase client uses built-in service role key

**Next.js Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For server-side operations
```

---

### Preview Functionality Flow

**User Experience:**

1. User clicks "Generate Resume" button
2. Modal opens with options:
   - **Preview** (shows generated PDF without saving)
   - **Generate & Save** (saves to database + storage)
3. If Preview:
   - Call API with `preview: true`
   - Show PDF in modal viewer (using pdf.js or embed)
   - User can review content
   - Option to "Save This Version" or "Cancel & Regenerate"
4. If Generate & Save (or after preview approval):
   - Call API with `preview: false`
   - Save to storage + database
   - Show download button + success message

**Implementation:**
```typescript
// In Next.js component
const handlePreview = async () => {
  const response = await fetch('/api/generate-resume', {
    method: 'POST',
    body: JSON.stringify({
      job_application_id,
      preview: true
    })
  });

  const { pdf_base64 } = await response.json();
  // Show PDF in modal
  setPdfPreview(`data:application/pdf;base64,${pdf_base64}`);
};

const handleSave = async () => {
  const response = await fetch('/api/generate-resume', {
    method: 'POST',
    body: JSON.stringify({
      job_application_id,
      preview: false
    })
  });

  const { file_url, document_id } = await response.json();
  toast.success('Resume generated successfully!');
  // Show download button
};
```

---

## 9. Workflow Examples

### Onboarding with Resume Ingestion

1. User signs up → Redirected to `/onboarding`
2. **Stage 1**: Option to upload resume (PDF/Docx) or skip to manual entry
3. If uploaded:
   - File uploaded to Supabase Storage (`resumes` bucket)
   - Next.js API route calls `parse-resume` Edge Function
   - Edge Function extracts text → OpenAI parses into structured JSON
   - Returns: `{personal_info: {}, experience: [], education: [], projects: [], skills: []}`
4. **Stage 2**: Display parsed data for review/verification
   - User can edit, add, remove entries inline
   - All changes staged in local state
5. **Stage 3**: Save to Supabase
   - Insert into `profiles`, `work_experience`, `education`, `projects`, `skills` tables
   - Atomic transaction ensures data integrity
6. Redirect to `/dashboard`

**Post-Onboarding Resume Upload:**
- From `/profile` → "Re-upload Resume" button
- Choose: "Replace All Data" or "Merge with Existing"
- Same parsing flow, with update logic instead of insert

---

### Job Match Analysis

1. User adds or edits job application (match score NOT calculated automatically)
2. User manually triggers analysis via "Re-calculate" button:
   - **Location 1:** Application list page (`/applications`) - button next to match score percentage
   - **Location 2:** Application detail page (`/applications/[id]`) - "View Insights" modal
3. Process:
   - Frontend calls `analyze-job-match` Edge Function directly via Supabase client
   - Edge Function fetches profile + job data from Supabase
   - OpenAI GPT-4o analyzes match based on skills, experience, qualifications
   - Returns match score (0-100) + full insights object
   - Updates `job_applications` table with `match_score` only (NOT insights)
   - Frontend caches full insights in `sessionStorage` for smart hybrid approach
4. Display insights to user:
   - Match percentage with color-coded badge (green 80-100%, yellow 50-79%, red 0-49%)
   - Progress bar with color-coded fill
   - "View Insights" button opens modal with:
     - Overall score with staleness indicator
     - 2-column grid: Matching skills (left) + Missing skills (right)
     - Strong points (left) + Weak points (right)
     - Recommendations in highlighted container at bottom
   - Re-analyze button to regenerate fresh insights

---

### Tailored Resume Generation with Preview

1. User navigates to `/applications/[id]` → Documents tab
2. Clicks "Generate Resume" button
3. **Generation Modal Opens** with two options:
   - **Preview First** (recommended)
   - **Generate & Save Directly**

**Preview Flow:**
4. User clicks "Preview"
5. Loading state: "Generating preview..."
6. Process:
   - API calls `generate-resume` Edge Function with `preview: true`
   - Edge Function:
     - Fetches profile + job data
     - Calls OpenAI for tailored content
     - Injects into LaTeX template
     - Compiles to PDF
     - Returns PDF as base64 string (NOT saved to storage/database)
7. **PDF Preview Modal** displays generated resume
   - PDF viewer component shows full document
   - User reviews content
   - Options:
     - **"Save This Version"** → Saves to storage + database
     - **"Regenerate"** → Calls OpenAI again for new version
     - **"Cancel"** → Closes modal

**Direct Generation Flow:**
4. User clicks "Generate & Save"
5. Loading state: "Generating resume..."
6. API calls `generate-resume` Edge Function with `preview: false`
7. Edge Function saves PDF to Storage and creates database record
8. Success: Download link + "View" button appears
9. Document listed in Documents tab

**Same Flow for Cover Letters**

---

### Try-Out Mode (Landing Page)

**Purpose:** Allow visitors to test AI generation without signup

1. User visits landing page (`/`)
2. **Try-Out Section:**
   - Paste job posting text
   - Choose data source:
     - **Use My Info:** Quick form (name, email, 2-3 key experiences, skills list)
     - **Use Demo Data:** Pre-filled placeholder profile
3. Click "Generate Sample Resume"
4. Process:
   - Lightweight API route (NO auth required)
   - Calls `analyze-job-match` and `generate-resume` with provided data
   - Returns PDF preview (NOT saved to database)
5. User can download sample PDF
6. CTA: "Sign up to save your profile and generate unlimited resumes"

---

## 10. Deployment

**Infrastructure:**
- **Frontend:** Vercel (Next.js hosting with automatic deployments)
- **Database:** Supabase Cloud (PostgreSQL with RLS)
- **Storage:** Supabase Storage (PDF files, uploaded resumes, profile pictures)
- **Serverless Functions:** Supabase Edge Functions (Deno runtime)
- **AI:** OpenAI API (GPT-4o)
- **LaTeX Compilation:** LaTeX.Online API (cloud service)

**CI/CD Pipeline:**
```
GitHub (feature branch)
  ↓
  Push to GitHub
  ↓
  Vercel auto-deploy (preview deployment)
  ↓
  Merge to main
  ↓
  Vercel production deployment
```

**Edge Functions Deployment:**
```bash
# Deploy all Edge Functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy parse-resume
supabase functions deploy analyze-job-match
supabase functions deploy generate-resume
supabase functions deploy generate-cover-letter
```

**Environment Variables:**
- Supabase secrets managed via CLI or dashboard
- Next.js env vars via Vercel dashboard
- OpenAI API key stored as Supabase secret

---

## 11. Case Study Scope

### Core Features
- ✅ **Landing Page with Try-Out Mode** - Allow visitors to test resume generation without signup
- ✅ **Authentication System** - Email/password + OAuth (Google, GitHub) with Supabase Auth
- ✅ **Onboarding Flow** - Multi-stage with optional resume upload + AI parsing
- ✅ **Profile Management** - Full CRUD with rich data structures (arrays for technologies, achievements, etc.)
- ✅ **Job Application Tracker** - Full CRUD interface with dedicated detail pages
- ✅ **AI Job Match Analysis** - Analyze profile vs. job requirements with scoring + insights
- ✅ **AI Resume Generation** - Tailored resumes using LaTeX templates + OpenAI content
- ✅ **AI Cover Letter Generation** - Personalized cover letters
- ✅ **Preview Functionality** - Review generated documents before saving
- ✅ **Document Management** - Store, view, download generated documents
- ✅ **Dashboard** - Stats overview + recent applications + quick actions
- ✅ **Clean UI/UX** - Tailwind CSS v4 + shadcn/ui + Lucide icons

### Technical Implementation
- ✅ **Next.js 15** App Router with Server Components + dynamic routes
- ✅ **Supabase** Auth, Database (PostgreSQL + RLS), Storage, Edge Functions
- ✅ **OpenAI Integration** GPT-4o for parsing, analysis, content generation
- ✅ **LaTeX Document Generation** Template injection with Mustache + cloud compilation
- ✅ **TypeScript** Full type safety across stack
- ✅ **React Context API** Data caching for Dashboard, Profile, Applications
- ✅ **Modal-based Interactions** CRUD operations, preview, generation
- ✅ **Comprehensive Documentation** This README with architecture details

### Route Structure
```
/                        → Landing page (Try-Out Mode)
/auth/login              → Login page (OAuth + email/password)
/auth/signup             → Signup page (OAuth + email/password)
/onboarding              → Multi-stage onboarding (resume upload + verification)
/dashboard               → Main dashboard (stats + quick actions)
/applications            → List view (CRUD interface with modals)
/applications/[id]       → Detail view (tabs: overview, match analysis, documents)
/generate                → Standalone generator (select from applications)
/profile                 → User profile management (tabs: personal, experience, education, projects, skills)
```

---

**Built by**: Ronnie Talabucon Jr.
**Project Duration**: 5 days
**Purpose**: Technical case study demonstrating full-stack development, AI integration, and workflow automation
