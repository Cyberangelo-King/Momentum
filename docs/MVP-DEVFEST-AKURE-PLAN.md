# Momentum MVP — DevFest Akure Acceptance Plan

**Owner:** Angëlo Co-founder  
**Date:** 2026-09-10  
**Status:** Active execution

## Product promise

Momentum helps a person remember who mattered, understand why, and take the right next action before the relationship goes cold.

## Scope lock

The MVP is the complete relationship loop, not a collection of features:

**Capture → Understand → Prioritize → Act → Progress**

A feature is MVP only if removing it makes that loop materially worse for a real DevFest user.

### P0 — must work

- Fast person capture
- Context and notes
- People list and search
- Relationship detail/editing
- Follow-up date/status
- Follow-up queue with today / overdue / upcoming / done
- Quick message action
- Record follow-through/outcome
- Event context
- Offline-safe local persistence
- Export
- Authentication/privacy controls

### P1 — support the loop, only if reliable

- Moments and ideas as relationship context
- Lightweight AI assistance grounded in captured context
- Basic recap/analytics
- Sync

### Deferred — no new build work during MVP hardening

- Live Copilot
- Pitch Simulator
- Constellation visualisation
- Gamification / badges
- Advanced event tooling
- Batch outreach
- Broad intelligence-engine surfaces
- New experimental AI features

These may remain in the codebase, but they do not get priority over P0. They should not dominate primary navigation or the DevFest demo.

## Navigation decision

Primary navigation is intentionally limited to:

**Home · People · Capture · Follow-ups · More**

Secondary surfaces remain discoverable under More so existing functionality is not unnecessarily destroyed while the MVP is hardened.

## DevFest user journey

1. Open Momentum.
2. Immediately understand the purpose and current relationship workload.
3. Capture a real person quickly without completing a CRM form.
4. Add the one piece of context that explains why the person matters.
5. Later retrieve the person and understand the interaction without relying on memory.
6. See who needs attention and why.
7. Take a follow-up action.
8. Record what happened.
9. Measure meaningful progression.

## Acceptance criteria

A new user at DevFest Akure must be able to complete the core journey without a product tour or founder explanation.

- Capture a real connection in under ~30 seconds for a normal interaction.
- Retrieve that connection later.
- Understand why the connection matters from the saved context.
- Find pending follow-ups without hunting through screens.
- Complete a follow-up and see the state change.
- Explain in one sentence why Momentum is better than a contact list.

## Quality bar

Before calling the MVP ready:

- No broken P0 flow.
- No dead-end P0 button.
- No fake or vanity metrics.
- Useful empty, loading, offline, and error states.
- Mobile-first layout works at common Android widths.
- Destructive actions are protected.
- Data survives reload and offline use where promised.
- AI suggestions are grounded, editable, and user-approved.
- Demo data is visibly separate from real data.
- Build/typecheck passes in CI.

## Demo rule

Do not demo the product by touring features.

Demo **one relationship**:

**Meet → Capture → Remember → Prioritize → Follow up → Progress.**

If that moment is convincing, the product has a reason to exist. If it is not, adding another feature will not save it.

## Current implementation checkpoint

- MVP dashboard: implemented on `feat/mvp-product-cleanup`.
- Primary navigation: reduced to five actions; secondary features moved behind More.
- Follow-ups: reduced to an action-first queue; removed pipeline/kanban/batch-outreach complexity from the primary experience.
- PR #4 remains draft until CI/build verification and the remaining P0 journey audit are complete.
- No claim of production readiness is made until automated verification and manual device-width testing pass.
