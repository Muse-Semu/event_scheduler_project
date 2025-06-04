```markdown
# Event Scheduler - CHANGELOG

This changelog tracks updates for the Event Scheduler project, from US-01 (Event Creation – Single Occurrence) through US-05 (Event Creation – Relative-Date Patterns).

## [US-05] - 2025-06-03
### Added
- **Relative-Date Patterns** (`events/models.py`):
  - Added `weekday` field to `RecurrenceRule` (CharField, choices: `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN`).
  - Added `ordinal` field to `RecurrenceRule` (PositiveSmallIntegerField, choices: 1–5 for first to fifth).
  - Supports `MONTHLY` events on relative dates (e.g., second Friday of each month).
- **Serializer Validation** (`events/serializers.py`):
  - Updated `RecurrenceRuleSerializer` to validate `weekday` and `ordinal`:
    - Ensures valid values and restricts to `MONTHLY` frequency.
    - Requires both `weekday` and `ordinal` together.
    - Prevents mixing with `weekdays`.
  - Enhanced `EventSerializer` to require `end_date` ≥ `start_date + 1 month` for `MONTHLY` with `weekday`/`ordinal`.
- **Migration** (`events/migrations/0003_add_relative_date_to_recurrencerule.py`):
  - Added `weekday` and `ordinal` fields to `RecurrenceRule`.
- **Documentation**:
  - Updated `README.md` with US-05 examples.
  - Marked US-05 as completed.

### Changed
- **Validation Logic** (`events/serializers.py`):
  - Added `weekday`/`ordinal` checks for US-10 compliance.

### Fixed
- None.

### Notes
- **Backward Compatibility**: US-01 to US-04 functionality supported.
- **Dependencies**: Requires `psycopg2-binary>=2.9.9`.
- **Environment**: Django 5, DRF 3.15, SimpleJWT 5.3, PostgreSQL 17 (port 5404), Python 3.12.
- **Time**: Completed by June 3, 2025, 12:26 PM EAT.

## [US-04] - 2025-06-03
### Added
- **Weekday Selection** (`events/models.py`).
- **Serializer Validation** (`events/serializers.py`).
- **Migration** (`events/migrations/0002_add_weekdays_to_recurrencerule.py`).
- **Documentation**: Updated `README.md`.

### Fixed
- **Weekdays Validation** (`events/serializers.py`): Resolved `TypeError` in `validate_weekdays`.
- **Model Definition** (`events/models.py`): Added `WEEKDAY_CHOICES`.

### Notes
- **Backward Compatibility**: US-01 to US-03 supported.
- **Time**: Completed and fixed by June 3, 2025, 12:07 PM EAT.

## [US-03] - 2025-06-03
### Added
- **Interval-Based Recurrence** (`events/serializers.py`).
- **Documentation**: Updated `README.md`.

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
- **Validation**.

### Fixed
- **Invalid Recurrence Rules**.

### Notes
- **Backward Compatibility**: US-01 supported.
- **Time**: Completed by June 2, 2025.

## [US-01] - 2025-05
### Added
- **Single Event Creation**.
- **JWT Authentication** and **Pagination**.

### Notes
- **Time**: 

For usage, see [README.md](README.md).
```