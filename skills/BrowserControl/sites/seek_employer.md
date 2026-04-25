# Seek Employer Portal — BrowserControl Knowledge
<!-- RULE: Never put personal info or credentials here. Names, emails, passwords,
     API keys, account numbers, and PNRs belong in .env only. -->

## Status: ⚠️ Unverified — from web research / hypothesis

## Task
Extract all applicant details (name, email, phone, resume, screening answers) from active job posts.

## Portal URL
https://ph.employer.seek.com/dashboard

## Login
- Method: Email/password (Google SSO also available)
- Notes: Session may expire; login done manually in browser before running script.

## Flow
1. Navigate to https://ph.employer.seek.com/dashboard
2. Find all active job posts listed on the dashboard
3. For each job post, click into the applicants list
4. For each applicant, open their profile
5. Extract: name, email, phone, most recent job, company, screening answers
6. If resume/CV is available, download or save as PDF
7. Save all data as JSON + PDF per applicant

## Document format
- Candidate profiles are HTML pages — use page.pdf() to save
- Resume/CV may be a direct PDF download link

## File naming
`Seek_<JobTitle>_<ApplicantName>_<YYYY-MM-DD>.pdf`
`Seek_<JobTitle>_applicants.json`

## Known edge cases
- Pagination: applicant lists may need "Load more" clicks
- Some applicants may not have resumes attached
- Screening questions vary per job post

## Gotchas
- React-based SPA — use dispatchEvent for dropdowns/toggles
- Wait for URL changes after navigation
- Use waitForFunction instead of fixed sleeps

## How to re-extract
1. Open https://ph.employer.seek.com/dashboard in ChromeDebug browser
2. Log in if needed
3. Run the extraction script
