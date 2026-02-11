// Centralized mock response data for all API endpoints

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  role: "user",
  emailVerified: "2024-01-01T00:00:00Z",
};

export const mockAdminUser = {
  id: "admin-1",
  email: "admin@example.com",
  role: "admin",
  emailVerified: "2024-01-01T00:00:00Z",
};

export const mockToken = "mock-jwt-token-for-testing";

export const mockLoginResponse = {
  status: "success" as const,
  data: { token: mockToken, user: mockUser },
};

export const mockSignupResponse = {
  status: "success" as const,
  data: { verificationToken: "verify-token-123" },
};

export const mockCvSnapshot = {
  id: "cv-1",
  userId: "user-1",
  rawCvText:
    "John Doe\nSenior Frontend Developer\n5 years experience in React, TypeScript, Node.js\nWorked at Google, Meta\nSkills: React, TypeScript, Next.js, Node.js, PostgreSQL, Tailwind CSS",
  parsedSkills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"],
  parsedRoles: ["Frontend Developer", "Full Stack Engineer"],
  experienceYears: 5,
  inputMethod: "text",
  version: 1,
  isActive: true,
  createdAt: "2024-06-01T10:00:00Z",
  updatedAt: "2024-06-01T10:00:00Z",
};

export const mockCvVersions = [
  { ...mockCvSnapshot, version: 2, id: "cv-2", createdAt: "2024-07-01T10:00:00Z" },
  { ...mockCvSnapshot, version: 1, id: "cv-1" },
];

export const mockPreferences = {
  id: "pref-1",
  userId: "user-1",
  preferredRoles: ["Frontend Developer", "React Engineer"],
  locations: ["Remote", "London"],
  remotePreference: true,
  employmentType: "full_time",
  minExperienceYears: 3,
  maxExperienceYears: 8,
  expectedSalaryMin: 80000,
  expectedSalaryMax: 120000,
  salaryCurrency: "USD",
  minimumMatchPercentage: 60,
  excludedKeywords: ["blockchain", "crypto"],
  blacklistedCompanies: ["BadCorp"],
  createdAt: "2024-06-01T10:00:00Z",
  updatedAt: "2024-06-01T10:00:00Z",
};

export const mockPlans = [
  {
    id: "plan-free",
    name: "free",
    price: 0,
    billingCycle: "monthly",
    description: "Basic job matching",
    features: { matchesPerWeek: 10, searchProfiles: 1 },
    isActive: true,
  },
  {
    id: "plan-starter",
    name: "starter",
    price: 9,
    billingCycle: "monthly",
    description: "More matches and features",
    features: { matchesPerWeek: 50, searchProfiles: 3 },
    isActive: true,
  },
  {
    id: "plan-pro",
    name: "pro",
    price: 19,
    billingCycle: "monthly",
    description: "Unlimited matching",
    features: { matchesPerWeek: -1, searchProfiles: -1 },
    isActive: true,
  },
];

export const mockSubscription = {
  id: "sub-1",
  userId: "user-1",
  planId: "plan-starter",
  status: "active",
  currentPeriodStart: "2024-06-01T00:00:00Z",
  currentPeriodEnd: "2024-07-01T00:00:00Z",
  plan: mockPlans[1],
};

export const mockPayments = [
  {
    id: "pay-1",
    userId: "user-1",
    amount: 9,
    currency: "USD",
    status: "succeeded",
    createdAt: "2024-06-01T00:00:00Z",
  },
];

export const mockJob = {
  id: "job-1",
  externalId: "adzuna-123",
  title: "Senior React Developer",
  company: "TechCorp",
  location: "London, UK",
  description: "We are looking for a senior React developer with 5+ years experience.",
  salaryMin: 80000,
  salaryMax: 120000,
  salaryCurrency: "GBP",
  category: "IT Jobs",
  isRemote: true,
  sourceUrl: "https://example.com/job/123",
  createdAt: "2024-06-15T10:00:00Z",
};

export const mockMatchResults = [
  {
    matchId: "match-1",
    userId: "user-1",
    jobId: "job-1",
    batchId: "batch-1",
    matchPercentage: 85,
    scoreBreakdown: {
      roleRelevance: 90,
      skillMatch: 85,
      experienceMatch: 80,
      locationMatch: 90,
      salaryMatch: 75,
    },
    matchedSkills: ["React", "TypeScript", "Node.js"],
    missingSkills: ["GraphQL"],
    recommendation: "Strong match — your React and TypeScript skills align well with this role.",
    isShortlisted: false,
    viewedAt: null,
    createdAt: "2024-06-15T12:00:00Z",
    job: mockJob,
  },
  {
    matchId: "match-2",
    userId: "user-1",
    jobId: "job-2",
    batchId: "batch-1",
    matchPercentage: 62,
    scoreBreakdown: {
      roleRelevance: 70,
      skillMatch: 60,
      experienceMatch: 65,
      locationMatch: 50,
      salaryMatch: 65,
    },
    matchedSkills: ["TypeScript", "Node.js"],
    missingSkills: ["Python", "Django"],
    recommendation: "Moderate match — consider upskilling in Python.",
    isShortlisted: true,
    viewedAt: "2024-06-15T13:00:00Z",
    createdAt: "2024-06-15T12:00:00Z",
    job: {
      ...mockJob,
      id: "job-2",
      title: "Backend Engineer",
      company: "DataFlow",
      location: "Remote",
      isRemote: true,
    },
  },
];

