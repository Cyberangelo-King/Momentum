# Momentum — Founder Now Report

**Date:** 2026-09-10  
**Decision:** Stop treating feature expansion as the primary objective. Prove the relationship-intelligence loop.

## What I found

Momentum is no longer an empty prototype. The product has a broad client surface and a substantial engine. The README defines a general Event OS and a governed autonomy doctrine. The application includes connections, capture, moments, ideas, follow-ups, recap, exports, smart notes, event workflows, analytics, live copilot and other supporting surfaces.

The intelligence engine already exposes observation, prediction, recommendation, learning, hypotheses, experiments, evolution, capabilities, opportunity discovery and health/status APIs.

## The problem

Breadth is ahead of evidence.

The repository can demonstrate many capabilities, but the company still needs proof that Momentum creates a better outcome than ordinary contact collection and reminders.

The product should therefore be judged on whether it turns event context into **meaningful relationship progression**.

## Product promise

> After an event, help a person remember who mattered, understand why, and take the right next action before the relationship goes cold.

## Canonical loop

`Connection → Memory → Opportunity → Action → Outcome → Learning`

Every major feature should strengthen this loop or be treated as secondary.

## Primary KPI

**Meaningful Relationship Progressions / Active User / Event**

Examples of progression include a reply, meeting booked, collaboration started, referral, mentorship relationship, or another user-defined meaningful next step.

## Immediate technical priorities

1. Define the canonical relationship-intelligence data model.
2. Build one deterministic end-to-end path from capture to outcome.
3. Create a small synthetic event dataset for repeatable evaluation.
4. Evaluate recommendation quality against a simple baseline.
5. Instrument capture, recommendation acceptance, follow-up completion and outcomes.
6. Separate prototype sync from the eventual durable multi-user data plane.
7. Finish the open security/CI hardening path before calling the system production-ready.

## Strategic sequence

### M0 — Reliability
Build, CI, secrets, authentication, sync and deployment are trustworthy.

### M1 — Core loop
A user can capture a person quickly, understand the relationship, receive a useful next action, follow up, and record the outcome.

### M2 — Intelligence
Momentum recommendations demonstrate measurable value beyond rules/manual workflows.

### M3 — Event OS
Only after the core loop works do templates, richer analytics, multi-event intelligence and advanced autonomy become multipliers.

## What we should NOT do right now

- Add another dashboard just because we can.
- Add AI features without an evaluation method.
- Build a giant autonomous agent before the action/outcome loop is proven.
- Treat localStorage or the current in-memory sync state as production persistence.
- Optimize vanity metrics such as contacts captured while ignoring relationship outcomes.

## Current security/reliability blocker

GitHub shows PR #2 open and draft, addressing CI's Bun lockfile mismatch and adding credential scanning. Issue #1 remains open and records the requirement to rotate/revoke the previously exposed Gemini credential and harden the production secret configuration. Repository-side remediation is not equivalent to credential rotation.

## Founder call

Momentum's next breakthrough is not another feature. It is **evidence**.

If we can demonstrate that Momentum consistently identifies the right people, recommends the right next action, and improves the probability of meaningful follow-up, we have the beginnings of a real product moat.

If we cannot demonstrate that, more features only make the uncertainty prettier.

**Next operating principle:** build less, measure more, learn faster.
