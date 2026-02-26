# Proposal Writing Standards

---

## ABSOLUTE RULE: NO FABRICATION

**Never invent, assume, or infer any information not explicitly present in the source materials provided to you.**

Source materials are the solicitation documents, the proposal draft, and any context files. If information is not in those materials, it does not exist for purposes of this work.

**Prohibited — never do any of the following:**
- Name a specific tool unless that tool is explicitly named in the source materials
- Cite a metric, statistic, percentage, or number unless it appears in the source materials
- Reference a past contract, program, or customer not mentioned in the source materials
- Invent staff credentials, certifications, clearance levels, or qualifications
- Assume section numbers, SLA values, attachment references, or other document details
- Suggest a specific solution, technology, or approach in recommendations that has no grounding in the source materials

**When required information is missing, do this instead:**
1. Flag the absence as a specific weakness (e.g., "No tool named for X function — rewrite flag per PTP Framework §3.2")
2. Mark the gap with a bracket placeholder: `[TOOL NAME REQUIRED]`, `[METRIC REQUIRED]`, `[PROOF POINT REQUIRED]`
3. Use the Responsive Prompts in §5 to request the real information from the proposal author

**This rule has no exceptions.** A fabricated detail in a federal proposal is worse than a gap — it can disqualify the submission or create legal exposure for the offeror.

---

## 0 · Mission

Craft proposal text that **scores** and **complies** — clear, persuasive, evidence-backed, evaluator-focused.

---

## 1 · Global Principles

- Align every passage to RFP scoring and the Shipley lifecycle (Pre-RFP → Capture → Proposal).
- Lead with customer benefit; features serve the benefit.
- Balance **responsiveness** (answer the ask) with **compliance** (mirror RFP language).

---

## 2 · Voice & Style Framework

| Dimension | Rules |
|-----------|-------|
| **Language** | Grade-8 plain English · Active voice · Define acronyms once · Prefer verbs to noun forms ("train" not "provide training"). Use the Hemingway App or equivalent to verify readability. |
| **Tone** | Competent · Respectful · Curious · Trusted · Mission-driven · Good stewards. |
| **Sentence Craft** | Short, declarative; no jargon, clichés, gobbledygook, or hype. |
| **Length Control** | Paragraph ≤ 6 lines; theme call-out max every 300 words. |
| **Style Guides** | Follow GPO + Chicago Manual; avoid em-dashes unless cited. |
| **Text Format** | Times New Roman; 12pt. |

---

## 3 · Structural Moves

### 3.1 Section Opening

Every requirement response opens with this sequence:

1. **Outcome sentence** — answers "So what?" for the evaluator before explaining anything else.
2. **Use exact PWS/SOW terms** when referring to a subject — mirror the RFP language, do not paraphrase it.
3. **State "how," not just "what"** — do not restate the PWS requirement; explain your approach to delivering it.

### 3.2 People, Tools & Processes (PTP) Framework

Every requirement response must identify the three elements that deliver it:

| Element | Guidance |
|---------|----------|
| **People** | Name the roles or team structure responsible (e.g., "our DevOps Lead and two Site Reliability Engineers"). Reference staffing sections where applicable. |
| **Tools** | Call out tools **by name** — never say "monitoring tools" when you mean "Dynatrace and AWS CloudWatch." Tool names must appear alongside the process they support. |
| **Processes** | Name the specific process or methodology (e.g., "OIT Major Incident Management Process," "IaC-based environment lifecycle"). Reference SOPs, playbooks, or contract attachments by name. |

> **Rule:** If a named tool is omitted from a requirement response, that is a rewrite flag. Generic tool references ("industry-standard tools," "automated solutions") are not acceptable.

### 3.3 Stakeholder Targeting

- Map role cues to precise terms (program participants, external stakeholders, etc.).
- If role language is ambiguous, prompt: *"Clarify: VA Product Line staff or VA staff in regional offices?"*

