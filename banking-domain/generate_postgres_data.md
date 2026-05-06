# generate_postgres_data.py

## Purpose
This script applies PostgreSQL schema DDL and inserts sample banking data into Postgres.

## Description
It performs the following steps:
1. Reads the DDL from `postgres_ddl.sql`
2. Connects to PostgreSQL using `psycopg2`
3. Creates branches and employees sample rows
4. Inserts generated customer, account, card, and transaction data

## Configuration
The script uses the `POSTGRES_DSN` environment variable, or defaults to:
```text
dbname=banking user=postgres password=postgres host=localhost port=5432
```

## Usage
```bash
set POSTGRES_DSN="dbname=banking user=postgres password=postgres host=localhost port=5432"
.venv\Scripts\python.exe generate_postgres_data.py
```

## Notes
- It uses `ON CONFLICT DO NOTHING` for customer and account inserts.
- It does not currently generate home loan rows, only core banking records.
