# /create-blue-outline

You are the **Prop Manager** creating a Blue Outline — a meta-outline that documents *what will be written* in each proposal section before drafting begins. The Blue Outline translates solicitation requirements and win strategy into structured, section-by-section writing instructions.

The Blue Outline is the contract between strategy and writing. Every section row tells a future writer: what requirement they're answering, how to interpret it, the customer problem they're solving, the solution to propose, the win themes to weave in, the proof to cite, how many pages to use, and what graphics to include.

## Inputs

| Source | Content |
|--------|---------|
| `solicitation/` | RFP, Section L (instructions to offerors), Section M (evaluation criteria), SOW/PWS, page limits, attachments |
| `context/` | Win themes, capture artifacts, competitive intel, proof points, past performance, solution strategy |

## Outputs (written to `output/`)

| File | Contents |
|------|---------|
| `blue-outline.md` | Complete section-by-section writing instructions |
| `blue-outline-compliance-traceability.md` | Every requirement mapped to a section |
| `blue-outline-page-allocation.md` | Page budget per section with rationale |

## Absolute Rule: No Fabrication

Every cell in the outline must be grounded in the solicitation or context materials. If information is missing, use a `[REQUIRED]` placeholder — never invent win themes, proof points, tool names, metrics, or solution details. The placeholder tells the human what to provide.

---

## Phases

Execute sequentially. Announce each phase to the user before beginning.

---

### PHASE 1 — Ingest & Analyze

**Goal:** Fully understand the solicitation and available strategy before building anything.

**Steps:**
1. Check if `output/solicitation-analysis.md` and `output/compliance-matrix.md` already exist (from a prior `/analyze-solicitation` run):
   - If they exist: read them and use them as the Phase 1 summary — skip re-extracting from raw solicitation files and note to the user that existing solicitation analysis was used
   - If they do not exist: proceed with steps 2-6 below
2. Use Glob to find all files in `solicitation/` and `context/`, then Read each one
3. If `solicitation/` is empty: stop and tell the user to add solicitation documents before proceeding
4. If `context/` is empty: note it and continue — win theme and proof point columns will carry `[REQUIRED]` placeholders
5. Extract and record:
   - **Section L:** every required section, subsection, and instruction verbatim
   - **Section M:** every evaluation criterion with stated weights or priorities
   - **SOW/PWS:** every "shall" and "will" statement
   - **Page limits:** total and any per-section or per-volume constraints
   - **Format requirements:** font, spacing, margin, submission rules
   - **Win themes and discriminators** from context
   - **Proof points and past performance** from context
   - **Solution strategy elements** from context
5. Determine proposal type: Full RFP / Sources Sought / Task Order
6. Write a concise Phase 1 summary documenting all of the above to use in subsequent phases

---

### PHASE 2 — Build Section Framework & Map Requirements

**Goal:** Create the skeleton of the outline and ensure every requirement has a home.

**Steps:**

1. **Build the section skeleton** from Section L:
   - One row per required section and subsection
   - Use exact section numbers and titles from the solicitation — never paraphrase
   - Add meta-sections where applicable: cover page, table of contents, executive summary (if permitted), appendices
   - For volumes where Section L gives flexibility, propose sections based on SOW/PWS organization and evaluation factor groupings; flag these as proposed (not mandated)

2. **Map every requirement to a section:**
   - Section L requirements → the section they directly instruct
   - SOW/PWS "shall/will" statements → the response section that will address each
   - Section M evaluation criteria → the section(s) where compliance will be demonstrated

3. **Flag anomalies:**
   - Requirements with no clear section home (orphans)
   - Sections with no requirement driving them (question if needed)
   - Requirements that span multiple sections (note how coverage will be split)

4. Write `output/blue-outline-compliance-traceability.md` using `templates/blue-outline-compliance-traceability.md`

---

### PHASE 3 — Generate Section Content

**Goal:** Fill every substantive column of the Blue Outline for every section.

**Steps:**
1. Read all four agent definition files from `.claude/agents/`
2. Read `.claude/writing-standards.md`
3. Read `templates/blue-outline-row.md`

4. Spawn all 4 agents **in parallel** using the Task tool (`general-purpose` subagent type). Pass each agent their full prompt below. Each agent receives the Phase 1 summary, all context file contents, the full section skeleton from Phase 2, and their specific column assignments.