---

## 4 · Quality Gates

Flag for rewrite when you detect any of the following. Each flag maps to the agent best positioned to catch it:

| Flag | Description | Primary Agent |
|------|-------------|---------------|
| **Unsubstantiated claim** | Assertion without a metric, reference, or proof point | Growth Strategist |
| **Vague/missing customer benefit** | Features described without explaining the benefit to the customer | Growth Strategist |
| **Missing compliance language** | RFP requirement addressed but RFP terms not mirrored | Compliance Reviewer |
| **Absent call-to-action / next step** | Section ends without a forward-looking statement or transition | Solution Architect |
| **Wordiness or passive overload** | Passive voice dominates; sentences exceed 30 words regularly | All agents |
| **Missing tool name** | Requirement response refers to tools generically (see PTP Framework §3.2) | Solution Architect / SME |

---

## 5 · Responsive Prompts

Use these when reviewing or writing:

- **Missing metric?** Ask: *"Provide a quantitative proof point for X."*
- **Stakeholder ambiguity?** Ask for role clarification before finalizing.
- **Undefined acronym?** Request definition before reuse.
- **Generic tool reference?** Ask: *"Which specific tool is used here? Name it."*

---

## 6 · Figures, Tables & Callout Boxes

- Use a figure or table when a concept requires more than one paragraph to explain in prose.
- Every figure and table must have a caption and be referenced in the body text before it appears.
- Callout boxes ("theme boxes," "discriminator boxes") reinforce win themes — use sparingly (max one per page) and ensure the callout restates a benefit, not a feature.
- Graphics must be legible at the submitted font size; avoid screenshots of dashboards unless resolution is sufficient.

---

## 7 · Past Performance Narratives

Past performance volumes follow a different voice than technical approach:

- Use the **STAR format**: Situation → Task → Action → Result.
- The **Result** must include a quantified outcome (cost savings, schedule improvement, CPAR rating, uptime %, etc.).
- Reference the contract number, customer agency, and period of performance in the header.
- Relevance mapping: explicitly state how the past work is relevant to the current SOW requirements — do not assume evaluators will infer it.
- Avoid first-person singular ("I"); use first-person plural ("We") or company name.

---

## Appendix A · Before/After Example

### Input (raw requirement notes)

```
● Managing Dev/Test/Pre-Prod/Prod using IaC
● Production Support (24x7) and Non-Prod Support (10x5)
● Monitoring for Availability (Level 1: Signs of Life Monitoring, Level 2: Infrastructure
  Monitoring (LGY Product Line and VA Enterprise Eco-System), Batch Jobs, and Cost Management
  (e.g., decomm obsolete/unused infrastructure, estimate recurring costs for infrastructure changes)
  ○ Dashboards tailored to audience
  ○ Application errors logged to VA enterprise Splunk
● Operational Incident and Problem Management
  ○ OIT Major Incident Management Process, VA Agile Center of Excellence Product Line
    Management Transformation Playbook for Level 3
  ○ Customer Care Tickets (Tiers 2 and 3)
  ○ Alerts from Monitoring
  ○ Discuss comms with product line stakeholders
  ○ Att K SLAs
  ○ RCAs for sev 1 and 2
● IaC for stand up/tear down in <= 5 business days
```

### Output (compliant proposal text)

**Environments:** Managing the Non-Production (Non-Prod) and Production (Prod) environments for all of the required Product Lines focuses on the real-time health and stability of the environments, especially Prod. Our staffing model (Section 1.2.2) enables support for Prod 24 hours per day, 7 days per week using **Pager Duty** for On-Call support. Non-Prod is supported 10 hours per day, 5 days per week with a rotating shift model leveraging our distributed team across U.S. time zones, ensuring required availability without overburdening any one team. We also maintain a bench of cleared personnel who can be activated during surge events.

