/**
 * Rule-based job matching scorer.
 *
 * Scoring dimensions (HLD §10):
 *   1. Skill overlap      — 30%
 *   2. Role match         — 25%
 *   3. Location match     — 20%
 *   4. Salary compat.     — 15%
 *   5. Experience align.  — 10%
 *
 * Semantic similarity is deferred to a future AI-powered phase.
 */

interface CvProfile {
  parsedSkills: string[] | null;
  parsedRoles: string[] | null;
  parsedTools: string[] | null;
  experienceYears: string | null;
}

interface UserPreferences {
  preferredRoles: string[];
  locations: string[];
  remotePreference: boolean;
  expectedSalaryMin: string | null;
  expectedSalaryMax: string | null;
  excludedKeywords: string[] | null;
  blacklistedCompanies: string[] | null;
  minimumMatchPercentage: number | null;
}

interface JobData {
  title: string;
  company: string | null;
  description: string | null;
  salaryMin: string | null;
  salaryMax: string | null;
  location: string | null;
  isRemote: boolean;
}

export interface ScoreResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  scoreBreakdown: {
    skillOverlap: number;
    roleMatch: number;
    locationMatch: number;
    salaryCompat: number;
    experienceAlign: number;
  };
  recommendationReason: string;
  excluded: boolean;
}

const WEIGHTS = {
  skillOverlap: 0.30,
  roleMatch: 0.25,
  locationMatch: 0.20,
  salaryCompat: 0.15,
  experienceAlign: 0.10,
};

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s,;|/\-_()]+/).filter(Boolean);
}

// ── Individual dimension scorers ───────────────────────────────────────────

