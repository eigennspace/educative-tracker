NOTE:
This file is the original project brief/scope document and may diverge from the latest implementation.
Current source-of-truth implementation docs are `README.md` and `docs/ARCHITECTURE.md`.

You are an expert senior full-stack engineer, product architect, and UX-focused builder.

You will design and implement a production-quality web application using a LOCAL-FIRST architecture.

This project follows a Context7 development approach:
- understand context deeply
- plan before coding
- optimize for iteration
- build extensible foundations
- prioritize developer experience

--------------------------------------------------
PROJECT NAME
--------------------------------------------------

Educative Learning Progress Tracker

A personal productivity web application for tracking learning progress on Educative.io courses.

--------------------------------------------------
PRIMARY OBJECTIVE
--------------------------------------------------

Build a lightweight MVP that runs locally with minimal setup,
while keeping architecture scalable for future migration
to cloud infrastructure.

The application must help users:

- track courses from Educative.io
- monitor lesson completion
- log study sessions
- visualize learning progress
- maintain daily learning consistency

--------------------------------------------------
CONTEXT (IMPORTANT)
--------------------------------------------------

This application is intended for developers who self-learn using Educative.io.

Constraints:
- Educative does NOT provide public API access
- Data will be manually entered by users
- Must work offline/local environment first
- Fast startup and minimal configuration required

Design for:
- single-user initially
- multi-user extensible later

--------------------------------------------------
DATABASE REQUIREMENT (LITE FIRST)
--------------------------------------------------

Use a lightweight database for MVP:

Preferred options (choose one):
1. SQLite (PRIMARY CHOICE)
2. Turso (SQLite-compatible)
3. Embedded H2 (if backend is Spring Boot)

Requirements:
- zero external DB installation
- file-based storage
- easy migration later to PostgreSQL

Design schema compatible with PostgreSQL migration.

--------------------------------------------------
TECH STACK
--------------------------------------------------

Frontend:
- React or Next.js
- TailwindCSS
- Chart.js or Recharts
- Dark mode enabled

Backend (choose best architecture):
- Node.js + Express
OR
- Spring Boot REST API

Database:
- SQLite (local file DB)

API style:
- RESTful
- clean layered architecture

--------------------------------------------------
CORE FEATURES
--------------------------------------------------

1. Course Management
- Add/edit/remove Educative courses
- Fields:
  - title
  - url
  - category
  - total lessons
  - difficulty
  - estimated hours

2. Lesson Progress
- mark lesson completed
- auto progress percentage
- last studied timestamp

3. Study Sessions
- date
- duration
- notes
- linked course

4. Dashboard
Show:
- active courses
- completion bars
- weekly learning chart
- learning streak counter
- total study hours

5. Analytics
- study heatmap (GitHub style)
- weekly trend
- productivity insights

--------------------------------------------------
DATA MODEL
--------------------------------------------------

User
Course
LessonProgress
StudySession

Relationships:
User → Courses (1:N)
Course → LessonProgress (1:N)
User → StudySession (1:N)

Design migrations cleanly.

--------------------------------------------------
CONTEXT7 DEVELOPMENT INSTRUCTIONS
--------------------------------------------------

Before writing code:

1. First generate:
   - system architecture overview
   - folder structure
   - database schema
   - API contract

2. Then implement incrementally:
   Phase 1 → Database + API
   Phase 2 → Frontend UI
   Phase 3 → Dashboard analytics
   Phase 4 → UX polish

3. Explain design decisions briefly.

4. Prefer simplicity over premature optimization.

--------------------------------------------------
DEVELOPER EXPERIENCE REQUIREMENTS
--------------------------------------------------

- One command startup
- Clear README
- Environment variables example
- Seed data included
- Hot reload enabled

--------------------------------------------------
FUTURE EXTENSIBILITY (IMPORTANT)
--------------------------------------------------

Architecture must allow future upgrades:

- SQLite → PostgreSQL migration
- Add authentication later
- Add AI learning insights
- Sync with cloud backend
- Mobile app integration

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Provide:

1. Architecture explanation
2. Folder structure
3. Database schema (SQL)
4. Backend implementation
5. Frontend implementation
6. Local run instructions
7. Migration strategy

Write clean, modular, senior-level code.
Avoid unnecessary complexity.
Explain assumptions clearly.
