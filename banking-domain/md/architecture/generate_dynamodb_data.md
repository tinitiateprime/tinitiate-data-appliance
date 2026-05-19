# generate_dynamodb_data.py

## Purpose
This script loads sample banking data into DynamoDB tables.

## Description
It reads generated banking records from `banking_data_model.py` and writes items to DynamoDB:
- `BankingCustomers`
- `BankingAccounts`
- `BankingTransactions`

## Data Mapping
- Customer items use `CustomerId` as the partition key.
- Account items use `AccountId` as the partition key and include `CustomerId`.
- Transaction items use `TransactionId` as the partition key and include `AccountId`.

## Configuration
Set `AWS_REGION` or use the default `us-east-1`. AWS credentials must be configured locally.

## Usage
```bash
set AWS_REGION=us-east-1
python .venv\Scripts\python.exe generate_dynamodb_data.py
```

## Notes
- The script uses DynamoDB batch write operations.
- It assumes the target tables already exist.