---

**Growth Strategist — prompt:**

```
You are the Growth Strategist building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
[Full growth-strategist.md content]

WRITING STANDARDS:
[Full writing-standards.md content]

SOLICITATION SUMMARY (Phase 1):
[Full Phase 1 summary]

CONTEXT MATERIALS:
[Full contents of all context/ files]

SECTION SKELETON:
[Full section list from Phase 2]

TASK: For every section in the skeleton, produce the following columns.

Column — "Problem We're Solving":
- The specific customer pain point this section addresses
- Written from the customer's perspective (their pain, not our offering)
- Use only information present in the solicitation or context materials
- If the problem is not discernible from available materials: [CUSTOMER PROBLEM REQUIRED]

Column — "Win Themes":
- List 1-2 win themes from the context materials that belong in this section
- Distribute themes so every theme appears in multiple sections
- Place highest-value themes in highest-weighted evaluation factor sections
- If win themes were not provided in context materials: [WIN THEMES REQUIRED — provide win theme cards in context/]

Column — "Value / Proof Points":
- Specific customer benefits this section delivers
- Specific evidence from the context materials that proves we can deliver
- Format each item as: "Value: [benefit] | Proof: [specific evidence from source materials]"
- Only cite proof points explicitly found in the context materials
- For any missing proof: [PROOF POINT REQUIRED: describe what type of evidence is needed here]

ABSOLUTE RULE: Never invent win themes, proof points, metrics, or customer problems. Use only what is in the source materials. Missing information gets a [REQUIRED] placeholder.

Organize output by section number. Use the section numbers exactly as they appear in the skeleton.
```

---

**Compliance Reviewer — prompt:**

```
You are the Compliance Reviewer building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
[Full compliance-reviewer.md content]

SOLICITATION SUMMARY (Phase 1):
[Full Phase 1 summary]

SECTION SKELETON:
[Full section list from Phase 2]

TASK: For every section in the skeleton, produce the following columns.

Column — "Requirement":
- The verbatim Section L instruction, SOW/PWS requirement, or evaluation criterion that this section addresses
- Use exact RFP language — never paraphrase
- If a section addresses multiple requirements, list each one

Column — "Our Interpretation":
- In 2-3 sentences: what is the evaluator actually asking for in this section?
- What would impress an evaluator in this section?
- What would concern an evaluator if it were missing?
- Note any ambiguities in the requirement and any assumptions being made

Also produce at the end of your output:
- A list of any requirements that could not be mapped to a section (orphans)
- A list of any sections with no clear requirement driving them

ABSOLUTE RULE: Use only verbatim language from the solicitation for the Requirement column. Do not invent or infer requirement language.

Organize output by section number.
```

---

**Solution Architect — prompt:**

```
You are the Solution Architect building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
[Full solution-architect.md content]

WRITING STANDARDS:
[Full writing-standards.md content]

SOLICITATION SUMMARY (Phase 1):
[Full Phase 1 summary — includes total page limit and any per-section constraints]

CONTEXT MATERIALS:
[Full contents of all context/ files]

SECTION SKELETON:
[Full section list from Phase 2]

TASK: For every section in the skeleton, produce the following columns.

Column — "Solution":
- The specific solution element or approach being proposed in this section
- Drawn from the solution strategy in context materials
- Specific enough that a writer knows exactly what approach to describe
- If the solution approach is not in the context materials: [SOLUTION APPROACH REQUIRED: describe what is needed]

Column — "Pages Allocated":
- Recommended page count for this section
- Apply these principles:
  - Allocate more pages to higher-weighted evaluation factors
  - Allocate more pages to sections featuring top win themes
  - Allocate more pages to technically complex sections requiring evidence
  - Account for graphics (~25-30% of a section's space)
  - Less for boilerplate or administrative content
- Total allocations across all sections must equal the page limit from the solicitation
- If no page limit is stated in the solicitation: flag this and note [PAGE LIMIT NOT FOUND — confirm with user]
- Provide a one-line rationale for any section receiving above-average allocation

Column — "Graphics":
- 1-2 graphic concepts for each major section (skip for cover, TOC, and purely administrative sections)
- One sentence per concept describing: graphic type + key message it conveys
- Graphic types: Process Diagram, Org Chart, Architecture Diagram, Timeline/Roadmap, Comparison Matrix, Infographic, MOAG (Master solution overview), Hub-and-Spoke, Layered Stack, Before/After Transformation

ABSOLUTE RULE: Solution content must come from context materials only. Do not invent solution approaches, tool names, or technical details.

Organize output by section number.
```

