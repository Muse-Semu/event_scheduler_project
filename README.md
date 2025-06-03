# Event Scheduler

A web application for managing calendar events with complex recurrence patterns. The project aims to allow authenticated users to create, view, edit, and delete both one-off and recurring events, with a clean architecture and user-friendly API.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Architectural Decisions](#architectural-decisions)
- [Development Status](#development-status)

## Overview
The Event Scheduler is a full-stack web application designed to manage calendar events with sophisticated recurrence rules, such as daily, weekly, monthly, or relative-date patterns (e.g., "second Friday of each month"). The backend uses Django 5 and Django REST Framework (DRF) for a robust API, with PostgreSQL 17 for data storage. Authentication is handled via JWT for secure user access. The project is intended to support a React 18 + TypeScript frontend for a visual calendar interface, though the initial focus is on the backend API.

## Features
The application aims to implement the following user stories as defined in the 360Ground Coding Challenge:

### Must-Have User Stories
- **US-01**: Create single-occurrence events with specific date and time.
- **US-02**: Create recurring events (daily, weekly, monthly, yearly).
- **US-03**: Support interval-based recurrence (e.g., every 3rd day).
- **US-04**: Schedule events on specific weekdays (e.g., every Monday and Wednesday).
- **US-05**: Support relative-date patterns (e.g., second Friday of each month).
- **US-06**: View events in a calendar interface.
- **US-07**: List upcoming events in a text-based view.
- **US-08**: Edit existing events, including recurrence patterns.
- **US-09**: Delete entire events or specific recurring instances.
- **US-10**: Provide clear form validation error messages.
- **US-11**: User registration with username and password.
- **US-12**: Secure login to access personal events.
- **US-13**: Logout to protect user sessions.

### Stretch Goals (Optional)
- **SS-01**: Export events as .ics files for external calendar integration.
- **SS-02**: Support multiple calendars (e.g., work, personal).
- **SS-03**: Achieve ≥80% automated test coverage.
- **SS-04**: Auto-deploy to a preview environment for each push.

## Setup
### Prerequisites
- **Docker and Docker Compose**: For running the PostgreSQL database.
- **Python 3.11+**: For the Django backend.
- **pip**: For installing Python dependencies.
- **Node.js 18+** (future): For the React frontend.
- **Git**: For cloning the repository.

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd event_scheduler_project
   ```

2. **Set up the PostgreSQL 17 database**:
   - Ensure `docker-compose.yml` is present with the following configuration:
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
           - "5433:5432"
     volumes:
       postgres_data:
     ```
   - Start the database:
     ```bash
     docker-compose up -d
     ```

3. **Install Python dependencies**:
   - Create or verify `requirements.txt`:
     ```text
     Django==5.0
     djangorestframework==3.15
     djangorestframework-simplejwt==5.3
     psycopg2-binary==2.9
     python-dateutil==2.8
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - If `psycopg2-binary` fails to install, add system dependencies (Ubuntu/Debian):
     ```bash
     sudo apt-get update
     sudo apt-get install libpq-dev python3-dev
     ```

4. **Apply database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (optional, for admin access)**:
   ```bash
   python manage.py createsuperuser
   ```

## Running the Application
1. **Start the PostgreSQL database**:
   ```bash
   docker-compose up -d
   ```

2. **Run the Django development server**:
   ```bash
   python manage.py runserver
   ```

3. **Access the application**:
   - API: `http://localhost:8000/api/`
   - Admin interface: `http://localhost:8000/admin/` (use superuser credentials)
   - Planned API endpoints:
     - `POST /api/token/`: Obtain JWT token for authentication.
     - `POST /api/events/`: Create events.
     - `GET /api/events/`: List events.
     - (Additional endpoints for editing, deletion, and recurrence to be added)

## Testing
### Manual Testing
1. **Verify database connectivity**:
   ```bash
   psql -h localhost -p 5433 -U postgres -d event_scheduler_db
   ```

2. **Test API endpoints**:
   - Obtain a JWT token:
     ```bash
     curl -X POST http://localhost:8000/api/token/ -d "username=<username>&password=<password>"
     ```
   - Test event creation (once implemented):
     ```bash
     curl -X POST http://localhost:8000/api/events/ \
          -H "Authorization: Bearer <access_token>" \
          -H "Content-Type: application/json" \
          -d '{"title":"Test Event","description":"Description","start_time":"2025-06-03T10:00:00Z","end_time":"2025-06-03T11:00:00Z"}'
     ```

3. **Admin interface**:
   - Log in to `http://localhost:8000/admin/` to inspect models (e.g., `Event`).

### Automated Testing
- Planned: Unit tests for models, serializers, and views using Django’s `TestCase` to achieve ≥80% coverage (SS-03).
- Current: No automated tests implemented; manual testing via `curl` and admin interface.

## Architectural Decisions
- **Backend**:
  - **Django 5 + DRF**: Chosen for rapid API development, robust ORM, and community support.
  - **PostgreSQL 17**: Provides reliable relational storage, suitable for complex recurrence queries.
  - **JWT Authentication**: `djangorestframework-simplejwt` ensures secure, stateless auth (US-11, US-12).
- **Database Design**:
  - `Event` model with fields for user, title, description, start/end times, and recurrence flag.
  - ForeignKey to `User` for user-specific events.
  - Planned `RecurrenceRule` model for complex recurrence patterns (US-02 to US-05).
- **Folder Structure**:
  - `events/`: Houses models, serializers, views, and URLs for event functionality.
  - `event_scheduler/`: Contains Django project settings and configuration.
- **Deployment**:
  - PostgreSQL runs in Docker for portability (host port `5433` to avoid conflicts).
  - Django app currently runs on host; planned Dockerization with `Dockerfile`.

## Development Status
- **Current Progress**:
  - Django project initialized with PostgreSQL 17 database.
  - `events` app created with `Event` model.
  - JWT authentication configured.
  - Partial implementation of US-11/US-12 (login via JWT).
- **In Progress**:
  - Backend API for event creation, viewing, editing, and deletion (US-01 to US-09).
  - Form validation for user inputs (US-10).
  - User registration and logout (US-11, US-13).
- **Future Work**:
  - Implement recurrence patterns (US-02 to US-05).
  - Develop React + TypeScript frontend for calendar/list views (US-06, US-07).
  - Add automated tests (SS-03).
  - Support stretch goals (e.g., .ics export, multiple calendars).
  - Fully Dockerize the application for single-command execution.