function scoreSkillOverlap(cv: CvProfile, job: JobData): { score: number; matched: string[]; missing: string[] } {
  const skills = cv.parsedSkills ?? [];
  const tools = cv.parsedTools ?? [];
  const allUserSkills = [...skills, ...tools].map(normalize);

  if (allUserSkills.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const jobText = normalize(`${job.title} ${job.description ?? ""}`);
  const jobTokens = new Set(tokenize(jobText));

  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of allUserSkills) {
    const skillTokens = tokenize(skill);
    const isMatch = skillTokens.some((t) => jobTokens.has(t) || jobText.includes(normalize(skill)));
    if (isMatch) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  const score = matched.length / allUserSkills.length;
  return { score: Math.min(score * 1.2, 1), matched: [...new Set(matched)], missing: [...new Set(missing)] };
}

function scoreRoleMatch(cv: CvProfile, prefs: UserPreferences, job: JobData): number {
  const userRoles = [...(cv.parsedRoles ?? []), ...prefs.preferredRoles].map(normalize);
  if (userRoles.length === 0) return 0;

  const jobTitle = normalize(job.title);
  const jobTokens = new Set(tokenize(jobTitle));

  let bestScore = 0;
  for (const role of userRoles) {
    const roleTokens = tokenize(role);
    const overlap = roleTokens.filter((t) => jobTokens.has(t)).length;
    const score = roleTokens.length > 0 ? overlap / roleTokens.length : 0;
    if (score > bestScore) bestScore = score;

    // Substring match bonus
    if (jobTitle.includes(normalize(role))) {
      bestScore = Math.max(bestScore, 0.9);
    }
  }

  return Math.min(bestScore, 1);
}

function scoreLocationMatch(prefs: UserPreferences, job: JobData): number {
  // Remote jobs match everyone with remote preference
  if (job.isRemote && prefs.remotePreference) return 1;

  if (!job.location) return 0.3; // Unknown location gets a neutral score

  const jobLocation = normalize(job.location);

  for (const loc of prefs.locations) {
    const prefLocation = normalize(loc);
    if (
      jobLocation.includes(prefLocation) ||
      prefLocation.includes(jobLocation) ||
      normalize(loc) === "remote"
    ) {
      return 1;
    }
  }

  // Partial match — same country/region tokens
  const jobTokens = new Set(tokenize(jobLocation));
  for (const loc of prefs.locations) {
    const locTokens = tokenize(loc);
    if (locTokens.some((t) => jobTokens.has(t))) return 0.5;
  }

  return 0;
}

function scoreSalaryCompat(prefs: UserPreferences, job: JobData): number {
  const expectedMin = prefs.expectedSalaryMin ? Number(prefs.expectedSalaryMin) : null;
  const expectedMax = prefs.expectedSalaryMax ? Number(prefs.expectedSalaryMax) : null;
  const jobMin = job.salaryMin ? Number(job.salaryMin) : null;
  const jobMax = job.salaryMax ? Number(job.salaryMax) : null;

  // If either side has no salary data, neutral score
  if ((expectedMin == null && expectedMax == null) || (jobMin == null && jobMax == null)) {
    return 0.5;
  }

  const userMid = ((expectedMin ?? 0) + (expectedMax ?? expectedMin ?? 0)) / 2;
  const jobMid = ((jobMin ?? 0) + (jobMax ?? jobMin ?? 0)) / 2;

  if (userMid === 0 || jobMid === 0) return 0.5;

  // Ratio-based scoring: 1.0 if perfect match, degrades as gap grows
  const ratio = Math.min(userMid, jobMid) / Math.max(userMid, jobMid);
  return ratio;
}

function scoreExperienceAlign(cv: CvProfile, job: JobData): number {
  const userExp = cv.experienceYears ? Number(cv.experienceYears) : null;
  if (userExp == null) return 0.5; // Unknown experience, neutral

  // Simple heuristic: check if job title/description hints at seniority
  const jobText = normalize(`${job.title} ${job.description ?? ""}`);

  const seniorKeywords = ["senior", "lead", "principal", "staff", "architect", "director"];
  const midKeywords = ["mid", "intermediate", "3+", "4+", "5+"];
  const juniorKeywords = ["junior", "entry", "graduate", "intern", "0-2", "1-2", "fresher"];

  let expectedRange: [number, number] = [0, 50]; // Default: any experience

  if (seniorKeywords.some((k) => jobText.includes(k))) {
    expectedRange = [5, 50];
  } else if (midKeywords.some((k) => jobText.includes(k))) {
    expectedRange = [2, 8];
  } else if (juniorKeywords.some((k) => jobText.includes(k))) {
    expectedRange = [0, 3];
  }

  if (userExp >= expectedRange[0] && userExp <= expectedRange[1]) {
    return 1;
  }

  // Penalize based on how far outside the range
  const distance = userExp < expectedRange[0]
    ? expectedRange[0] - userExp
    : userExp - expectedRange[1];
  return Math.max(0, 1 - distance * 0.15);
}

// ── Exclusion check ────────────────────────────────────────────────────────

function isExcluded(prefs: UserPreferences, job: JobData): boolean {
  const jobText = normalize(`${job.title} ${job.description ?? ""} ${job.company ?? ""}`);

  // Check excluded keywords
  if (prefs.excludedKeywords) {
    for (const kw of prefs.excludedKeywords) {
      if (jobText.includes(normalize(kw))) return true;
    }
  }

  // Check blacklisted companies
  if (prefs.blacklistedCompanies && job.company) {
    const jobCompany = normalize(job.company);
    for (const bc of prefs.blacklistedCompanies) {
      if (jobCompany.includes(normalize(bc)) || normalize(bc).includes(jobCompany)) return true;
    }
  }

  return false;
}

// ── Main scorer ────────────────────────────────────────────────────────────

export function scoreJob(cv: CvProfile, prefs: UserPreferences, job: JobData): ScoreResult {
  // Check exclusions first
  if (isExcluded(prefs, job)) {
    return {
      matchPercentage: 0,
      matchedSkills: [],
      missingSkills: cv.parsedSkills ?? [],
      scoreBreakdown: { skillOverlap: 0, roleMatch: 0, locationMatch: 0, salaryCompat: 0, experienceAlign: 0 },
      recommendationReason: "Excluded by keyword or company filter",
      excluded: true,
    };
  }

  const { score: skillScore, matched, missing } = scoreSkillOverlap(cv, job);
  const roleScore = scoreRoleMatch(cv, prefs, job);
  const locationScore = scoreLocationMatch(prefs, job);
  const salaryScore = scoreSalaryCompat(prefs, job);
  const experienceScore = scoreExperienceAlign(cv, job);

  const breakdown = {
    skillOverlap: Math.round(skillScore * 100),
    roleMatch: Math.round(roleScore * 100),
    locationMatch: Math.round(locationScore * 100),
    salaryCompat: Math.round(salaryScore * 100),
    experienceAlign: Math.round(experienceScore * 100),
  };

  const weighted =
    skillScore * WEIGHTS.skillOverlap +
    roleScore * WEIGHTS.roleMatch +
    locationScore * WEIGHTS.locationMatch +
    salaryScore * WEIGHTS.salaryCompat +
    experienceScore * WEIGHTS.experienceAlign;

  const matchPercentage = Math.round(weighted * 100);

  // Build recommendation reason
  const reasons: string[] = [];
  if (skillScore >= 0.5) reasons.push("good skill match");
  if (roleScore >= 0.7) reasons.push("strong role fit");
  if (locationScore >= 0.8) reasons.push("location compatible");
  if (salaryScore >= 0.7) reasons.push("salary aligned");
  if (experienceScore >= 0.8) reasons.push("experience level match");
  const recommendationReason = reasons.length > 0
    ? `Recommended: ${reasons.join(", ")}`
    : matchPercentage >= 30 ? "Partial match — review manually" : "Low match";

  return {
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing,
    scoreBreakdown: breakdown,
    recommendationReason,
    excluded: false,
  };
}
