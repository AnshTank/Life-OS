# SPEC.md — Life OS Personal Engineering Suite Specification

> **Status**: `FINALIZED`
>
> ⚠️ **Planning Lock**: No implementation code may be written until this spec is marked `FINALIZED`.

## Vision
Life OS is transformed into a Personal Engineering Operating System that empowers developers, founders, and engineers to manage their intellectual capital. Instead of standalone pages, the new engineering tools (macOS-style Smart Notes, Client Meeting Intelligence, Mistake Journal, AI Technical Translator, AI Testing Studio, Visual Diff Analyzer, and Deployment Guardian) are blended directly into the **Projects** module as dedicated project detail tabs.

## Goals
1. **-Style Smart Notes Tab** — Design a premium 3-column notes interface (Folders -> Notes List -> Rich Editor) embedded in the project details view, scoped to the current project.
2. **Client Meeting Intelligence** — Support uploading transcripts or meeting logs directly inside the Notes tab, with AI extraction of structured decisions, action items, and follow-ups.
3. **Conversational AI Testing Studio Tab** — Discuss requirements with the AI to generate project test cases, track execution (pass/fail checklists), and map user/system/data flows.
4. **Layman-to-Technical Translator** — Convert plain language requirements into technical specs, database schemas, and API definitions within the project testing context.
5. **Mistake Journal Tab** — Log project-specific mistakes with root causes and severity, and run pattern analysis to prevent repeating errors.
6. **Visual Difference Analyzer** — Compare before/after screenshots side-by-side or overlaid with comparison sliders to track visual regression.
7. **Deployment Guardian** — AI-reviewed deployment checklist evaluating APIs, databases, rollback plans, and issuing a readiness score.

## Non-Goals (Out of Scope)
- Real-time audio transcription (users copy and paste transcripts or write manual notes).
- Full CI/CD integration (checks are completed manually or self-certified within the Life OS UI).
- Heavy vector database setups (use regex and MongoDB search queries for semantic search-like matching).

## Constraints
- **Styling**: All new views must match the warm, hand-drawn paper journal theme (`globals.css`, Kalam & Caveat fonts, border-radius styling, doodle touches).
- **Architecture**: Next.js 15 App router, Prisma with MongoDB database queries, Gemini API integration in route handlers.
- **Project Integration**: All data models must support optional or mandatory `projectId` relationships to persist entries scoped to specific projects.

## Success Criteria
- [ ] Notes application renders with macOS folder navigation inside the Project detail view.
- [ ] Users can enter layman text and receive technical translations.
- [ ] AI-generated test checklists are editable and persist to MongoDB.
- [ ] Before/after images are compared using an interactive slider canvas.
- [ ] Mistake trends and weekly charts are rendered correctly under the project detail.
- [ ] All features build successfully in TypeScript.

---

*Last updated: 2026-06-19*
