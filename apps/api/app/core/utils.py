from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

def normalize_url(url: str) -> str:
    """
    Normalizes a URL by:
    1. Removing common tracking query parameters
    2. Stripping trailing slashes from the path
    3. Sorting remaining query parameters
    4. For specific domains like helloworld.rs, removing all query parameters
    """
    if not url:
        return url
    
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    
    # List of domains where we know query params are safe to remove entirely for job posts
    NO_QUERY_DOMAINS = [
        'helloworld.rs',
        'poslovi.infostud.com',
        'www.helloworld.rs',
        'www.linkedin.com', # Job detail pages on LinkedIn often have a lot of junk params
    ]
    
    path = parsed.path
    if path.endswith('/') and len(path) > 1:
        path = path[:-1]
        
    if any(domain == d or domain.endswith('.' + d) for d in NO_QUERY_DOMAINS):
        # Special handling for LinkedIn job URLs which often have /jobs/view/12345/
        if 'linkedin.com' in domain and '/jobs/view/' in path:
            # Keep only the /jobs/view/ID part
            parts = path.split('/')
            try:
                # find 'view' index
                idx = parts.index('view')
                if len(parts) > idx + 1:
                    path = '/'.join(parts[:idx+2])
            except ValueError:
                pass
        
        return urlunparse((parsed.scheme, parsed.netloc, path, '', '', ''))

    # For other domains, filter out common tracking parameters
    params = parse_qsl(parsed.query)
    filtered_params = [
        (k, v) for k, v in params 
        if not k.startswith('utm_') and k not in [
            'ref', 'source', 'tag', 'disable_saved_search', 
            'show_more', 'ilist', 'item_index', 'click_id'
        ]
    ]
    
    # Sort parameters to ensure consistent URL
    filtered_params.sort()
    
    new_query = urlencode(filtered_params)
    return urlunparse((parsed.scheme, parsed.netloc, path, '', new_query, ''))
