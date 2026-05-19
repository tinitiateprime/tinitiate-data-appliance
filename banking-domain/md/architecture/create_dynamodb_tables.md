# create_dynamodb_tables.py

## Purpose
This script creates DynamoDB tables for the banking dataset.

## Tables Created
- `BankingCustomers`
- `BankingAccounts`
- `BankingTransactions`
- `BankingLoans`

## Description
Each table uses pay-per-request billing mode and includes primary keys plus secondary indexes:
- `BankingAccounts` has a GSI on `CustomerId`
- `BankingTransactions` has a GSI on `AccountId`
- `BankingLoans` has a GSI on `CustomerId`

## Configuration
Set `AWS_REGION` or use the default `us-east-1`. AWS credentials must be configured locally.

## Usage
```bash
set AWS_REGION=us-east-1
python .venv\Scripts\python.exe create_dynamodb_tables.py
```

## Notes
- The script checks if each table already exists before creating it.
- It waits until table creation completes.
