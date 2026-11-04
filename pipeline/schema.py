SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "company": {"type": "string"},
        "seniority": {"type": "string", "enum": ["intern", "junior", "mid", "senior", "lead", "manager", "director", "unspecified"]},
        "employment_type": {"type": "string", "enum": ["full_time", "part_time", "contract", "internship", "unspecified"]},
        "location_restriction": {"type": "string", "description": "Countries/regions the candidate must be in, e.g. 'United States only', 'Worldwide', 'Europe'. 'Worldwide' if none."},
        "salary_min": {"type": ["number", "null"], "description": "Lower bound as a FULL number (72K -> 72000, 3,000 -> 3000). null if the posting shows no salary. Never 0."},
        "salary_max": {"type": ["number", "null"], "description": "Upper bound as a FULL number. null if no salary."},
        "salary_currency": {"type": ["string", "null"], "description": "ISO code like USD, EUR, GBP. null if no salary."},
        "salary_period": {"type": "string", "enum": ["year", "month", "hour", "unspecified"]},
        "posted_date": {"type": "string", "description": "YYYY-MM-DD if shown"},
        "skills_tools": {"type": "array", "items": {"type": "string"}, "description": "Specific tools, languages, platforms and technologies named as required or preferred (e.g. SQL, Python, Power BI, Snowflake, HubSpot, n8n). Normalize names. Exclude soft skills."},
        "years_experience_min": {"type": ["number", "null"], "description": "null if not stated"},
        "mentions_ai_tools": {"type": "boolean", "description": "True if the role explicitly expects using AI tools / LLMs / automation with AI"},
    },
    "required": ["title", "company", "skills_tools"],
}
PROMPT = "Extract data ONLY for the main job posting on this page, ignoring any 'similar jobs' or sidebar listings."
