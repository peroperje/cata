---
description: How to correctly generate tailored CVs and Cover Letters
---

# CV Generation Workflow

This workflow ensures compliance with the rules defined in `project-context.md`.

## Prerequisites
- Target company name, job title, and `job_application_id`.
- Content for CV and Cover Letter (text files).

## Steps

1. **Prepare Content**:
   Prepare the markdown-compatible text content for the CV and Cover Letter in `/tmp/`.

2. **Run Generator**:
   Use the Python script located at `apps/cv-pdf-generator/generator.py`.
   
   **CRITICAL**: You MUST set `--output_dir ./generated-CVs` to ensure files are stored in the project root as per project rules.

   ```bash
   # Example for CV
   ./apps/cv-pdf-generator/venv/bin/python3 ./apps/cv-pdf-generator/generator.py \
     --content_file /tmp/your_cv.txt \
     --type cv \
     --company "Company Name" \
     --job_title "Job Title" \
     --job_id "ID" \
     --output_dir ./generated-CVs
   ```

3. **Cleanup**:
   Immediately delete the temporary files in `/tmp/`.

4. **Verification**:
   Confirm the files exist in `./generated-CVs/[Safe_Name]`.
