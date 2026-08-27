# Momentum Security Architecture & Threat Defense

## 1. Core Principles
- **Zero Trust:** Every internal subsystem must authenticate and validate input from adjacent modules.
- **Least Privilege:** Capabilities and experimental candidates are sandboxed with zero filesystem/network access.
- **Deterministic Policy Supremacy:** AI models and evolutionary optimizers never make direct execution decisions; all actions pass through the deterministic Policy Engine.
- **Immutable Boundaries:** Code in `/momentum-engine/governance/` and `/momentum-engine/security/` cannot be modified by candidate strategies.

---

## 2. Threat Vector Mitigations

### 2.1 AI Prompt Injection & Indirect Hijacking
- All natural language and external text inputs are filtered through delimiter sanitization and boundary detectors.
- Model outputs are treated as untrusted data until validated against rigid JSON schemas.

### 2.2 Sybil & Network Collusion Attacks
- Trust is computed across domain clusters rather than global scalars.
- Sudden spikes in reciprocal endorsements or ratings are flagged by graph anomaly detectors.

### 2.3 Privilege Escalation & Self-Privileging
- Candidates cannot create API tokens, elevate roles, or bypass authentication.
- Any attempt by an evolutionary mutation to access environment secrets immediately triggers an engine lockdown.

---

## 3. Emergency Controls & Kill Switches

The security subsystem provides external, out-of-band kill switches:
- `KILL_SWITCH_EVOLUTION`: Suspends all mutation generation and candidate testing.
- `KILL_SWITCH_AI_PROXIES`: Reverts AI reasoning to deterministic offline heuristic fallbacks.
- `KILL_SWITCH_RECOMMENDATIONS`: Restores baseline popularity/chronological ranking.
- `KILL_SWITCH_GLOBAL`: Halts all engine background threads and locks active state.