Our DevOps teams will use "Infrastructure as Code" (IaC) to fully automate the lifecycle (creation, use, destruction) of on-demand environments for each of the Product Lines. We will leverage containers and other code-configurable components like **Docker** and **Salesforce Sandboxes** as the lightweight, portable units for all ephemeral components. By mandating IaC for all components, we eliminate configuration drift and adopt an immutable infrastructure model, replacing systems with new ones rather than patching them. This approach simplifies change management and reduces risk. During "Game Day" exercises (Section 1.2, Disaster Recovery), we will programmatically destroy and recreate components to safely test our monitoring capabilities and incident response procedures without impacting production. Our approach delivers consistent, compliant systems on-demand and within the required 5-day timeline.

**Monitoring:** All four levels of monitoring are provided using VA-approved tools for all Product Lines including interfaces, batch jobs, and dependencies on VA Enterprise Eco-System services — **CA monitoring tools, AWS CloudWatch, Salesforce SHIELD, Dynatrace, Jenkins, and GitLab**. We deliver Full Business Transaction Monitoring (Level 4) using **Dynatrace** integrated with the VA Enterprise Command Center (ECC) to provide stakeholders with transparent, actionable insights into system health. Our application logs are exported to **Splunk** using the **Splunk Universal Forwarding** tool.

**Operational Incident and Problem Management:** Given the criticality of the LGY systems, we formally document the Incident Management and Problem Management processes in the Operations Monthly Report to ensure continued alignment with the OIT Major Incident Management Process and the VA Agile Center of Excellence Product Line Management Transformation Playbook. We respond to and resolve Tier 2 and 3 tickets within SLAs (Attachment K) when routed via **VA Enterprise ServiceNow**.

Severity 1 and 2 tickets follow the Major Incident Management Process to ensure all appropriate stakeholders are engaged and informed through the correct communication channels. We convene a dedicated incident response team and establish a communication bridge for all key VA stakeholders, including the Contracting Officer's Representative (COR), Program Manager (PM), and relevant business line personnel. After service is fully restored, a comprehensive Root Cause Analysis (RCA) is performed for all Severity 1 and 2 incidents to determine preventive measures through updated procedures, automated response, improved monitoring alerts, enhanced automated testing, and self-healing. Our feedback loop — where solutions to problems lead to continuous improvement — reduces incidents over time.

**"Single Pane of Glass" Dashboard:** As part of our Open Kitchen Communication Model, we centralize monitoring into a unified "Single Pane of Glass" dashboard for transparent oversight that accelerates incident response and enables data-driven decisions. This dashboard provides a real-time view of performance, capacity, availability, and utilization with role-based views tailored for different stakeholders. We use KPIs from **ServiceNow** Incident and Problem tickets alongside monitoring systems to achieve the SLAs in Attachment K. By integrating AWS cost data with performance metrics, we identify opportunities for savings (e.g., decommission obsolete infrastructure, estimate recurring costs based on historical data). All dashboard and alert configurations are managed as code (IaC) for version control and consistency.

---

### Why This Output Scores Well

| Principle | Where It Appears |
|-----------|-----------------|
| **Outcome sentence leads** | Each sub-section opens with the benefit/result, not a restatement of the requirement |
| **PWS terms mirrored** | "Non-Production," "Production," "Tier 2 and 3," "Attachment K" — exact RFP language preserved |
| **Tools named explicitly** | Pager Duty, Docker, Salesforce Sandboxes, Dynatrace, Splunk Universal Forwarding, ServiceNow, Jenkins, GitLab |
| **PTP framework present** | Each sub-section identifies who does it (staffing model), what tool is used, and what process governs it |
| **Active voice** | "We deliver," "We eliminate," "We convene" — not "monitoring is provided" |
| **Quantified** | 24x7, 10x5, 5-day timeline, Severity 1 and 2 defined |

> **Note:** Tool names in this example are VA/LGY-program specific. On other programs, substitute the actual named tools your team will use — the requirement to name them explicitly still applies.
