# Mewar Result AI – AI-Driven Academic Result Analysis and Performance Prediction System

Mewar Result AI is an intelligent web-based academic analytics platform designed to explore how AI-assisted interpretation and structured data capture can improve how student Continuous Assessment (CA) and examination outcomes are understood at Mewar International University. The platform integrates validated score entry by faculty, department, level, and semester; automated performance computation; AI-assisted diagnostic feedback; and persistent session history for longitudinal monitoring. The system was developed as a research-oriented prototype investigating the intersection of learning analytics, decision-support systems, and explainable AI in higher education.

## Problem Context

Academic result interpretation in many universities remains manual, fragmented, and reactive. Students often receive numerical scores without clear guidance on strengths, weak courses, or likely standing. Lecturers and advisors lack a unified platform to detect at-risk performance early or enforce course-specific marking rules consistently across CA, attendance, and examination components.

Mewar Result AI was designed to demonstrate how integrated web analytics, rule-based computation, and AI-assisted interpretation can address these issues while maintaining operational reliability when external AI services are unavailable.

## System Architecture Overview

The system consists of four major components:

1. **Guided academic workflow** — stepwise faculty, department, level, and semester selection with course-filtered score entry
2. **Analytics engine** — server-side computation of percentages, weighted indicators, grade mapping, and standing estimates
3. **AI-assisted interpretation** — structured natural-language diagnostics for CA, examination, and total performance
4. **Session persistence** — authenticated storage and retrieval of analysis history via cloud database

User-entered scores flow through validation logic tied to course metadata before analytics generation and optional AI interpretation. A deterministic heuristic fallback ensures continuity when the OpenAI API is absent or fails.

## Validated Score Capture

The main workflow enables students to:

- Select academic context (faculty, department, level, semester)
- Enter CA and examination scores per course
- Enforce course-specific maximum limits from the institutional course catalogue
- Block invalid entries before analysis is triggered

This module reflects educational measurement principles by treating scores as structured inputs governed by institutional marking rules rather than free-form numeric entry.

## AI-Assisted Analysis with Heuristic Fallback

The analytics service combines:

- **AI-assisted structured output** via the Vercel AI SDK and OpenAI for diagnostic summaries, strength/improvement course lists, study tips, and standing estimates
- **Heuristic fallback** that computes the same structured response deterministically when AI is unavailable

The hybrid design improves reliability, explainability, and trust for student-facing academic decision support.

## Analytics and History Modules

Completed sessions produce:

- CA performance analysis
- Examination performance analysis
- Total performance analysis with projected standing
- Visual summaries (pie, bar, and trend charts)
- Exportable reports via browser print

Authenticated users can review prior sessions through the history module, supporting longitudinal performance monitoring across semesters.

## Administrative Course Management

An admin interface supports course catalogue maintenance—create, edit, delete, and filter course records with faculty, department, level, semester, units, and score limits. This keeps validation rules aligned with official institutional configurations.

## Technology Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Authentication, client APIs)
- **AI Integration:** OpenAI API via Vercel AI SDK with schema-constrained structured generation
- **Hosting:** [Vercel](https://vercel.com)

## My Contribution

I independently conceived and developed Mewar Result AI, including:

- Requirements analysis and system architecture design
- Full-stack implementation of the guided student workflow
- Score validation and computational analytics modules
- AI-assisted interpretation with heuristic fallback logic
- Database-backed session persistence and history retrieval
- Administrative course management interface
- System testing and performance evaluation for the final-year project

The project was developed as a research-oriented prototype for the Faculty of Computing, Mewar International University.

## Future Research Directions

Potential extensions include:

- Faculty-level analytics dashboards for departmental quality assurance
- Downloadable PDF report generation with institutional branding
- Integration with official student information and result management systems
- Benchmarking predicted standing against actual end-of-semester outcomes using multi-session datasets
- Carbon-aware and cost-aware orchestration of AI inference for sustainable campus deployments

## Demo

**Live Application:** [https://mewar-result-ai.vercel.app/](https://mewar-result-ai.vercel.app/)

## Local Development

```bash
npm install
# create .env.local with Supabase and optional OpenAI keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional — heuristic fallback runs without it)
- `MIU_ADMIN_KEY` (admin course management)
