```markdown
# Event Scheduler - CHANGELOG

This changelog tracks updates for the Event Scheduler project, from US-01 (Event Creation – Single Occurrence) through US-04 (Event Creation – Weekday Selection).

## [US-04] - 2025-06-03
### Added
- **Weekday Selection** (`events/models.py`):
  - Added `weekdays` field to `RecurrenceRule` (ArrayField of CharField, choices: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`).
  - Supports `WEEKLY` events on specific days (e.g., every Monday and Wednesday).
- **Serializer Validation** (`events/serializers.py`):
  - Updated `RecurrenceRuleSerializer` to validate `weekdays`:
    - Ensures valid day abbreviations and no duplicates.
    - Restricts `weekdays` to `WEEKLY` frequency.
  - Enhanced `EventSerializer` to require `end_date` ≥ `start_date + 7 days` for `WEEKLY` with `weekdays`.
- **Migration** (`events/migrations/0002_add_weekdays_to_recurrencerule.py`):
  - Added `weekdays` field to `RecurrenceRule`.
- **Documentation**:
  - Updated `README.md` with US-04 examples.
  - Marked US-04 as completed.

### Changed
- **Validation Logic** (`events/serializers.py`):
  - Added `weekdays` checks for US-10 compliance.

### Fixed
- **Validation Gaps**:
  - Ensured `weekdays` only used with `WEEKLY` frequency.

### Notes
- **Backward Compatibility**: US-01 to US-03 functionality supported.
- **Dependencies**: Requires `psycopg2-binary>=2.9.9`.
- **Environment**: Django 5, DRF 3.15, SimpleJWT 5.3, PostgreSQL 17 (port 5404), Python 3.12.
- **Time**: Completed by June 3, 2025, 11:55 AM EAT.

## [US-03] - 2025-06-03
### Added
- **Interval-Based Recurrence** (`events/serializers.py`):
  - Validated `interval` ≤ 100.
  - Explicit `frequency` validation.
- **Documentation**:
  - Updated `README.md` for US-03.

### Changed
- **Validation Messages** (`events/serializers.py`).

### Fixed
- **Performance**: Limited `interval` to ≤ 100.

### Notes
- **Backward Compatibility**: US-01 and US-02 supported.
- **Time**: Completed by June 3, 2025, 11:09 AM EAT.

## [US-02] - 2025-06-03
### Added
- **RecurrenceRule Model** (`events/models.py`).
- **Event Model Updates** (`events/models.py`).
- **Serializers** (`events/serializers.py`).
- **Dependencies**: `python-dateutil==2.8`, `setuptools<81`.

### Changed
- **EventSerializer Validation** (`events/serializers.py`).

### Fixed
- **Invalid Recurrence Rules**.

### Notes
- **Backward Compatibility**: US-01 supported.
- **Time**: Completed by June 3, 2025, 10:30 AM EAT.

## [US-01] - 2025-05-20
### Added
- **Single Event Creation**.
- **JWT Authentication** and **Pagination**.

### Notes
- **Time**: Completed by May 20, 2025, 3:00 PM EAT.

For usage, see [README.md](README.md).
```