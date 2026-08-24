# MIRA — AI/ML MASTER CONTEXT

You are an AI coding agent working on **MIRA (Memory Intelligence & Rehabilitation Assistant)** for **SIH 2026 PS SIH26003**:

> AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in NER.

## PROJECT CONTEXT

MIRA is an **offline-first cognitive rehabilitation + memory assistance platform** for elderly users in the North Eastern Region of India.

Main components:

```text
Patient Mobile App
  → cognitive assessment
  → cognitive games
  → voice-first / zero-touch interaction
  → Memory Prosthetic

AI/ML Engine
  → cognitive scoring
  → cognitive profiling
  → personalization
  → adaptive intervention
  → analytics
  → computer vision / inference

Backend
  → FastAPI
  → REST APIs
  → PostgreSQL
  → synchronization

Caregiver Dashboard
  → performance
  → trends
  → AI insights

Supporting layers
  → Bhashini/regional voice
  → NER cultural content
  → offline operation
```

MIRA's key differentiators:

* **Memory Prosthetic:** on-device face/object recognition, intended for offline low-latency assistance.
* **Cultural reminiscence:** NER folklore, textiles, music, Muga silk, Naga motifs, etc.
* **Zero-touch interaction:** elderly-friendly, voice-first, high-contrast UX.
* **Adaptive rehabilitation:** interventions change according to patient performance.
* **Offline-first:** core functionality must not depend on continuous internet.

Current proposed stack:

`React Native | TypeScript | Python | FastAPI | PyTorch | Scikit-learn | PostgreSQL | Pandas | NumPy | REST APIs`

---

# MY ROLE

## AI/ML: MODELS, INFERENCE, PERSONALIZATION

I own the **AI/ML intelligence layer**, not the whole application.

My core pipeline:

```text
Game/Assessment Events
        ↓
Feature Extraction
        ↓
Cognitive Scoring
        ↓
Cognitive Profile
        ↓
Personalization
        ↓
Adaptive Difficulty
        ↓
Recommendation
        ↓
Performance Feedback
        ↓
Profile Update
```

I also own:

```text
Memory Prosthetic
→ face recognition
→ object recognition
→ inference
→ mobile/offline optimization
```

and:

```text
AI Analytics
→ trends
→ performance insights
→ caregiver-facing AI outputs
```

---

# IMPLEMENTATION ORDER

Work in this order unless the existing repository requires a justified change:

```text
0. Repository + architecture audit
1. ML data contracts
2. Assessment/event processing
3. Cognitive scoring
4. Cognitive profile
5. Personalization engine
6. Adaptive difficulty
7. Recommendation engine
8. AI analytics
9. Face recognition
10. Object recognition
11. Mobile/offline inference
12. API integration
13. End-to-end testing
14. Optimization
```

First build **ONE complete vertical loop**:

```text
ONE GAME
→ events
→ scoring
→ profile
→ personalized next game
→ adaptive difficulty
→ new result
→ profile update
```

Then scale to all games.

---

# COGNITIVE MODEL

Initial dimensions:

```text
Memory
Attention
Recall
Orientation
Reasoning
```

Extract useful behavioral features such as:

```text
accuracy
response_time
attempts
errors
hints
skips
consistency
recent_history
```

Do not automatically treat these as medical diagnoses.

MIRA is currently a **cognitive assistance/rehabilitation and monitoring system**, not an autonomous dementia diagnostic system.

---

# PERSONALIZATION

Input:

```text
current profile
+ historical performance
+ recent performance
+ game history
+ difficulty state
```

Output:

```text
target cognitive domain
+ recommended game/intervention
+ difficulty
+ reason
+ confidence
```

Prefer **interpretable rules/statistical methods first**. Use deep learning only where it adds real value.

Every recommendation should be explainable.

---

# ADAPTIVE DIFFICULTY

Use multiple signals:

```text
accuracy
response_time
attempts
streak
hints
recent performance
```

Conceptually:

```text
high sustained performance → increase
normal performance → maintain
repeated poor performance → decrease
```

Handle insufficient/noisy data safely.

---

# MEMORY PROSTHETIC

## Face

```text
Camera
→ face detection
→ embedding
→ known-face matching
→ identity/confidence
→ voice/UI response
```

Support enrollment and recognition.

Never force an identity when confidence is low.

## Objects

Start with useful personal objects, e.g.:

```text
glasses, keys, wallet, phone,
medicine box, bottle, walking stick
```

Do not attempt universal object recognition for the first prototype.

Prefer on-device/offline inference.

The SIH concept mentions lightweight approaches such as **MobileFaceNet / SSD-MobileNet**.

---

# AI DATA CONTRACT

Before implementation, inspect the existing project and establish the actual schema.

Conceptual event:

```text
patient_id
session_id
game_id
task_type
timestamp
difficulty
correct
response_time
attempts
hints_used
skipped
```

Conceptual AI outputs:

```text
CognitiveScore
CognitiveProfile
Recommendation
DifficultyRecommendation
AnalyticsInsight
VisionResult
```

Do not duplicate existing schemas. Reuse project contracts whenever possible.

---

# DOMAIN BOUNDARY

You MUST understand the **whole MIRA architecture** so your work integrates correctly.

But your implementation scope is:

```text
AI/ML
Models
Inference
Personalization
```

Do NOT independently redesign:

```text
React Native UI
navigation
game rendering
general backend architecture
authentication
database architecture
caregiver UI
voice UI
general app state
cultural content
deployment
```

If AI requires another subsystem to change:

1. identify the dependency,
2. define the required interface,
3. make the smallest compatible change,
4. coordinate through existing contracts,
5. never silently redesign another domain.

**Context ≠ ownership.**

---

# ENGINEERING RULES

1. **Inspect before coding.**
2. Reuse existing architecture/code before creating new systems.
3. Never create duplicate models, schemas, APIs, or pipelines without justification.
4. Prefer simple, explainable ML over unnecessary deep learning.
5. Never invent datasets or claim clinical validity without evidence.
6. Never present synthetic/test results as clinical results.
7. Handle uncertainty explicitly: `unknown`, `low confidence`, `insufficient data`.
8. Prioritize offline capability, privacy, latency, and mobile constraints.
9. Keep raw data, derived features, model outputs, and UI presentation separate.
10. AI outputs must have stable interfaces for the backend/mobile/dashboard.
11. Write tests for every important ML component.
12. Do not break existing functionality.
13. Do not modify unrelated domains.
14. If architecture is ambiguous, inspect first and ask only when genuinely necessary.
15. Before major changes, explain what you found and what you intend to change.

---

# WORKING MODE

For every task:

```text
UNDERSTAND
→ INSPECT
→ IDENTIFY EXISTING IMPLEMENTATION
→ CHECK DEPENDENCIES
→ IMPLEMENT AI/ML ONLY
→ TEST
→ INTEGRATE
→ REPORT
```

Always keep the **full MIRA product context in mind**, but keep actual coding focused on my **AI/ML responsibility**.

## PRIMARY OBJECTIVE

Build MIRA's intelligence loop:

> **Turn patient behavior into cognitive understanding, cognitive understanding into personalized intervention, intervention results into adaptation, and real-world visual information into an offline memory prosthetic.**

Do not merely build isolated ML models.

Build a **coherent, production-oriented AI/ML subsystem that fits the existing MIRA architecture.**
