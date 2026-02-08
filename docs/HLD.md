# Job Assistant (HLD)

**AI-Powered Job Matching Platform**

## 1Product Overview (What we’re building)

A SaaS platform where:
● Users submit their CV + preferences
● System periodically fetches jobs
● Each job is matched against user profile
● Best-fit jobs are delivered via **CSV + email**
● User never needs to browse job portals manually

## 2 User Journey (End-to-End)

### 2.1 Landing → Conversion

1. User visits landing page
2. Understands value proposition
3. Sees pricing plans, faq
4. Signs up

### 2.2 Onboarding

1. Email verification
2. CV submission (text using form or auto-fill from pdf)
3. Job preferences setup
4. Subscription selection

### 2.3 Background Processing

1. Jobs fetched periodically
2. Jobs matched to user
3. Results generated

### 2.4 Notification

1. CSV generated
2. Email sent to user

3. User receives actionable data

## 3 Feature Breakdown (Complete)

## 4 Landing Page (Public)

### Features

```
● Hero section (value proposition)
● “How it works”
● Pricing plans
● FAQ
● CTA → Sign up
```

### No backend dependency except:

```
● Analytics
● Email capture (optional)
```

## 5 Authentication & User Management

### Features

```
● Email + password signup
● Login
● Email verification
● Password reset
```

### Core concepts

```
● User is the root entity
● Everything else hangs off user_id
```

## 6 User Profile & CV Management

### CV Input

```
● Paste CV text / fill form
```

```
● (Later) Upload PDF
```

### CV Processing

```
● Raw CV stored
● Parsed structure stored:
○ skills[]
○ roles[]
○ experience_years
○ tools[]
○ seniority
```

### CV Versioning

```
● Every CV update creates a new snapshot
● Old snapshots preserved
● Matching always uses latest active CV
```

## 7 Job Preferences

### Required preferences

```
● Preferred roles
● Locations (remote / city / country)
● Experience range
● Current salary (optional)
● Expected salary range
● Company size
● Employment type (full-time, contract)
```

### Optional filters

● Excluded keywords
● Blacklisted companies
● Minimum match percentage
These preferences directly affect **matching eligibility** , not job fetching.

## 8 Pricing & Subscription

### Plans

```
● Free
```

```
● Starter
● Pro
● Power User
```

### Subscription features

```
● Match frequency
● Job fetch interval
● CSV frequency
● Email limits
```

### Payment

```
● Razorpay
● Webhook-based status updates
● Feature gating via middleware
```

## 9 Job Ingestion System

### Source

```
● Adzuna API
```

### Fetch Strategy (Scalable)

```
● Global job fetch (not per user)
● Cron-based (hourly)
● Parameterized by:
○ roles
○ locations
○ experience
```

### Job Storage

```
● External job ID
● Title, company, description
● Salary range
● Location
● Posted date
● Expiry date
```

### Deduplication

```
● Unique constraint on external_job_id
```

## 10 Job Matching Engine (Core Logic)

### Matching Trigger

```
● New job ingested
● User CV updated
● User preferences updated
● Scheduled re-run (daily/hourly)
```

### Matching Dimensions

1. Skill overlap
2. Semantic similarity (CV ↔ JD)
3. Experience alignment
4. Salary compatibility
5. Location match

### Output per job per user

● match_percentage
● matched_skills[]
● missing_skills[]
● score_breakdown
● recommendation_reason
All matches are **persisted** , not calculated on the fly.

## 11 Async Processing & Queues

### Why async?

```
● Job ingestion
● Matching
● CSV generation
● Email sending
```

### Workers

```
● Job Fetch Worker
● Matching Worker
● CSV Generator Worker
● Email Worker
```

Each worker:
● Stateless
● Retryable
● Idempotent

## 12 CSV Generation

### Content

```
● Job title
● Company
● Location
● Salary
● Match %
● Matched skills
● Missing skills
● Apply URL
```

### Rules

```
● Generated asynchronously
● Stored temporarily
● Attached to email
● Optionally archived
```

## 13 Notification System

### Channels (Phase 1)

```
● Email only
```

### Triggers

```
● New matching batch completed
● Subscription renewal
● Payment failure
```

### Preferences

```
● Daily
● Weekly
● Hourly (paid plans)
```

## 14 Admin & Observability (Internal)

### Admin needs

```
● User list
● Subscription status
● Job ingestion health
● Queue failures
```

### Logging

```
● Job fetch logs
● Matching logs
● Email delivery logs
```

## 15 High-Level Architecture

### Logical Flow

Frontend
↓
Backend API
↓
Database
↓
Queues
↓
Workers
↓
Email Service

## 16 Design Principles (Why this won’t break later)

```
● Jobs are global
● Matching is stored , not recomputed
● CV is versioned
● Async everything heavy
● Feature gating via subscription
```

● Expandable notification system
