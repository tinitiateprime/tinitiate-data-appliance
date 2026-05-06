# banking_data_model.py

## Purpose
This module defines the shared data generation schema for the banking sample dataset.

## Description
It contains:
- constants for record count and data generation options
- lookup arrays for names, address components, account types, status, and branches
- helper functions to generate random dates, addresses, SSNs, phone numbers, and account numbers
- a `make_record(index)` function that returns one unique banking record
- a `generate_records(start, count)` helper to build a list of records

## Usage
Other scripts import this module to keep data generation consistent:
```python
from banking_data_model import generate_records, RECORD_COUNT
```

## Notes
- The record schema includes customer, account, and branch fields.
- The generated data is suitable for CSV, JSON, XML, Parquet, PostgreSQL inserts, and DynamoDB put operations.
