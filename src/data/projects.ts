export type ProjectSlug = "cloudops" | "governed-rag" | "stadium-ops" | "legal-consistency" | "utsavpilot";

interface Project {
  slug: ProjectSlug;
  name: string;
  category: string;
  summary: string;
  status: string;
  stack: readonly string[];
  steps: readonly [string, string, string, string];
  problem: string;
  architecture: string;
  decisions: readonly string[];
  contribution: string;
  testing: string;
  outcome: string;
  boundaries: string;
  repo: string;
  commit: string;
  evidence: readonly [string, string][];
  demo?: string;
}

const github = "https://github.com/SamikshitSharma";

export const projects: readonly Project[] = [
  {
    slug: "cloudops",
    name: "CloudOps Autopilot",
    category: "Infrastructure automation",
    summary: "Evaluates Azure resource changes, records the policy decision, and pauses a governed workflow for operator approval.",
    status: "Prototype",
    stack: ["Python", "FastAPI", "SQLAlchemy", "Azure SDK", "MCP", "React"],
    steps: ["Inventory & telemetry", "Policy & action plan", "Approval & execution", "Verify & audit"],
    problem: "Cloud cost recommendations need an operational decision before a resize, stop or disk removal can proceed. The prototype gives an operator a way to identify candidates, see the reasoning behind a plan and review a proposed change before execution.",
    architecture: "FastAPI exposes run status and approval endpoints to a React operator console. The Python workflow coordinator drives inventory, analysis, planning, approval, execution and verification. An async event bus feeds persistence and audit records through SQLAlchemy. MCP tools call Azure or simulated adapters through a shared interface.",
    decisions: [
      "Persist workflow and step state so the operator can inspect a paused run and resume the same plan after a decision.",
      "Separate recommendations from actions and check approval for governed execution. A mock adapter provides a repeatable path for exercising the workflow and failure cases.",
    ],
    contribution: "I implemented the coordination and operator workflows, including recommendation actions, evidence state and workflow-aware assistant retrieval. The linked coordinator and recent release commits show those changes.",
    testing: "Seven workflow tests passed with pytest, covering event delivery, queue behavior, retry rules, run state and approval blocking. The collaboration and Azure SDK mock suites were reviewed separately. Live Azure execution was outside this run.",
    outcome: "The prototype exposes a complete simulated path from inventory to approval, action and verification, with a reviewable record of the run.",
    boundaries: "The reviewed approval workflow uses simulated resources. Live tenant changes, savings, ongoing hosting and operational adoption remain unverified.",
    repo: github + "/cloudops-autopilot",
    commit: "9437c3fce3066529764a27dd51110cbdde143c38",
    evidence: [
      ["Workflow coordinator", "backend/app/workflow/coordinator.py"],
      ["MCP tool implementation", "mcp_server/server.py"],
      ["Approval and conflict tests", "tests/test_collaboration.py"],
      ["Azure adapter tests", "tests/test_live_adapter.py"],
    ],
  },
  {
    slug: "governed-rag",
    name: "Governed Enterprise RAG",
    category: "Applied AI & retrieval",
    summary: "Filters document retrieval by role, checks supporting evidence and records why each query was answered or refused.",
    status: "Repository project",
    stack: ["Python", "FastAPI", "ChromaDB", "Next.js", "Docker", "Azure Bicep"],
    steps: ["Ingest & tag documents", "Retrieve authorized evidence", "Gate & grade the answer", "Stream & audit"],
    problem: "Enterprise document search needs to respect access boundaries and give users a reason when evidence is insufficient. This project applies authority rules before generation and evaluates a proposed answer against its retrieved sources.",
    architecture: "The Python ingestion pipeline chunks documents and stores embeddings and authority metadata in ChromaDB. The query pipeline retrieves authorized candidates, evaluates a governance decision and generates eligible answers. FastAPI streams progress and the final result to a Next.js frontend. Source traces and an audit record preserve retrieval and decision context.",
    decisions: [
      "Filter by allowed document authority before the model receives context. A pre-generation gate can refuse requests with insufficient access or evidence.",
      "Check generated answers for faithfulness separately and include trust and faithfulness signals in the audit trail to explain the decision.",
    ],
    contribution: "I built the retrieval and governance pipeline, the streaming API and the frontend workflow. My repository history also records the public sample-corpus release and the Azure recovery notes.",
    testing: "Four offline checks of the governance gate passed with synthetic fixtures, covering authorized evidence, out-of-scope candidates, missing evidence and low confidence. The repository also defines four HTTP smoke scenarios. The HTTP checks need a running retrieval stack and provider, which were outside this run.",
    outcome: "The repository demonstrates an auditable answer-or-refuse flow and includes a synthetic sample corpus, interface evidence and deployment templates.",
    boundaries: "The browser selects a role and sends it with the query. Authentication and production identity binding remain unverified, as does a currently running Azure deployment.",
    repo: github + "/Governed-RAG-System",
    commit: "67a50d8d020109650cc5f10ea37569f67f0f9d33",
    evidence: [
      ["Retrieval and authority filtering", "vector_store.py"],
      ["Query and governance decisions", "query.py"],
      ["Streaming API", "api/main.py"],
      ["HTTP answer and refusal scenarios", "runtime_http_verify.py"],
    ],
  },
  {
    slug: "stadium-ops",
    name: "Stadium Ops Reasoning Console",
    category: "Operational decision support",
    summary: "Turns sample or CSV venue signals into ranked recommendations and reconciles them against deterministic zone rules.",
    status: "Challenge build · Public demo",
    stack: ["TypeScript", "Next.js", "React", "Groq", "Vitest"],
    steps: ["Load zone signals", "Classify threshold status", "Request recommendations", "Reconcile & rank"],
    problem: "A tournament operations team may need to interpret density, gate throughput and incident reports under time pressure. The console brings those signals and relevant playbook context into one reviewable recommendation queue.",
    architecture: "A Next.js dashboard ingests sample data or validates uploaded CSV rows. The analysis route combines normalized zone readings with playbook context and queries Groq. The server validates the response, deduplicates recommendations by zone, applies deterministic severity and fills coverage gaps before ranking.",
    decisions: [
      "Treat measured zone status as authoritative for severity so a model response cannot downgrade a red zone.",
      "Add a deterministic monitoring recommendation when the model omits a flagged zone. Distinguish provider rate limits from other downstream failures.",
    ],
    contribution: "I built the console and analysis workflow. The repository history records my server-side severity reconciliation, coverage guarantee and separate handling for provider rate limits.",
    testing: "All 27 tests across 4 Vitest files passed at the reviewed revision. Those checks cover CSV validation, threshold classification, response handling and deterministic coverage with a mocked provider.",
    outcome: "The challenge demo supports loading venue scenarios and reviewing ranked, explainable suggestions. Hack2skill recorded a PromptWars Challenge 4 result.",
    boundaries: "The public demo analyzes samples and uploads. Live venue integrations, real-world operational use and performance of the hosted model remain unverified.",
    repo: github + "/stadium-ops-reasoning-console",
    commit: "704138857a71594a8e4c0a1a7ea9b33dd34cf6a5",
    evidence: [
      ["CSV ingestion", "lib/csv.ts"],
      ["Analysis and reconciliation route", "app/api/analyze/route.ts"],
      ["Threshold rules", "lib/thresholds.ts"],
      ["Coverage and provider-error tests", "tests/hardening_api.test.ts"],
    ],
    demo: "https://stadium-ops-reasoning-console.vercel.app/",
  },
  {
    slug: "legal-consistency",
    name: "Legal Consistency & Change Intelligence",
    category: "Document comparison",
    summary: "Compares two agreements, checks citations against source clauses and surfaces uncertain findings for human review.",
    status: "Challenge build · Public demo",
    stack: ["TypeScript", "Next.js", "React", "Gemini", "Vitest"],
    steps: ["Extract & segment", "Index and match clauses", "Compare candidate provisions", "Verify citations & evidence"],
    problem: "Reviewers comparing agreements need to see which provisions changed, what evidence supports each finding and where the relationship is uncertain. The application compares exactly two documents and leaves the evidence visible for a qualified reviewer.",
    architecture: "The server extracts text, assigns stable clause IDs and builds an inverted index to find plausible counterparts. Gemini receives structured comparison context. A server-side pipeline checks the output schema, citation existence and relationship-specific evidence, and adds security flags and a server-controlled disclaimer.",
    decisions: [
      "Supply candidate clause pairs to focus semantic comparison, then validate citations and evidence against the original clause store before publication.",
      "Keep uncertainty in the report and check conditions for claims of removal. Separate reusable cached reports by session and analysis inputs.",
    ],
    contribution: "I implemented the analysis service and evidence validation and hardened error handling. The repository records my test and verification work on source grounding and acceptance cases.",
    testing: "93 tests passed across 23 Vitest files in the reviewed subset. It covers clause segmentation, counterpart indexing, schema validation, citation rejection, cache behavior and adversarial fixtures. The production end-to-end and browser acceptance suites were excluded.",
    outcome: "The challenge demo produces a structured comparison with findings, obligations, supporting citations and questions for follow-up. Hack2skill recorded a PromptWars result for the legal assistance challenge.",
    boundaries: "The workspace supports comparison of two English-language agreements and is not legal advice. Hosted model behavior and accuracy on real agreements remain unverified.",
    repo: github + "/legal-consistency-intelligence",
    commit: "a18f508d7688780ad048be7176b3e65f065b8b0c",
    evidence: [
      ["Analysis service", "src/services/analysis-service.ts"],
      ["Counterpart index", "src/counterpart-index/indexer.ts"],
      ["Server-side validation pipeline", "src/validation/pipeline.ts"],
      ["Citation rejection tests", "test/validation/citation.test.ts"],
    ],
    demo: "https://legal-consistency-intelligence.vercel.app/",
  },
  {
    slug: "utsavpilot",
    name: "UtsavPilot",
    category: "Event planning & constraints",
    summary: "Previews how changes to dates, guest counts, capacity or budget affect an event plan before the organizer applies them.",
    status: "Challenge build · Public demo",
    stack: ["TypeScript", "Next.js", "React", "Zod", "Gemini", "Vitest"],
    steps: ["Propose a plan change", "Recalculate budget & dates", "Check configured constraints", "Review and apply the patch"],
    problem: "Changing a guest count, budget or event date can affect vendor costs, deadlines and venue capacity at the same time. The planner makes those dependencies visible before an organizer changes the saved event.",
    architecture: "React manages event, vendor and schedule state, with browser storage and plan import/export. The TypeScript ripple engine creates an impact report and proposed patch. Next.js API routes call Gemini for advisory suggestions, validate output with Zod and label deterministic simulation responses separately.",
    decisions: [
      "Use integer minor currency units for arithmetic and keep capacity and deadline rules in deterministic code.",
      "Keep changes in a reviewable patch until the organizer accepts them. Label provider provenance and use bounded retries and a simulation fallback for provider errors.",
    ],
    contribution: "I built the simulation and budget flow, then refined the ripple drawer and fixed proposal persistence, active-event tracking and storage-error handling.",
    testing: "All 99 tests across 10 Vitest files passed at the reviewed revision. Tests exercise ripple calculations, currency arithmetic, schema and import/export, patch persistence, API rate limiting and provider fault handling with mocked responses.",
    outcome: "The public challenge demo supports planning across event archetypes and review of a proposed change before saved state is updated. Hack2skill recorded a PromptWars Challenge 5 result.",
    boundaries: "Capacity checks use organizer-supplied limits and provide planning assistance only. Regulatory approval, vendor pricing and live hosted-provider behavior remain unverified.",
    repo: github + "/utsav-pilot",
    commit: "5e38557884af1a65e9f8056cbd12c306ab2e27e1",
    evidence: [
      ["Event Ripple Engine", "src/lib/ripple-engine.ts"],
      ["Integer budget arithmetic", "src/lib/budget-math.ts"],
      ["Review interface", "src/components/RippleDrawer.tsx"],
      ["Provider provenance and fallback tests", "tests/ai-provenance-and-fallback.test.ts"],
    ],
    demo: "https://utsav-pilot.vercel.app/",
  },
];
