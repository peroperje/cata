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


