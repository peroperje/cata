from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional

def extract_jobs_from_html(html_content: str) -> List[Dict[str, str]]:
    """
    Parses email HTML to extract job Title, Company, and URL using generic heuristics.
    Works across various platforms like LinkedIn, Glassdoor, Indeed, etc.
    """
    jobs_map = {} # Normalized URL -> Job object
    soup = BeautifulSoup(html_content, 'html.parser')

    exclusion_patterns = [
        "unsubscribe", "settings", "privacy", "help", "logo", "search", 
        "alerts", "preferences", "support", "feedback", "notifications",
        "comm/feed", "comm/messaging", "comm/mynetwork", "premium"
    ]

    # Helper to normalize URLs by removing common tracking parameters
    def normalize_url(u: str) -> str:
        # Remove common tracking parameters: trackingId, trk, trkEmail, refId, lipi, etc.
        u = re.sub(r'([?&])(trackingId|trk|trkEmail|refId|lipi|midToken|midSig|eid|otpToken|upsellOrderOrigin)=[^&]*', r'\1', u)
        u = u.replace('?&', '?').replace('&&', '&').rstrip('?&')
        return u

    potential_links = soup.find_all('a', href=True)
    
    for link in potential_links:
        raw_url = link['href']
        norm_url = normalize_url(raw_url)
        text = link.get_text(strip=True)
        
        if any(p in raw_url.lower() for p in exclusion_patterns) or not text or len(text) < 3:
            continue
            
        if len(text) > 150 or text.lower() in ["view job", "apply now", "click here", "show more", "see all", "jobs"]:
            continue

        title = text
        company = "Unknown"
        
        # 1. Check for title/company combined in the link itself
        for sep in [" · ", " | ", " - ", " at "]:
            if sep in text:
                parts = text.split(sep)
                if len(parts) >= 2:
                    title = parts[0].strip()
                    company = parts[1].strip()
                    break
        
        # 2. Look in the surrounding container
        container = link.parent
        for _ in range(5):
            if not container or container.name == 'body':
                break
            # If container has much more text than just the title link, it's a good candidate
            cont_text = container.get_text(strip=True)
            if len(cont_text) > len(text) + 10:
                break
            container = container.parent
        
        if container:
            # A. Priority 1: Image alt text in the same container
            img = container.find('img', alt=True)
            if img and img['alt']:
                alt = img['alt'].strip()
                if alt.lower() not in ["logo", "icon", "image", "link", "profile photo", "company logo"]:
                    company = alt
            
            # B. Priority 2: Text-based candidates if company still unknown or looks like meta
            if company == "Unknown" or any(meta in company.lower() for meta in ["hybrid", "remote", "onsite", "easy apply"]):
                c_text = container.get_text(separator="|", strip=True)
                c_text = re.sub(r'(\s*[·\-\|\@•\*\u2022\u22c5\u2219]\s*|\s+at\s+|\s*[\|,;:]\s*)', '|', c_text)
                parts = [p.strip() for p in c_text.split('|') if len(p.strip()) > 1]
                
                title_idx = -1
                for i, part in enumerate(parts):
                    if title.lower() in part.lower() or part.lower() in title.lower():
                        title_idx = i
                        break
                
                if title_idx != -1:
                    meta_keywords = [
                        "hybrid", "remote", "onsite", "on-site", "actively", "alum", "easy apply", 
                        "verified", "ago", "applicant", "israel", "germany", "brussels", "area",
                        "district", "london", "paris", "new york", "berlin", "metropolitan", "united states",
                        "recruiting", "view job", "apply", "save", "posted", "connections"
                    ]
                    
                    candidates = []
                    for i, part in enumerate(parts):
                        if i == title_idx: continue
                        if not re.search(r'[a-zA-Z]', part): continue
                        if any(meta in part.lower() for meta in meta_keywords): continue
                        if len(part) > 50: continue
                        candidates.append((i, part))
                    
                    if candidates:
                        candidates.sort(key=lambda x: abs(x[0] - title_idx))
                        # Only override if we don't have a good company name yet
                        if company == "Unknown" or any(meta in company.lower() for meta in ["hybrid", "remote"]):
                            company = candidates[0][1]

        # Selection Logic: 
        # - If new title matches company name, and we already have a title that doesn't, skip it.
        # - If current title is "Unknown" company, and we find a better one, replace.
        # - Generally prefer cleaner titles.
        
        existing = jobs_map.get(norm_url)
        if not existing:
            jobs_map[norm_url] = {"title": title, "company": company, "url": raw_url}
        else:
            # Overwrite if current one is better
            # Better means: company is known, or title is cleaner
            if existing['company'] == "Unknown" and company != "Unknown":
                # Special check: If the title was actually the company name, and now we found a real title, fix it.
                if len(title) > len(existing['title']) and existing['title'].lower() in company.lower():
                    # Likely the previous "title" was just the company name
                    jobs_map[norm_url] = {"title": title, "company": company, "url": raw_url}
                else:
                    existing['company'] = company
            
            # If current title looks merged (shorter is often better for cleaner titles)
            if len(title) < len(existing['title']) and title.lower() not in ["linkedin", "glassdoor", "indeed"]:
                existing['title'] = title

    # Final pass: polish and filter
    final_jobs = []
    for job in jobs_map.values():
        # Clean up company: remove trailing metadata
        for meta in [" · ", " | ", " - ", " @ "]:
            if meta in job['company']:
                job['company'] = job['company'].split(meta)[0].strip()
        
        # Validation: if title is too short or generic, skip
        if len(job['title']) < 5 or job['title'].lower() in ["linkedin", "glassdoor", "indeed", "jobs"]:
            continue
            
        final_jobs.append(job)

    return final_jobs

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
