import argparse
import os
import sys
from fpdf import FPDF
from pathlib import Path

class CVLetterPDF(FPDF):
    def footer(self):
        # Position at 1.5 cm from bottom
        self.set_y(-15)
        # Arial italic 8
        self.set_font("helvetica", "I", 8)
        # Page number
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

def create_pdf(content: str, output_path: str):
    """
    Creates a clean, ATS-friendly PDF from text content.
    """
    pdf = CVLetterPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Set default font
    pdf.set_font("helvetica", size=11)
    
    # Replace common unicode characters that helvetica cannot encode
    content = content.replace("–", "-").replace("—", "-").replace("’", "'").replace("‘", "'")
    
    # Basic text parsing to handle bolding or headers if needed
    # For now, we rely on standard multi_cell rendering of the raw text
    for line in content.split('\n'):
        line = line.strip()
        if not line:
            pdf.ln(6)
            continue
            
        # Just simple text rendering for now
        if line.startswith('# '):
            pdf.set_font("helvetica", "B", 16)
            pdf.multi_cell(0, 10, align="L", text=line[2:], new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("helvetica", size=11)
        elif line.startswith('## '):
            pdf.set_font("helvetica", "B", 14)
            pdf.multi_cell(0, 8, align="L", text=line[3:], new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("helvetica", size=11)
        elif line.startswith('### '):
            pdf.set_font("helvetica", "B", 12)
            pdf.multi_cell(0, 6, align="L", text=line[4:], new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("helvetica", size=11)
        elif line.startswith('- '):
            # simulate bullet points with ASCII to avoid font encoding issues
            pdf.multi_cell(0, 6, align="L", text="* " + line[2:], new_x="LMARGIN", new_y="NEXT")
        else:
            pdf.multi_cell(0, 6, align="L", text=line, new_x="LMARGIN", new_y="NEXT")
            
    # Save the pdf
    try:
        pdf.output(output_path)
        print(f"Successfully generated PDF: {output_path}")
    except Exception as e:
        print(f"Failed to generate PDF. Error: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Generate ATS-friendly PDFs for CVs and Cover Letters.")
    parser.add_argument("--content", required=False, help="The text content for the PDF.")
    parser.add_argument("--content_file", required=False, help="Path to a text file containing the PDF content.")
    parser.add_argument("--type", required=True, choices=["cv", "cover_letter"], help="Type of document to generate.")
    parser.add_argument("--output_dir", default="../../generated-CVs", help="Base directory for generated files.")
    parser.add_argument("--company", required=True, help="Company name.")
    parser.add_argument("--job_title", required=True, help="Job title.")
    parser.add_argument("--job_id", required=True, help="Target job ID constraint.")
    
    args = parser.parse_args()
    
    # We will support reading from stdin if --content and --content_file are not provided.
    
    # Create safe directory name
    safe_company = "".join([c if c.isalnum() else "_" for c in args.company]).strip("_")
    safe_title = "".join([c if c.isalnum() else "_" for c in args.job_title]).strip("_")
    safe_id = "".join([c if c.isalnum() else "_" for c in args.job_id]).strip("_")
    
    dir_name = f"{safe_company}_{safe_title}_{safe_id}"
    
    # Resolve full output directory path relative to the script location (or CWD if preferred)
    # The requirement is that it saves to the project root /generated-CVs/
    
    # Assuming the script runs from project root because it says `apps/cv-pdf-generator/generator.py`
    # Let's handle paths carefully.
    
    base_dir = Path(args.output_dir).resolve()
    target_dir = base_dir / dir_name
    
    target_dir.mkdir(parents=True, exist_ok=True)
    
    output_filename = f"{args.type}.pdf"
    output_path = target_dir / output_filename
    
    if args.content_file:
        with open(args.content_file, 'r', encoding='utf-8') as f:
            content = f.read()
    elif args.content:
        # Handle literal newlines from bash args if any
        content = args.content.replace('\\n', '\n')
    else:
        # Read from stdin
        content = sys.stdin.read()
        if not content.strip():
            print("Error: No content provided via arguments or stdin.", file=sys.stderr)
            sys.exit(1)
    
    create_pdf(content, str(output_path))

if __name__ == "__main__":
    main()
