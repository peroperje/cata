from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional

def extract_jobs_from_html(html_content: str) -> List[Dict[str, str]]:
    """
    Parses email HTML to extract job Title, Company, and URL.
    This is a heuristic-based extractor for common job recommendation emails (LinkedIn, Indeed, etc.)
    """
    jobs = []
    soup = BeautifulSoup(html_content, 'html.parser')

    # Heuristic 1: Look for common patterns in LinkedIn/Indeed emails
    # Often jobs are in tables or specific div structures with links
    
    # Simple strategy: find all links and look at their text and surrounding context
    links = soup.find_all('a', href=True)
    
    for link in links:
        url = link['href']
        # Skip common non-job links
        if any(x in url.lower() for x in ["unsubscribe", "settings", "privacy", "help", "logo"]):
            continue
            
        text = link.get_text(strip=True)
        if not text or len(text) < 5:
            continue

        # If the link text looks like a job title (e.g. "Software Engineer")
        # and we can find a company name nearby.
        
        # This is high-level extraction. In a real scenario, we'd have 
        # template-specific parsers for LinkedIn, Indeed, etc.
        
        # For this implementation, we'll try to find "at [Company]" pattern 
        # or look at parent elements.
        
        parent = link.parent
        parent_text = parent.get_text(separator=" ", strip=True) if parent else ""
        
        company = None
        # Try to find company name in parent text: "Software Engineer at Google"
        match = re.search(r"at\s+([A-Z][a-zA-Z0-9\s&]+)", parent_text)
        if match:
            company = match.group(1).strip()
        
        if not company:
            # Look for <b> or <strong> tags nearby which might be company names
            nearby_b = parent.find_all(['b', 'strong']) if parent else []
            for b_tag in nearby_b:
                b_text = b_tag.get_text(strip=True)
                if b_text and b_text != text:
                    company = b_text
                    break
        
        if text and company and url:
            jobs.append({
                "title": text,
                "company": company,
                "url": url
            })

    # Deduplicate by URL
    seen_urls = set()
    unique_jobs = []
    for job in jobs:
        if job["url"] not in seen_urls:
            unique_jobs.append(job)
            seen_urls.add(job["url"])
            
    return unique_jobs

def extract_jobs_from_text(text_content: str) -> List[Dict[str, str]]:
    """Fallback for plain text emails."""
    jobs = []
    # Simplified regex-based extraction
    # Looks for "Job Title at Company: http://..."
    pattern = r"(.+?)\s+at\s+(.+?):\s+(https?://\S+)"
    matches = re.finditer(pattern, text_content)
    for match in matches:
        jobs.append({
            "title": match.group(1).strip(),
            "company": match.group(2).strip(),
            "url": match.group(3).strip()
        })
    return jobs
