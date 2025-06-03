```markdown
# Event Scheduler

A web application for managing calendar events with complex recurrence patterns. Built with Django 5, Django REST Framework (DRF), and PostgreSQL 17, it provides a secure, user-friendly API for authenticated users to create, view, edit, and delete single and recurring events. A React 18 + TypeScript frontend is planned for a visual calendar interface.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Models](#models)
- [Recurrence Rules](#recurrence-rules)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Architectural Decisions](#architectural-decisions)
- [Development Status](#development-status)
- [Changelog](#changelog)

## Overview
The Event Scheduler is a full-stack application designed to manage calendar events with sophisticated recurrence patterns (e.g., every 3rd day, weekly on Mondays/Wednesdays, or "second Friday of each month"). The backend uses Django 5 and DRF for a robust API, PostgreSQL 17 for data storage, and JWT (via `djangorestframework-simplejwt`) for secure authentication. The project supports pagination (10 events per page) and is extensible for a React + TypeScript frontend.

## Features
The application implements the following user stories from the 360Ground Coding Challenge:

### Must-Have User Stories
- **US-01**: Create single-occurrence events with specific date, time, and location (completed).
- **US-02**: Create recurring events (daily, weekly, monthly, yearly) with customizable intervals (completed).
- **US-03**: Support interval-based recurrence (e.g., every 3rd day) (completed).
- **US-04**: Schedule events on specific weekdays (e.g., every Monday and Wednesday) (completed).
- **US-05**: Support relative-date patterns (e.g., second Friday of each month) (planned).
- **US-06**: View events in a calendar interface (planned).
- **US-07**: List upcoming events in a text-based view (planned).
- **US-08**: Edit existing events, including recurrence patterns (planned).
- **US-09**: Delete entire events or specific recurring instances (planned).
- **US-10**: Provide clear form validation error messages (partially completed for US-01 to US-04).
- **US-11**: User registration with username and password (in progress).
- **US-12**: Secure login to access personal events (partially completed via JWT).
- **US-13**: Logout to protect user sessions (planned).

### Stretch Goals
- **SS-01**: Export events as .ics files for external calendar integration.
- **SS-02**: Support multiple calendars (e.g., work, personal).
- **SS-03**: Achieve ≥80% automated test coverage.
- **SS-04**: Auto-deploy to a preview environment for each push.

## Models
### Event
- **Fields**:
  - `user`: ForeignKey to `User` (event owner).
  - `title`: CharField (max_length=255).
  - `description`: TextField (optional, nullable).
  - `location`: CharField (max_length=200, optional, nullable).
  - `start_time`: DateTimeField (event start).
  - `end_time`: DateTimeField (event end, must be after `start_time`).
  - `is_recurring`: BooleanField (default=False).
  - `recurrence_rule`: OneToOneField to `RecurrenceRule` (optional, nullable).
  - `created_at`: DateTimeField (auto-created timestamp).
  - `updated_at`: DateTimeField (auto-updated timestamp).
- **Purpose**: Stores event details for both single and recurring events.

### RecurrenceRule (US-02, US-03, US-04)
- **Fields**:
  - `frequency`: CharField (choices: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
  - `interval`: PositiveIntegerField (default=1, e.g., 3 for every 3rd day).
  - `end_date`: DateField (optional, when recurrence stops).
  - `weekdays`: ArrayField of CharField (optional, e.g., `["MON", "WED"]` for weekly events).
- **Purpose**: Defines recurrence patterns, including interval-based and weekday-specific schedules.

## Recurrence Rules
The recurrence rule feature (US-02, US-03, US-04) enables users to create events that repeat daily, weekly, monthly, or yearly, with customizable intervals (e.g., every 3rd day) and specific weekdays (e.g., every Monday and Wednesday), via the `/api/events/` endpoint. Recurrence details are stored in the `RecurrenceRule` model, linked to an `Event`.

### API Usage
- **Endpoint**: `POST /api/events/` (create single or recurring events, requires `Authorization: Bearer <access_token>`).
- **Example 1** (every Monday and Wednesday):
  ```bash
  curl -X POST http://localhost:8000/api/events/ \
       -H "Authorization: Bearer <access_token>" \
       -H "Content-Type: application/json" \
       -d '{
         "title": "Yoga Class",
         "description": "Weekly yoga",
         "location": "Studio",
         "start_time": "2025-07-07T18:00:00Z",
         "end_time": "2025-07-07T19:00:00Z",
         "is_recurring": true,
         "recurrence_rule": {
           "frequency": "WEEKLY",
           "interval": 1,
           "end_date": "2025-12-31",
           "weekdays": ["MON", "WED"]
         }
       }'
  ```
  **Response**:
  ```json
  {
    "id": 1,
    "title": "Yoga Class",
    "description": "Weekly yoga",
    "location": "Studio",
    "start_time": "2025-07-07T18:00:00Z",
    "end_time": "2025-07-07T19:00:00Z",
    "is_recurring": true,
    "recurrence_rule": {
      "frequency": "WEEKLY",
      "interval": 1,
      "end_date": "2025-12-31",
      "weekdays": ["MON", "WED"]
    }
  }
  ```
- **Example 2** (every 2nd week on Friday):
  ```bash
  curl -X POST http://localhost:8000/api/events/ \
       -H "Authorization: Bearer <access_token>" \
       -H "Content-Type: application/json" \
       -d '{
         "title": "Team Sync",
         "description": "Bi-weekly meeting",
         "location": "Office",
         "start_time": "2025-07-04T09:00:00Z",
         "end_time": "2025-07-04T10:00:00Z",
         "is_recurring": true,
         "recurrence_rule": {
           "frequency": "WEEKLY",
           "interval": 2,
           "end_date": "2025-12-31",
           "weekdays": ["FRI"]
         }
       }'
  ```

### Recurrence Logic
- **Frequency and Interval**:
  - `DAILY`, `interval=1`: Every day (e.g., July 3, July 4).
  - `DAILY`, `interval=3`: Every 3rd day (e.g., July 3, July 6, July 9).
  - `WEEKLY`, `interval=1`, `weekdays=["MON", "WED"]`: Every Monday and Wednesday.
  - `WEEKLY`, `interval=2`, `weekdays=["FRI"]`: Every 2nd Friday (e.g., July 4, July 18).
  - `MONTHLY`, `interval=1`: Every month (e.g., 3rd of each month).
  - `MONTHLY`, `interval=2`: Every 2nd month (e.g., July 3, September 3).
  - `YEARLY`, `interval=1`: Every year (e.g., July 3, 2025, July 3, 2026).
- **end_date**: Stops recurrence if set (e.g., no events after December 31, 2025).
- **start_time` and `end_time`**: Define each occurrence’s time and duration (e.g., 6 PM–7 PM).
- **weekdays**: For `WEEKLY` events, specifies days (e.g., `["MON", "WED"]`).

