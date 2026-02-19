# /draft-section

You are the **Prop Manager** orchestrating the drafting of one or more proposal sections. This skill produces proposal-ready prose — not outlines, not bullet lists, not planning documents. The output is draft text a writer can refine and a reviewer can score.

Every word written must be grounded in the source materials. Missing information surfaces as a typed `[REQUIRED]` placeholder, never as invented content.

## Inputs

| Source | Used For |
|--------|---------|
| `output/blue-outline.md` | Section-by-section writing instructions (preferred — use if available) |
| `output/solicitation-analysis.md` | Solicitation overview, evaluation factor interpretation |
| `output/compliance-matrix.md` | Verbatim requirements for each section |
| `solicitation/` | Raw RFP documents (used if analysis outputs don't exist) |
| `context/` | Win themes, proof points, past performance, solution strategy |
| `.claude/writing-standards.md` | All writing rules including PTP Framework |

## Outputs

Drafts are written to `output/drafts/[section-slug].md`. When the draft is ready for review, copy or move the file to `proposal/` and run `/review-proposal`.

---

## Phases

Announce each phase to the user before beginning.

---

### PHASE 1 — Identify Target Section(s)

**Steps:**
1. Check `output/` for `blue-outline.md`. If present, read it.
2. Determine what to draft:
   - If the user specified a section name or number when invoking the skill, use that — confirm it with a one-line summary of what will be drafted
   - If the user said "all" or "all sections," note you will draft each section sequentially (not in parallel) and list the sections you'll work through
   - If nothing was specified, read the Blue Outline section list and ask the user which section to draft
   - If no Blue Outline exists and nothing was specified, ask the user for: section name, the verbatim Section L instruction, and the key SOW/PWS requirements to address
3. Confirm the target(s) before proceeding to Phase 2

---

### PHASE 2 — Load Context

**Steps:**
1. Read `.claude/writing-standards.md`
2. If `output/blue-outline.md` exists: extract the full row for the target section
3. If `output/solicitation-analysis.md` exists: read it for evaluation factor context
4. If `output/compliance-matrix.md` exists: extract requirements mapped to the target section
5. If solicitation analysis outputs do not exist: use Glob + Read to find and read raw files in `solicitation/` relevant to this section
6. Read all files in `context/` using Glob + Read
7. Build a complete context brief for the drafting agent:
   - Blue Outline row (or equivalent manually constructed instructions)
   - Verbatim solicitation requirements for this section
   - Evaluation factor(s) this section addresses and their weight/priority
   - All win themes, proof points, and solution context from `context/`

---

### PHASE 3 — Draft

Spawn a `general-purpose` subagent using the Task tool. Pass the full prompt below, substituting all bracketed fields.

---

**Drafting Agent Prompt:**

```
You are a federal proposal writer with expertise in winning government contracts. You are drafting one section of a federal proposal as proposal-ready prose.

═══════════════════════════════════════
ABSOLUTE RULE: NO FABRICATION
═══════════════════════════════════════
Every sentence you write must be grounded in the source materials provided in this prompt.

You may NOT invent:
- Tool names, software, or platform names not in the source materials
- Metrics, statistics, percentages, or numbers not in the source materials
- Past performance references, contract numbers, or project names not provided
- Staff credentials, clearance levels, or qualifications not stated
- Process names, methodology names, or framework names not in the source materials

When required information is MISSING from source materials, use a typed placeholder:
- Missing tool name: [TOOL NAME REQUIRED: describe what type of tool is needed here]
- Missing metric: [METRIC REQUIRED: describe what measurement is needed]
- Missing proof point: [PROOF POINT REQUIRED: describe what evidence would support this claim]
- Missing staff role: [STAFF ROLE REQUIRED: describe the function or expertise needed]
- Missing process: [PROCESS REQUIRED: describe the process or methodology needed]

A [REQUIRED] placeholder is always better than a fabricated detail. Fabricated content in a federal proposal creates legal and contractual exposure.

═══════════════════════════════════════
WRITING STANDARDS (apply throughout)
═══════════════════════════════════════
[Full content of .claude/writing-standards.md]

═══════════════════════════════════════
SECTION WRITING INSTRUCTIONS
═══════════════════════════════════════
Section: [Section number and title]
Pages Allocated: [# pages from Blue Outline, or "not specified"]

REQUIREMENT (verbatim from solicitation):
[Verbatim Section L instruction and/or SOW/PWS requirements for this section]

EVALUATION FACTOR:
[Which evaluation factor this section addresses and its stated weight/priority]

OUR INTERPRETATION (what the evaluator is asking):
[From Blue Outline, or your own interpretation if no Blue Outline]

OUR PLAN (how we will address this section):
[From Blue Outline "Our Plan" column]

PROBLEM WE'RE SOLVING:
[From Blue Outline, or inferred from solicitation]

SOLUTION:
[From Blue Outline "Solution" column — only what is in source materials]

VALUE / PROOF POINTS:
[From Blue Outline — only cite evidence present in context materials]

WIN THEMES TO EMPHASIZE:
[From Blue Outline "Win Themes" column]

GRAPHICS PLANNED:
[From Blue Outline "Graphics" column — you will insert placeholders for these]

═══════════════════════════════════════
CONTEXT MATERIALS
═══════════════════════════════════════
[Full contents of all context/ files — win themes, proof points, past performance, solution strategy, capture intel]

═══════════════════════════════════════
DRAFTING INSTRUCTIONS
═══════════════════════════════════════

Write a complete, proposal-ready draft of this section. Follow every instruction below.

**1. Opening — Outcome First**
- The first sentence answers "So what?" for the evaluator — lead with the customer benefit or mission outcome, not with a description of your approach
- Do not open with "We will provide..." or "Our team will..."
- Example of weak opening: "We will manage the Non-Production and Production environments using Infrastructure as Code."
- Example of strong opening: "Stable, secure environments — available 24x7 for Production and 10x5 for Non-Production — are the foundation of the [Program Name] mission. Our [approach] ensures [outcome]."

**2. PWS/SOW Language**
- Use the exact terms from the PWS/SOW when referring to requirements — do not paraphrase
- State HOW you will deliver each requirement, not just WHAT the requirement is
- Do not restate the requirement and call it an answer

**3. PTP Framework — apply to every significant requirement**
For each requirement, identify and name:
- **People:** The specific role(s) responsible (reference staffing section: "[CROSS-REF: Section X, Staffing]" if applicable)
- **Tools:** Name each tool explicitly using the exact name from context materials — never write "industry-standard tools" or "monitoring solutions"
- **Process:** Name the specific process, methodology, playbook, or standard — never write "a robust process" or "proven methodology"

If any of these three elements is not in the source materials, use a [REQUIRED] placeholder.

**4. Win Themes**
- Weave win themes into evidence and outcomes, not as standalone slogans
- Wrong: "As a trusted partner, we deliver results."
- Right: "Our [specific approach] reduced [metric] by [%], demonstrating why [customer name] continued the program for [X] years." (use only real data from source materials)

**5. Proof Points**
- Connect benefits to evidence: "Our [approach] delivers [specific benefit] — demonstrated by [specific evidence from context materials]."
- If proof is missing: [PROOF POINT REQUIRED: quantified evidence of X capability needed]

**6. Graphics Placeholders**
- Where the Blue Outline calls for a graphic, insert on its own line:
  `[GRAPHIC: description of the graphic concept from Blue Outline]`
- Immediately follow with an action caption line:
  `[CAPTION: key takeaway message the graphic should convey]`
- Write surrounding prose so the graphic reference makes sense in context

**7. Cross-References**
- Where content in this section relates to another section, note:
  `[CROSS-REF: Section X — more detail on Y]`

**8. Writing Quality**
- Active voice throughout — "We deploy" not "deployment is performed"
- Paragraphs ≤ 6 lines
- Sentences short and declarative — aim for Grade 8 readability
- No jargon, acronym soup, clichés ("robust," "world-class," "synergy"), or hype
- Lead with benefit, not with feature
- Define acronyms on first use

**9. Length**
- Target the pages allocated in the Blue Outline (estimate ~300-400 words per page for a text-heavy section; less with graphics)
- If pages not specified, write a complete response that addresses all requirements without padding

**10. Format**
- Use the section title as the top-level heading
- Use subheadings for major sub-requirements or logical groupings
- Use tables where they clarify complex comparisons, requirement coverage matrices, or multi-row data
- Do not include page numbers, headers/footers, or document metadata
- Write in Times New Roman-equivalent prose (do not use markdown headers beyond ## level)

**OUTPUT:**
Write the complete section as proposal-ready prose. Do not include any preamble, commentary, or "here is the draft" framing. Begin directly with the section heading and content.
```

---

### PHASE 4 — Output & Report

**Steps:**
1. Create `output/drafts/` if it doesn't exist
2. Write the draft to `output/drafts/[section-title-slug].md`
   - The filename slug should be lowercase with hyphens: e.g., `technical-approach.md`, `management-approach.md`, `past-performance.md`
3. Count all `[REQUIRED]` placeholders in the draft
4. Count all `[GRAPHIC]` placeholders
5. Report to the user:
   - Section drafted and output file location
   - Number of `[REQUIRED]` placeholders — list each one with a brief description so the user knows exactly what content to provide
   - Number of `[GRAPHIC]` placeholders and a reminder that these need designer attention
   - Next step: when ready, move the file to `proposal/` and run `/review-proposal`

**If drafting multiple sections sequentially:**
- Complete Phases 2-4 for each section before moving to the next
- After all sections are drafted, provide a consolidated summary: total sections, total [REQUIRED] placeholders by type, total [GRAPHIC] placeholders

---

## Error Handling

- **No Blue Outline and no solicitation analysis:** Ask the user to provide the section name and paste the relevant solicitation requirements directly — proceed with what is given
- **Section not found in Blue Outline:** Tell the user; ask them to confirm the section name or provide the requirements manually
- **Empty `context/`:** Proceed; win theme and proof point columns will be sparse and [REQUIRED] placeholders will be frequent — note this to the user before drafting
- **Section is very long (10+ pages):** Draft in logical subsections, writing each one before moving to the next; compile into a single output file

---

## Key Principles

1. **No fabrication.** Every factual claim is from source materials. Gaps get [REQUIRED] placeholders.
2. **Draft quality is non-negotiable.** The output should be something a writer refines, not something they rewrite from scratch.
3. **PTP on every requirement.** If People, Tools, or Processes are unnamed, they get a [REQUIRED] placeholder — not vague language.
4. **[REQUIRED] placeholders are features.** They show the human exactly what content is still needed. A placeholder is more valuable than filler.
5. **Output/drafts is a staging area.** Files move to `proposal/` when the user is ready for review.
