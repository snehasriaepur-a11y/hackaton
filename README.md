# CTEM — Clinical Trial Eligibility Matcher

**Statement ID:** PNH2 · **Theme:** HealthTech, MedAI and Diagnostics

A deterministic, explainable system that matches de-identified patient records against dense clinical trial
protocols. Every verdict resolves to a protocol clause, a named record field, and the literal comparison that
produced it — with missing evidence surfaced as an explicit request rather than a silent failure.

---

## Run it

One command from the project root starts both services:

```bash
npm run install:all   # first time only
npm run dev
```

| Service | URL |
| --- | --- |
| Application | http://localhost:3000 |
| API | http://localhost:5000/api/health |

`npm run dev` starts the engine and the web app together via `concurrently`. Output is prefixed `[api]` and
`[web]`. If port 5000 is occupied the engine automatically increments to 5001–5005, and the frontend probes for
the live port on first request.

**Run the two separately** (if you prefer separate terminals):

```bash
# terminal 1
npm run dev:api        # → http://localhost:5000

# terminal 2
npm run dev:web        # → http://localhost:3000
```

**Verify the engine logic without starting anything:**

```bash
npm run verify
```

Prints the full 6×5 status matrix, a criterion-level trace for one pair, and the gold-set metrics.

---

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Product overview, pipeline, adversarial resilience narrative |
| `/workspace` | Screen a subject against all protocols with criterion-level trace |
| `/protocols` | Protocol registry — clauses, weights, evidence ledger |
| `/cohort` | De-identified subjects with clinical notes and parse findings |
| `/evaluation` | Gold-set metrics, robustness profile, decision log |
| `/architecture` | SRS, data flow, decision logic, roadmap |

---

## The problem this solves

A naive substring matcher produces confidently wrong answers on real clinical records. Six concrete failure
modes are handled explicitly, each with a named defence:

| Failure | Symptom in a naive matcher | Defence |
| --- | --- | --- |
| Substring negation | `"Non-Small Cell Lung Cancer".includes("Small Cell")` → `true` | Negation-aware phrase matching with boundary and prefix guards |
| Absolute vs normalised labs | `32 U/L > 3` excludes a patient sitting at 0.8 × ULN | ULN-normalised values derived from a reference table, never hand-entered |
| Absent ≠ negative | `[]` read as "no data" rather than "no exposure" | Field-presence tracked separately from field-emptiness |
| Class vs instance therapy | `includes("Checkpoint Inhibitor")` fails on `"Pembrolizumab"` | Therapy classes expanded from agent names before evaluation |
| Stale but present | A report exists but predates the evidence window | Every requirement carries a validity window; age computed against last visit |
| Silent hallucination | A justification no one can trace to the chart | Decision path is fully extractive — no generation occurs |

---

## Architecture

```
Source systems          FHIR/HL7 · consultation notes · imaging · lab feeds
        │
De-identification       token substitution · date shifting · subject keys
        │
Ingest & parse          schema normalisation · lab extraction · negation · temporal scan
        │
Integrity gate          abbreviation ambiguity · duplicate dates · code/narrative conflict
        │
Criterion evaluation    negation-aware matching · ULN derivation · therapy class expansion
        │
Evidence ledger         presence · currency against window · blocking vs advisory
        │
Verdict                 eligible · evidence_gap · borderline · needs_adjudication · ineligible
        │
Audit + adjudication    immutable log · reviewer sign-off · re-evaluate on new evidence
```

### Verdict precedence

1. Any exclusion triggered → `ineligible`
2. Any inclusion with weight ≥ 0.9 fails → `ineligible` (protocol-defining; no further workup indicated)
3. Any blocking evidence outstanding → `evidence_gap` + itemised request
4. All inclusion resolved and weighted rate ≥ 85% → `eligible`
5. Weighted rate ≥ 50% with indeterminates → `borderline`
6. Eligible but high-severity integrity findings → `needs_adjudication`

Ordering matters clinically: a subject with a wrong diagnosis is not sent for BRCA testing.

---

## Layout

```
.
├── backend/
│   ├── src/
│   │   ├── index.js              Express app, routes, port fallback
│   │   ├── data/
│   │   │   ├── patients.js       6 synthetic subjects with deliberate record defects
│   │   │   └── trials.js         5 protocols as structured criterion sets
│   │   └── engine/
│   │       ├── matchingEngine.js criterion evaluator, evidence ledger, integrity gate
│   │       ├── nlp.js            note parsing, negation, abbreviation, temporal checks
│   │       └── evaluation.js     gold set, confusion matrix, robustness profile, audit log
│   └── verify.js                 self-exiting logic harness
├── frontend/
│   ├── src/app/                  landing, workspace, protocols, cohort, evaluation, architecture
│   ├── src/components/           AppShell, HeroCanvas (WebGL), MatchLattice, ui primitives
│   └── src/lib/                  api client with port discovery, formatters
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service status |
| `GET` | `/api/patients` | List subjects |
| `GET` | `/api/patients/:id` | Subject with parse findings |
| `POST` | `/api/patients` | Create subject |
| `GET` | `/api/trials` | List protocols |
| `GET` | `/api/trials/:id/patients` | Rank every subject against one protocol |
| `POST` | `/api/match` | Evaluate one subject/protocol pair |
| `POST` | `/api/match/rank` | Rank all protocols for one subject |
| `POST` | `/api/criteria/:id/explain` | Provenance trace for a single clause |
| `GET` | `/api/evidence/:patientId/:trialId` | Evidence ledger split by state |
| `GET` | `/api/evaluation/metrics` | Precision, recall, F1, FPR, confusion |
| `GET` | `/api/evaluation/robustness` | Adversarial scenario coverage |
| `GET` | `/api/evaluation/audit` | Decision log |
| `POST` | `/api/evaluation/adjudicate` | Record reviewer sign-off |
| `GET` | `/api/overview` | Aggregate counters |

---

## Safety and privacy

- Synthetic de-identified records only. No PHI in this environment.
- No generated text in the decision path — justifications are extractive and quote source fields.
- Unresolvable criteria return `indeterminate` rather than a guessed value.
- Contradictory records escalate to human adjudication instead of self-resolving.
- Deterministic: same inputs produce the same verdict. No sampling, no external model call.

---

## Deployment

Frontend is a static Next.js build — deploy to Vercel with the repository root set to `frontend`:

```bash
cd frontend && npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` to the deployed API origin.

API is a standard Node/Express app. Containerised:

```bash
docker compose up --build     # frontend :3000, backend :5000
```