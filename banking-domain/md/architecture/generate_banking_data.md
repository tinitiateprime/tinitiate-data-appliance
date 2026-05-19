# generate_banking_data.py

## Purpose
This script generates sample banking dataset files in multiple formats with 10,000 distinct records.

## Output Files
- `data/banking_data.csv`
- `data/banking_data.json`
- `data/banking_data.xml`
- `data/parquet/banking_data_part_01.parquet` through `data/parquet/banking_data_part_10.parquet`

## Description
The script imports the shared record schema from `banking_data_model.py` and generates a list of banking records.
It writes the records into CSV, JSON, XML, and chunked Parquet files.

## Usage
Run from the repository root:
```bash
.venv\Scripts\python.exe generate_banking_data.py
```

## Notes
- Parquet output is split into 10 files of 1,000 records each.
- Data is generated deterministically using the record index for unique values like SSN, phone, and account number.