### Validation
- **Event**:
  - `start_time`: Future (after current time, e.g., June 3, 2025, 11:55 AM EAT).
  - `end_time`: After `start_time`.
  - `is_recurring=true`: Requires `recurrence_rule`.
  - `is_recurring=false`: Forbids `recurrence_rule`.
- **RecurrenceRule**:
  - `frequency`: Must be `DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY`.
  - `interval`: Positive integer ≤ 100 (e.g., 2 for every 2nd week).
  - `end_date`: If provided:
    - On or after current date.
    - On or after `start_time.date()`.
    - Sufficient for at least one recurrence (e.g., ≥ 7 days for `WEEKLY` with `weekdays`).
  - `weekdays`:
    - Optional, only for `WEEKLY` frequency.
    - Valid values: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`.
    - No duplicates allowed.

## Setup
### Prerequisites
- Docker and Docker Compose (for PostgreSQL).
- Python 3.12 (for Django backend).
- pip (for Python dependencies).
- Node.js 18+ (future, for React frontend).
- Git (for cloning).

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd event_scheduler_project
   ```

2. **Set up PostgreSQL 17**:
   - Verify `docker-compose.yml`:
     ```yaml
     version: '3.8'
     services:
       db:
         image: postgres:17
         environment:
           - POSTGRES_DB=event_scheduler_db
           - POSTGRES_USER=postgres
           - POSTGRES_PASSWORD=password
         volumes:
           - postgres_data:/var/lib/postgresql/data
         ports:
           - "5404:5432"
     volumes:
       postgres_data:
     ```
   - Start database:
     ```bash
     docker-compose up -d
     ```

