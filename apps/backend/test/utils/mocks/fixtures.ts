/**
 * Reusable test data fixtures.
 */

export const mockUser = {
  id: "user-uuid-1234",
  email: "test@example.com",
  password: "$2b$04$hashedpassword",
  role: "user",
  emailVerified: "pending" as const,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockAdminUser = {
  ...mockUser,
  id: "admin-uuid-5678",
  email: "admin@example.com",
  role: "admin",
};

export const mockCvSnapshot = {
  id: "cv-uuid-1111",
  userId: "user-uuid-1234",
  version: 1,
  isActive: true,
  rawCvText: "Experienced software engineer with 5 years in Node.js, React, TypeScript.",
  inputMethod: "text",
  parsedSkills: ["node.js", "react", "typescript", "postgresql"],
  parsedRoles: ["software engineer", "backend developer"],
  parsedTools: ["docker", "git", "vscode"],
  experienceYears: "5",
  seniority: "mid" as const,
  parsedData: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockPreferences = {
  id: "pref-uuid-2222",
  userId: "user-uuid-1234",
  preferredRoles: ["software engineer", "backend developer"],
  locations: ["Bangalore", "Remote"],
  remotePreference: true,
  minExperienceYears: "3",
  maxExperienceYears: "8",
  currentSalary: "1500000",
  expectedSalaryMin: "1800000",
  expectedSalaryMax: "2500000",
  salaryCurrency: "INR",
  companySize: "medium" as const,
  employmentType: "full_time" as const,
  excludedKeywords: ["php", "wordpress"],
  blacklistedCompanies: ["BadCorp"],
  minimumMatchPercentage: 50,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockJob = {
  id: "job-uuid-3333",
  externalJobId: "adzuna-12345",
  source: "adzuna",
  title: "Senior Software Engineer",
  company: "TechCorp",
  description: "Looking for a senior Node.js engineer with React experience.",
  salaryMin: "2000000",
  salaryMax: "3000000",
  salaryCurrency: "INR",
  location: "Bangalore, India",
  isRemote: false,
  category: "IT Jobs",
  contractType: "permanent",
  applyUrl: "https://example.com/apply/12345",
  postedDate: new Date("2025-01-15"),
  isActive: true,
  rawData: {},
  createdAt: new Date("2025-01-15"),
  updatedAt: new Date("2025-01-15"),
};

export const mockPlan = {
  id: "plan-uuid-4444",
  name: "starter",
  displayName: "Starter",
  priceMonthly: "499",
  currency: "INR",
  matchFrequencyHours: 24,
  jobFetchIntervalHours: 12,
  csvFrequencyHours: 24,
  emailLimitDaily: 5,
  maxCvs: 3,
  isActive: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockFreePlan = {
  ...mockPlan,
  id: "plan-uuid-free",
  name: "free",
  displayName: "Free",
  priceMonthly: "0",
};

export const mockSubscription = {
  id: "sub-uuid-5555",
  userId: "user-uuid-1234",
  planId: "plan-uuid-4444",
  status: "active",
  currentPeriodStart: new Date("2025-01-01"),
  currentPeriodEnd: new Date("2025-02-01"),
  cancelledAt: null,
  razorpaySubscriptionId: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockMatchBatch = {
  id: "batch-uuid-6666",
  userId: "user-uuid-1234",
  cvSnapshotId: "cv-uuid-1111",
  trigger: "scheduled" as const,
  status: "completed" as const,
  totalJobsEvaluated: 100,
  totalMatches: 15,
  startedAt: new Date("2025-01-20"),
  completedAt: new Date("2025-01-20"),
  createdAt: new Date("2025-01-20"),
  updatedAt: new Date("2025-01-20"),
};

export const mockJobMatch = {
  id: "match-uuid-7777",
  batchId: "batch-uuid-6666",
  userId: "user-uuid-1234",
  jobId: "job-uuid-3333",
  matchPercentage: "78",
  matchedSkills: ["node.js", "react"],
  missingSkills: ["python"],
  scoreBreakdown: {
    skillOverlap: 75,
    roleMatch: 90,
    locationMatch: 100,
    salaryCompat: 80,
    experienceAlign: 85,
  },
  recommendationReason: "Recommended: good skill match, strong role fit",
  isShortlisted: false,
  isViewed: false,
  createdAt: new Date("2025-01-20"),
  updatedAt: new Date("2025-01-20"),
};

export const mockCsvExport = {
  id: "export-uuid-8888",
  userId: "user-uuid-1234",
  batchId: "batch-uuid-6666",
  fileName: "job-matches-batch-uuid-1234567.csv",
  filePath: null,
  fileSize: 2048,
  totalRows: 15,
  isArchived: false,
  createdAt: new Date("2025-01-20"),
  updatedAt: new Date("2025-01-20"),
};

export const mockNotificationPrefs = {
  id: "notif-pref-uuid-9999",
  userId: "user-uuid-1234",
  matchEmailFrequency: "daily" as const,
  subscriptionEmails: true,
  paymentEmails: true,
  marketingEmails: false,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

export const mockNotification = {
  id: "notif-uuid-aaaa",
  userId: "user-uuid-1234",
  type: "match_batch" as const,
  subject: "New Matches Found",
  body: "<h1>Your Job Matching Is Complete!</h1>",
  metadata: { batchId: "batch-uuid-6666", totalMatches: 15 },
  emailTo: "test@example.com",
  emailStatus: "sent",
  emailSentAt: new Date("2025-01-20"),
  emailError: null,
  batchId: "batch-uuid-6666",
  csvExportId: null,
  createdAt: new Date("2025-01-20"),
  updatedAt: new Date("2025-01-20"),
};

export const mockTask = {
  id: "task-uuid-bbbb",
  type: "job_fetch" as const,
  payload: { roles: ["software engineer"], maxPages: 1 },
  status: "pending" as const,
  priority: 0,
  maxAttempts: 3,
  attempts: 0,
  result: null,
  lastError: null,
  lockedBy: null,
  lockedAt: null,
  scheduledFor: new Date("2025-01-20"),
  startedAt: null,
  completedAt: null,
  createdAt: new Date("2025-01-20"),
  updatedAt: new Date("2025-01-20"),
};