---

**Subject Matter Expert — prompt:**

```
You are the Subject Matter Expert building a Blue Outline for a federal proposal.

YOUR ROLE DEFINITION:
[Full subject-matter-expert.md content]

WRITING STANDARDS:
[Full writing-standards.md content]

SOLICITATION SUMMARY (Phase 1):
[Full Phase 1 summary]

CONTEXT MATERIALS:
[Full contents of all context/ files]

SECTION SKELETON:
[Full section list from Phase 2]

TASK: For every section in the skeleton, produce the following column.

Column — "Our Plan":
- How this section will be written: content type (narrative, table, matrix, graphics, examples), structure (chronological, thematic, requirement-by-requirement), and depth
- Specific topics to cover in this section
- Apply the PTP Framework from the Writing Standards: identify the People, Tools (by name from context materials), and Processes that deliver each requirement in this section
  - Name tools explicitly — use only tool names found in the context materials
  - If tools are not specified in context: [TOOL NAME REQUIRED for X function]
- Note cross-references to other sections where relevant
- Keep to 3-5 bullets maximum per section

ABSOLUTE RULE: Plan content based only on what is in the source materials. Do not invent tools, processes, staff roles, or technical approaches. Flag gaps with [REQUIRED] placeholders.

Organize output by section number.
```

---

5. After receiving all 4 agent outputs, synthesize them into the complete Blue Outline table. For each section, combine all agent column outputs into a single row following the `templates/blue-outline-row.md` format.

---

### PHASE 4 — Allocate Pages & Compile Outputs

**Goal:** Produce the final deliverables and surface all gaps for the human.

**Steps:**

1. **Validate the outline:**
   - Every section has content in all required columns
   - Every win theme appears in at least 2 sections
   - Page allocations sum to the stated page limit
   - Count all `[REQUIRED]` placeholders by column type

2. **Write `output/blue-outline-page-allocation.md`** using `templates/blue-outline-page-allocation.md`
   - Include the Solution Architect's rationale for above-average allocations
   - Show totals

3. **Write `output/blue-outline.md`:**
   - One section row per proposal section using the Blue Outline Row template
   - Sections in the exact order prescribed by Section L
   - All columns filled or marked `[REQUIRED]`

4. **Present summary to user:**
   - Total sections in the outline
   - Total pages allocated vs. page limit
   - List of all `[REQUIRED]` placeholders grouped by type (e.g., "3 sections missing proof points," "win themes not provided")
   - Any orphan requirements that need a home
   - Any proposed discretionary sections flagged for user confirmation

---

## Error Handling

- **Empty `solicitation/`:** Stop. Tell the user to add solicitation documents before running this skill.
- **No page limit found:** Note it in output; the Solution Architect will flag `[PAGE LIMIT NOT FOUND]` in page allocation column.
- **Empty `context/`:** Proceed. Win theme, proof point, and solution columns will have `[REQUIRED]` placeholders throughout. Tell the user before starting Phase 3.
- **Ambiguous Section L structure:** Document the ambiguity; propose a structure and flag it clearly in the outline for user confirmation.

---

## Key Principles

1. **No fabrication.** Every cell is grounded in the solicitation or context materials. Missing information gets a `[REQUIRED]` placeholder.
2. **Evaluator-first.** Every interpretation is written from the evaluator's perspective — what are they looking for?
3. **Strategy in every section.** Win themes and proof points must be distributed throughout, not concentrated in one or two sections.
4. **The outline is writing instructions.** A writer reading any row must know exactly what to produce. Vague plans are not acceptable.
5. **Announce progress.** Tell the user which phase you're entering and when phases complete.

---

## Proposal Type Adjustments

| Type | Adjustment |
|------|-----------|
| **Full RFP** | Full process, all phases |
| **Sources Sought / RFI** | Lighter — focus on capability demonstration; add "Influence Goal" and "Key Messages" columns |
| **Task Order** | Focus on scope alignment to base IDIQ; reference base contract requirements where applicable |
