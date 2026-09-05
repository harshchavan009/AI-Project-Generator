# Meridian Privacy Policy & Student Data Protection
**Version:** 2.0.0  
**Effective Date:** 2026 Academic Year  
**Compliance Standards:** Family Educational Rights and Privacy Act (FERPA), General Data Protection Regulation (GDPR), institutional academic confidentiality protocols.

---

## 1. Introduction
Meridian is an AI-assisted project idea generator and academic mentor platform built for engineering students and faculty advisors. This document describes the personal data and academic telemetry collected by the system, our encryption and security posture, retention timelines, and the process by which students can exercise their rights to access, amend, or permanently delete their data.

---

## 2. Information We Collect

### A. Student Profile & Academic Identifiers
- **Identifiers:** Full Name, University Email Address (`@univ.edu`), Academic Department / Branch, and Cohort ID.
- **Academic Constraints:** Project team size, target completion timeframe (weeks), and available hardware resources (CPU-only, GPU, embedded IoT, or none).
- **Skill Inventory:** Self-assessed proficiency ratings (scale 1 to 5) across structured engineering competencies in the platform taxonomy (Languages, Frameworks, Systems, ML/AI, Cloud/DevOps).

### B. Project Blueprints & Scoring Telemetry
- **Selected Ideas:** Project title, domain, problem statement, technical stack, MVP features, and stretch objectives.
- **Deterministic Metrics:** Skill coverage percentage, gap list, bridging hours, feasibility rule penalties, and vector uniqueness scores.
- **Repository Metadata:** Optional GitHub repository URL and commit milestone telemetry for progress tracking.

### C. AI Mentor Chat Transcripts
- Queries submitted to the AI Mentor panel, skill gap context injected for grounding, and the mentor's advisory responses.
- Ephemeral Python source code snippets submitted for viva voce preparation analysis.

---

## 3. Data Protection & Cryptographic Standards

1. **Encryption at Rest (AES-256):**
   - Sensitive student personally identifiable information (PII), such as email addresses and contact information, is encrypted at rest using the **Fernet specification (AES-128 in CBC mode with HMAC-SHA256 authentication)** before being written to PostgreSQL.
2. **Password Security (bcrypt):**
   - User account passwords are encrypted using **bcrypt with 12 salt rounds**. Plaintext passwords are never saved, cached, or emitted in application logs.
3. **Session Tokens (JWT):**
   - Authentication sessions use JSON Web Tokens (JWT) signed with **HMAC-SHA256 (HS256)** and a cryptographically secure 256-bit secret key. Tokens expire automatically after 8 hours.
4. **Third-Party LLM Zero-PII Transmission:**
   - External LLM API calls (e.g., Anthropic Claude, Google Gemini) receive only technical component descriptions, domain names, and academic research citations. Student names, student IDs, and emails are **never passed to external language models**.

---

## 4. Data Retention Schedule

| Data Category | Purpose | Retention Duration |
| :--- | :--- | :--- |
| **User Account & PII** | Authentication & Cohort Assignment | Active academic year + 1 semester for grading verification |
| **Project Proposals** | Faculty review & archive indexing | Retained in departmental archive unless student requests deletion |
| **Mentor Chat Transcripts** | Project continuity & audit trails | 180 days following project final evaluation |
| **Static Analysis Snippets** | Viva question generation | Ephemeral; discarded immediately following AST parsing |
| **Generation Cache** | Deterministic proposal deduplication | Recycled every 90 days |

---

## 5. Student Rights & Data Deletion (Right-to-be-Forgotten)

In accordance with FERPA and GDPR principles, students retain ownership of their intellectual property and personal data.

### Rights Available to Students:
1. **Right to Inspect:** You may view all data stored regarding your profile and projects at any time via the Student Profile and Project Studio views (`GET /api/profile/{student_id}`).
2. **Right to Export:** You may export your complete capstone proposal, roadmap, and citation bibliography in structured JSON format.
3. **Right to Permanent Deletion:** You may permanently erase your account, student profile, project blueprints, and mentor conversation history.

### How to Request Deletion:
- **Automated In-App / API Deletion:**  
  Send an authenticated `DELETE /api/profile/{student_id}` request with your Bearer token.
- **Manual Request to Departmental Privacy Officer:**  
  Email your faculty coordinator or the university Data Protection Officer (`privacy@eng.univ.edu`) with the subject `"Meridian Data Deletion Request"`. Requests are validated and executed within **48 business hours**, triggering a cascading delete across PostgreSQL tables:
  ```sql
  DELETE FROM mentor_messages WHERE project_id IN (...);
  DELETE FROM projects WHERE student_id = :student_id;
  DELETE FROM cohort_students WHERE student_id = :student_id;
  DELETE FROM students WHERE id = :student_id;
  DELETE FROM users WHERE id = :user_id;
  ```

---

## 6. Abuse Prevention & Content Moderation
Meridian enforces server-side input sanitization on all free-text fields to neutralize script injection (XSS) and SQL injection attempts. The AI Mentor endpoint employs automated regex and semantic filters to reject prompt injection attacks, jailbreaking instructions, or inappropriate content prior to invoking external APIs.

---

## 7. Contact & Oversight
For questions regarding this policy or institutional data governance, contact:
- **Academic Oversight Committee:** Department of Computer Science & Engineering
- **Security & Privacy Office:** `privacy@eng.univ.edu`
