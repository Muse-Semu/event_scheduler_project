```markdown
# Event Scheduler - CHANGELOG

This changelog tracks updates for the Event Scheduler project, focusing on progress from US-01 (Event Creation – Single Occurrence) to US-02 (Event Creation – Standard Recurrence).

## [US-02] - 2025-06-03

### Added
- **RecurrenceRule Model** (`events/models.py`):
  - Fields: `frequency` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`), `interval` (PositiveIntegerField, default=1), `end_date` (DateField, optional).
  - Enables daily, weekly, monthly, and yearly recurrence patterns.
- **Event Model Updates** (`events/models.py`):
  - Added `is_recurring` (BooleanField, default=False).
  - Added `recurrence_rule` (OneToOneField to `RecurrenceRule`, nullable).
  - Included `location` (CharField, max_length=200, optional, nullable) from US-01.
- **Serializers** (`events/serializers.py`):
  - `RecurrenceRuleSerializer`: Validates `frequency`, `interval` (> 0), `end_date` (≥ current date).
  - `EventSerializer`: Supports `is_recurring`, `recurrence_rule`, `location`, with validations for:
    - `start_time` (future).
    - `end_time` (> `start_time`).
    - `recurrence_rule` presence based on `is_recurring`.
    - `end_date` ≥ `start_time.date()` for recurring events.
    - Duration sufficient for `frequency` and `interval` (e.g., ≥ 2 months for `MONTHLY`, `interval=2`).
- **Dependencies**:
  - Used `python-dateutil==2.8` for `relativedelta` in duration validation.
  - Pinned `setuptools<81` to address `pkg_resources` warnings.

### Changed
- **EventSerializer Validation** (`events/serializers.py`):
  - Strengthened to prevent invalid recurrence rules (e.g., `end_date` before `start_time.date()`).
  - Added duration checks to ensure at least one recurrence (e.g., ≥ 7 days for `WEEKLY`, `interval=1`).
- **Views and URLs**:
  - No changes; `EventListCreateView` (`events/views.py`) and `/api/events/` (`events/urls.py`) support both single and recurring events.

### Fixed
- **Invalid Recurrence Rules**:
  - Prevented events with `end_date` before `start_time.date()` (e.g., `end_date="2025-06-30"`, `start_time="2025-07-03"`).
  - Ensured `end_date` allows at least one recurrence based on `frequency` and `interval`.

### Notes
- **Backward Compatibility**: US-01 single occurrence events (`is_recurring=false`) remain fully supported.
- **Validation**: Prepares for US-03 (Custom Recurrence) with robust checks.
- **Environment**: Django 5, DRF 3.15, SimpleJWT 5.3, PostgreSQL 17 (port 5433), Python 3.12.
- **Time**: Completed by June 3, 2025, 10:52 AM EAT.

For usage, see [README.md](README.md).
```