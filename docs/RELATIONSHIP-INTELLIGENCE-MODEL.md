# Momentum Relationship Intelligence Model

**Owner:** Angëlo Co-founder  
**Status:** MVP architecture contract  
**Date:** 2026-09-10

## Purpose

This document defines the smallest durable conceptual model required to prove Momentum's core relationship loop without committing the product to a large future architecture.

## Canonical loop

`Connection → Memory → Opportunity → Action → Outcome`

Learning is derived from outcomes and feeds future opportunity/action ranking.

## Entities

### Connection

The person/entity the user met or already knows.

Minimum fields:
- `id`
- `name`
- `organization`
- `role`
- `contact_methods`
- `relationship_type`
- `priority`
- `created_at`
- `updated_at`

### Memory

The context that explains why a connection matters. A memory must be attributable to a source and timestamp where practical.

Minimum fields:
- `id`
- `connection_id`
- `event_id` (nullable)
- `content`
- `source_type` (note, voice, photo, imported, user-entered, etc.)
- `occurred_at`
- `created_at`
- `confidence` (optional)

### Opportunity

A reason to continue the relationship. This is not merely a score; it must have an explanation grounded in available context.

Minimum fields:
- `id`
- `connection_id`
- `reason`
- `priority_score`
- `evidence_refs`
- `status` (open, dismissed, converted)
- `created_at`
- `expires_at` (optional)

### Action

A concrete next step proposed or entered by the user.

Minimum fields:
- `id`
- `connection_id`
- `opportunity_id` (nullable)
- `type` (message, meeting, introduction, referral, reminder, custom)
- `content`
- `due_at`
- `status` (proposed, approved, scheduled, completed, cancelled)
- `created_at`
- `completed_at` (nullable)

**Rule:** Momentum may recommend consequential actions, but the user remains the authorization boundary for sending/performing them during MVP.

### Outcome

What actually happened after an action. Outcomes are first-class because they are the evidence needed to evaluate intelligence.

Minimum fields:
- `id`
- `action_id`
- `connection_id`
- `type` (no-response, replied, meeting-booked, collaboration, referral, mentorship, opportunity, other)
- `result_note`
- `occurred_at`
- `created_at`

## Derived concepts

### Relationship state

A computed view, not a separate source of truth. It summarizes recency, context density, open actions, outcomes and progression history.

### Opportunity score

A ranking signal, not a truth claim. Every high-priority recommendation should expose enough evidence for the user to understand why it was ranked.

### Meaningful Relationship Progression (MRP)

An observable outcome indicating that a relationship moved forward. Examples: a reply, meeting booked, collaboration started, referral, mentorship relationship, or user-defined equivalent.

## MVP rules

1. **Outcome beats activity.** Capturing more contacts is not success by itself.
2. **Context beats generic advice.** Recommendations must cite captured relationship/event context.
3. **Human approval remains mandatory** for consequential actions.
4. **Every recommendation should be evaluable.** Store the recommendation inputs, output, acceptance/rejection and eventual outcome where feasible.
5. **Do not require the graph to ship first.** A relational model can prove the loop before a full graph representation is introduced.
6. **Keep event context optional at the data-model level.** Momentum must remain capable of supporting relationships outside a single event.
7. **Avoid irreversible schema commitments.** Start with the minimum fields needed to measure the loop.

## Evaluation baseline

Before claiming intelligence value, compare recommendations against a deterministic baseline such as:

`priority = recency + explicit priority + due follow-up + relationship/context signals`

The AI/learning layer must beat or materially improve on this baseline on agreed evaluation metrics before it becomes the default decision-maker.

## Initial metrics

- Capture completion rate
- Median capture time
- Recommendation acceptance rate
- Follow-up completion rate
- Response rate
- Meaningful Relationship Progression rate
- 7-day and 30-day relationship retention
- Recommendation quality versus baseline

## Privacy and safety

Relationship data can be sensitive. Do not collect information merely because it is technically possible. Data collection must have a product purpose, appropriate user visibility, and clear retention/deletion behavior. Do not expose private relationship context across users or organizations without explicit authorization.

## Reversibility

This model is intentionally compatible with:

`Event OS → Community Intelligence → Relationship Intelligence → Network Intelligence`

A future graph, vector memory system, or multi-tenant intelligence layer may project from these entities without requiring the MVP to become dependent on them today.
