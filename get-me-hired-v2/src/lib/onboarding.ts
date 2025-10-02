import { supabase } from './supabase';
import type { OnboardingData } from '@/app/onboarding/page';

/**
 * Check if user has completed onboarding
 * Returns true if user has personal_info record
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('personal_info')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no record found, onboarding not completed
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Save complete onboarding data to Supabase
 * This function handles inserting data into all relevant tables
 */
export async function saveOnboardingData(userId: string, data: OnboardingData) {
  try {
    // 1. Save or update personal info (profiles table)
    const fullName = [
      data.personalInfo.firstName,
      data.personalInfo.middleName,
      data.personalInfo.lastName,
      data.personalInfo.suffix
    ]
      .filter(Boolean)
      .join(' ');

    // Update auth user metadata for consistency
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone: data.personalInfo.phone || null,
      }
    });

    if (authUpdateError) {
      console.warn('Could not update auth metadata (non-critical):', authUpdateError);
      // Don't throw - this is non-critical
    }

    const { error: profileError } = await supabase
      .from('personal_info')
      .upsert({
        user_id: userId,
        full_name: fullName,
        email: data.personalInfo.email,
        phone: data.personalInfo.phone || null,
        location: data.personalInfo.location || null,
        summary: data.personalInfo.bio || null,
        linkedin_url: data.personalInfo.linkedin || null,
        github_url: data.personalInfo.github || null,
        portfolio_url: data.personalInfo.portfolio || null,
      }, {
        onConflict: 'user_id',
      });

    if (profileError) {
      console.error('Profile error (raw):', profileError);
      console.error('Profile error (stringified):', JSON.stringify(profileError, null, 2));
      console.error('Profile error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
      });
      throw profileError;
    }

    // 2. Save work experience
    if (data.experience.length > 0) {
      const experienceData = data.experience.map((exp) => ({
        user_id: userId,
        company: exp.company,
        role: exp.role,
        start_date: exp.startDate ? `${exp.startDate}-01` : null,
        end_date: exp.isCurrent ? null : (exp.endDate ? `${exp.endDate}-01` : null),
        is_current: exp.isCurrent,
        description: exp.description || null,
        location: exp.location || null,
      }));

      const { error: expError } = await supabase
        .from('work_experience')
        .insert(experienceData);

      if (expError) {
        console.error('Experience error (raw):', expError);
        console.error('Experience error (stringified):', JSON.stringify(expError, null, 2));
        console.error('Experience error details:', {
          message: expError.message,
          code: expError.code,
          details: expError.details,
          hint: expError.hint,
        });
        console.error('Experience data being inserted:', JSON.stringify(experienceData, null, 2));
        throw expError;
      }
    }

    // 3. Save education
    if (data.education.length > 0) {
      const educationData = data.education.map((edu) => ({
        user_id: userId,
        institution: edu.institution,
        degree: edu.degree,
        field_of_study: edu.fieldOfStudy || null,
        start_date: edu.startDate ? `${edu.startDate}-01` : null,
        end_date: edu.isCurrent ? null : (edu.endDate ? `${edu.endDate}-01` : null),
        gpa: edu.gpa || null,
        description: edu.description || null,
      }));

      const { error: eduError } = await supabase
        .from('education')
        .insert(educationData);

      if (eduError) {
        console.error('Education error:', eduError);
        throw eduError;
      }
    }

    // 4. Save projects
    if (data.projects.length > 0) {
      const projectsData = data.projects.map((proj) => ({
        user_id: userId,
        name: proj.name,
        description: proj.description,
        project_url: proj.url || null,
        start_date: proj.startDate ? `${proj.startDate}-01` : null,
        end_date: proj.isCurrent ? null : (proj.endDate ? `${proj.endDate}-01` : null),
      }));

      const { error: projError } = await supabase
        .from('projects')
        .insert(projectsData);

      if (projError) {
        console.error('Projects error:', projError);
        throw projError;
      }
    }

    // 5. Save skills
    if (data.skills.length > 0) {
      const skillsData = data.skills.map((skill) => ({
        user_id: userId,
        name: skill.name,
        category: skill.category,
        proficiency_level: skill.proficiencyLevel || null,
      }));

      const { error: skillsError } = await supabase
        .from('skills')
        .insert(skillsData);

      if (skillsError) {
        console.error('Skills error:', skillsError);
        throw skillsError;
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return { success: false, error };
  }
}
