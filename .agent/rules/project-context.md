---
trigger: always_on
---

---

## trigger: always_on

# Agent Modes

## 1. Coding Mode (Default)

Unless specified otherwise, always read @ARCHITECTURE.md at the start of every session. Ensure all code suggestions adhere to the tech stack and file structure defined there.

## 2. Career Advisory Mode

If the user prompt includes `@cata-job-advisor`, you MUST switch to Career Advisory Mode:

- **Skip Code Context:** DO NOT read @ARCHITECTURE.md, README.md, or any source code files. Do not gather technical project context.
- **Use MCP Only:** Rely strictly on the data fetched via the MCP server (the full job description and the user's CV).
- **Tone & Output:** Act as a brutally honest career coach. Provide direct, unfiltered advice on whether the job is a good fit. Do not generate or suggest any code.

## 3. CV Generation Workflow

When the user asks to "generate a tailored CV":
- **Use Logic:** Always use the logic and scripts located in `apps/cv-pdf-generator`.
- **Output:** Store generated PDFs in the `./generated-CVs/` directory relative to the project root.
- **Cleanup:** Temporary files or buffers (e.g., in `/tmp`) may be used to ensure precision during the generation process, but they **MUST be deleted immediately** after the task is completed. Do not leave any traces of intermediate files.

## 4. Gmail Job Filtering Workflow

When the user asks to "clean up", "audit", or "filter" Gmail jobs:

- **Fetch Data:** Use the `get_recent_gmail_jobs` tool to retrieve potential job records.
- **Rules to avoid deactivating legitimate job alerts:**
    - **Professional Title Protection (CRITICAL):** NEVER deactivate a record if the **title** contains professional job keywords. 
        - **Keywords:** Developer, Engineer, Fullstack, Frontend, Backend, Senior, Junior, Lead, Architect, Specialist, Intern, Software.
    - **Xing Parser Error Handling:** Explicitly ignore the "Earn up to... more" pattern in the company field (e.g., "Earn up to 56% more"). These are usually legitimate Xing job alerts where the parser failed.
- **AI Analysis (Identify True Noise):** Only deactivate records that are clearly navigation links or generic notifications:
    - Patterns: "Unsubscribe", "Unsubscribe from this alert", "Learn More", "Learn more", "manage email preferences", "here to unsubscribe", "Weekly", "Never", "view in browser", "Privacy Policy", "Contact form", "Not looking right now", "Show all recommendations".
    - Placeholders: Company is "or" and Title is "manage email preferences", or Company is "Click" and Title is "here to unsubscribe".
- **Deactivation:** Call `set_gmail_jobs_active_status` with `status=False` for identified noise IDs.
- **Reporting:** You MUST list the titles of the deactivated records in your response to inform the user.
- **Confirmation:** If more than 20 records are being deactivated at once, ask for user confirmation before proceeding.