3. **Install Python dependencies**:
   - Verify `requirements.txt`:
     ```text
     Django==5.0
     djangorestframework==3.15
     djangorestframework-simplejwt==5.3
     psycopg2-binary==2.9.9
     python-dateutil==2.8
     setuptools<81
     ```
   - Install:
     ```bash
     pip install -r requirements.txt
     ```
   - If `psycopg2-binary` fails (Ubuntu/Debian):
     ```bash
     sudo apt-get update
     sudo apt-get install libpq-dev python3-dev
     ```

4. **Set up virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

5. **Apply migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser** (for admin access):
   ```bash
   python manage.py createsuperuser
   ```

## Running the Application
1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Activate virtual environment**:
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Run Django server**:
   ```bash
   python manage.py runserver
   ```

4. **Access**:
   - API: `http://localhost:8000/api/`
   - Admin: `http://localhost:8000/admin/`
   - Endpoints:
     - `POST /api/token/`: Obtain JWT token.
     - `POST /api/events/`: Create events.
     - `GET /api/events/`: List events (paginated).

## Testing
### Manual Testing
1. **Database connectivity**:
   ```bash
   psql -h localhost -p 5404 -U postgres -d event_scheduler_db
   ```

2. **API endpoints**:
   - Get JWT token:
     ```bash
     curl -X POST http://localhost:8000/api/token/ -d "username=<username>&password=<password>"
     ```
   - Create event (every Monday/Wednesday):
     ```bash
     curl -X POST http://localhost:8000/api/events/ \
          -H "Authorization: Bearer <access_token>" \
          -H "Content-Type: application/json" \
          -d '{"title":"Yoga Class","description":"Weekly yoga","location":"Studio","start_time":"2025-07-07T18:00:00Z","end_time":"2025-07-07T19:00:00Z","is_recurring":true,"recurrence_rule":{"frequency":"WEEKLY","interval":1,"end_date":"2025-12-31","weekdays":["MON","WED"]}}'
     ```

3. **Admin interface**:
   - Log in at `http://localhost:8000/admin/` to inspect `Event` and `RecurrenceRule` models.

### Automated Testing
- Planned: Unit tests for models, serializers, views (SS-03).
- Current: Manual testing via `curl` and admin interface.

## Architectural Decisions
- **Backend**: Django 5 + DRF for rapid API development; `python-dateutil` for recurrence logic.
- **Database**: PostgreSQL 17 for relational storage, optimized for recurrence queries.
- **Authentication**: JWT via `djangorestframework-simplejwt` for secure, stateless access.
- **Models**:
  - `Event`: User-specific events with `location` and recurrence support.
  - `RecurrenceRule`: Flexible recurrence patterns (US-02 to US-04).
- **Deployment**: PostgreSQL in Docker (port `5404`); Django on host, with planned `Dockerfile`.
- **Folder Structure**:
  - `events/`: Models, serializers, views, URLs.
  - `event_scheduler/`: Project settings.

## Development Status
- **Completed**:
  - **US-01**: Single-occurrence event creation with `title`, `description`, `location`, `start_time`, `end_time`.
  - **US-02**: Recurring events (daily, weekly, monthly, yearly) with `frequency`, `interval`, and `end_date`.
  - **US-03**: Interval-based recurrence (e.g., every 3rd day, 2nd month).
  - **US-04**: Weekday-specific recurrence (e.g., every Monday and Wednesday).
  - **US-10**: Validation for time, recurrence, and duration (partial).
  - **US-12**: JWT authentication for secure API access (partial).
  - Django project setup with PostgreSQL 17 and `events` app.
- **In Progress**:
  - **US-11**: User registration.
- **Planned**:
  - **US-05 to US-09, US-13**: Relative-date patterns, views, editing, deletion, logout.
  - React + TypeScript frontend (US-06, US-07).
  - Automated tests (SS-03).
  - Stretch goals (SS-01 to SS-04).
  - Full Dockerization.

## Changelog
See [CHANGELOG.md](CHANGELOG.md) for detailed updates.
```