export const mockBatches = [
  {
    batchId: "batch-1",
    userId: "user-1",
    matchesCount: 15,
    trigger: "manual",
    createdAt: "2024-06-15T12:00:00Z",
  },
  {
    batchId: "batch-2",
    userId: "user-1",
    matchesCount: 8,
    trigger: "scheduled",
    createdAt: "2024-06-14T12:00:00Z",
  },
];

export const mockExports = [
  {
    id: "export-1",
    userId: "user-1",
    batchId: "batch-1",
    fileName: "job-matches-2024-06-15.csv",
    fileSize: 4096,
    totalRows: 15,
    status: "completed",
    createdAt: "2024-06-15T14:00:00Z",
  },
  {
    id: "export-2",
    userId: "user-1",
    batchId: "batch-2",
    fileName: "job-matches-2024-06-14.csv",
    fileSize: 2048,
    totalRows: 8,
    status: "completed",
    createdAt: "2024-06-14T14:00:00Z",
  },
];

export const mockNotificationPrefs = {
  id: "notif-pref-1",
  userId: "user-1",
  jobMatchFrequency: "daily",
  emailOnSubscriptionChange: true,
  emailOnPaymentIssue: true,
  emailMarketing: false,
  createdAt: "2024-06-01T00:00:00Z",
  updatedAt: "2024-06-01T00:00:00Z",
};

export const mockNotifications = [
  {
    id: "notif-1",
    userId: "user-1",
    type: "match_batch",
    subject: "15 new job matches found",
    body: "Your latest matching run found 15 new opportunities.",
    emailStatus: "sent",
    emailSentAt: "2024-06-15T12:30:00Z",
    emailError: null,
    createdAt: "2024-06-15T12:30:00Z",
  },
  {
    id: "notif-2",
    userId: "user-1",
    type: "subscription_renewal",
    subject: "Subscription renewed",
    body: "Your Starter plan has been renewed.",
    emailStatus: "sent",
    emailSentAt: "2024-06-01T00:05:00Z",
    emailError: null,
    createdAt: "2024-06-01T00:05:00Z",
  },
];

export const mockAdminStats = {
  totalUsers: 142,
  activeUsers: 98,
  activeSubscriptions: 65,
  pastDueSubscriptions: 3,
  totalJobs: 12450,
  jobFetchSuccessRate: 97.5,
  failedTasks24h: 2,
  matchBatches: 320,
  subscriptionBreakdown: {
    active: 65,
    past_due: 3,
    trialing: 12,
    cancelled: 8,
    expired: 4,
  },
};

export const mockAdminUsers = [
  {
    id: "user-1",
    email: "test@example.com",
    role: "user",
    emailVerified: "2024-01-01T00:00:00Z",
    isActive: true,
    subscription: { planName: "starter", status: "active" },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "admin-1",
    email: "admin@example.com",
    role: "admin",
    emailVerified: "2024-01-01T00:00:00Z",
    isActive: true,
    subscription: null,
    createdAt: "2023-12-01T00:00:00Z",
  },
];

export const mockJobFetchLogs = [
  {
    id: "log-1",
    status: "completed",
    source: "adzuna",
    totalFetched: 250,
    newJobs: 42,
    duplicates: 208,
    duration: 3200,
    errors: null,
    createdAt: "2024-06-15T06:00:00Z",
  },
];

export const mockMatchingLogs = [
  {
    id: "mlog-1",
    level: "info",
    message: "Batch matching completed for user user-1",
    metadata: { batchId: "batch-1", matchesFound: 15 },
    createdAt: "2024-06-15T12:00:00Z",
  },
];

export const mockEmailLogs = [
  {
    id: "elog-1",
    status: "sent",
    to: "test@example.com",
    subject: "Your job matches are ready",
    createdAt: "2024-06-15T12:30:00Z",
    error: null,
  },
];

export const mockTasks = [
  {
    id: "task-1",
    type: "job_fetch",
    status: "completed",
    attempts: 1,
    maxAttempts: 3,
    payload: { roles: ["Frontend Developer"], locations: ["London"] },
    result: null,
    error: null,
    createdAt: "2024-06-15T06:00:00Z",
    completedAt: "2024-06-15T06:01:00Z",
  },
];
