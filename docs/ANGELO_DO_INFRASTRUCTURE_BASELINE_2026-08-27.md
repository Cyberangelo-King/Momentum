# Angëlo DO — Momentum Infrastructure Baseline

**Date:** 2026-08-27  
**Owner:** Angëlo DO — DevOps / Cloud Engineer  
**Priority:** CRITICAL

## Executive status

Momentum is deployed and operational, but infrastructure is **NOT YET PRODUCTION-READY**. The immediate blocker is credential exposure in the repository. Additional hardening is required across Supabase security, CI/CD, environment separation, monitoring, backup verification, and disaster recovery.

## P0 — Immediate

### 1. Credential exposure

A Gemini API credential was found committed in `.env.example`. The same credential is configured in Netlify as `GEMINI_API_KEY` and was not marked secret at the time of inspection.

**Action:** revoke/rotate the exposed Gemini credential immediately; replace the Netlify value with the rotated credential and mark it secret; remove the credential from repository history/current example files; scan history for reuse.

> Never copy the exposed credential into documentation, issues, logs, or commits.

## Netlify

- Site: `angelomomentum`
- Production URL: `https://angelomomentum.netlify.app`
- Latest production deployment: `ready`
- Framework: Vite
- Latest observed production commit: `7cd06e873137513f9aeda0197b177d0b1f1379f3`
- SSL URL is available.
- No Netlify Functions or Edge Functions were deployed in the observed deployment.

## GitHub

Repository: `Cyberangelo-King/Momentum`

- Visibility: public
- Default branch: `main`
- Connected integration reports admin/maintain/push access.
- GitHub Actions currently showed no recorded workflow runs at the time of the baseline.
- Branch protection/ruleset state must be explicitly verified.

## Supabase

Project: `gdcpioggwhfuhrufxuck`

Observed state: ACTIVE_HEALTHY, region `eu-west-1`.

### Security hardening

Supabase security findings observed during the baseline included:

- A publicly executable `SECURITY DEFINER` function, `public.rls_auto_enable`.
- Leaked-password protection disabled.
- Multiple permissive RLS policies that should be reviewed and consolidated where appropriate.

These findings require security review before production-readiness approval.

### Database lifecycle

No recorded Supabase development migrations were observed during the baseline. Establish migration-as-code and controlled schema promotion before significant schema evolution.

## CI/CD target

Implement and verify:

`PR -> typecheck -> tests -> build -> security checks -> review -> main -> production deploy -> health verification -> rollback if required`

Production should not depend on unverified manual deployment steps.

## Environment strategy

Define and document separate development, preview/staging, and production configuration. Production secrets must never be committed to source control or exposed through example configuration.

## Secrets policy

- No real credentials in `.env.example`.
- Production secrets stored only in appropriate secret/environment-variable stores.
- Secret values marked secret where the platform supports it.
- Rotate any credential exposed through Git history.
- Do not place secrets in client-side `VITE_*` variables unless they are explicitly intended to be public.

## Monitoring

Minimum production monitoring should cover:

- deployment failures
- application availability
- API/AI failures
- Supabase availability/errors
- authentication failures
- quota/usage limits
- unexpected error rates

## Backup and disaster recovery

Backups must be verified by restoration, not merely existence. Establish documented RPO/RTO targets and perform a recovery drill before declaring the system resilient.

## Priority plan

### P0
1. Rotate exposed Gemini credential.
2. Remove credential from repository and history where applicable.
3. Verify no other credentials are exposed.

### P1
1. Harden `SECURITY DEFINER` function and RLS.
2. Enable appropriate leaked-password protection.
3. Establish GitHub Actions CI/CD.
4. Verify/protect `main`.
5. Establish Supabase migrations and controlled promotion.

### P2
1. Add production monitoring and alerting.
2. Verify backups through restore testing.
3. Document disaster recovery.
4. Establish RTO/RPO.
5. Establish infrastructure cost/quota monitoring.

## Readiness gate

Momentum should be considered **Production Ready v1.0** only after:

- secrets are clean and rotated,
- CI/CD is verified,
- production branch protections are verified,
- Supabase security findings are resolved or explicitly accepted,
- backups have been restore-tested,
- monitoring is active,
- rollback is documented/tested,
- disaster recovery procedures are documented.

**Prepared by:** Angëlo DO  
**Role:** DevOps / Cloud Engineer, Momentum
