import os
import boto3
from banking_data_model import generate_records, RECORD_COUNT

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")


def batch_write(table, items):
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)


def main():
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    customers_table = dynamodb.Table("BankingCustomers")
    accounts_table = dynamodb.Table("BankingAccounts")
    transactions_table = dynamodb.Table("BankingTransactions")

    records = generate_records(1, RECORD_COUNT)

    customer_items = [
        {
            "CustomerId": str(r["customer_id"]),
            "FirstName": r["first_name"],
            "LastName": r["last_name"],
            "Email": r["email"],
            "Phone": r["phone"],
            "DateOfBirth": r["date_of_birth"],
            "Address": r["address"],
            "SSN": r["ssn"],
        }
        for r in records
    ]

    account_items = [
        {
            "AccountId": str(r["account_id"]),
            "CustomerId": str(r["customer_id"]),
            "AccountType": r["account_type"],
            "AccountNumber": r["account_number"],
            "Balance": str(r["balance"]),
            "OpenedDate": r["opened_date"],
            "Status": r["status"],
            "BranchId": str(r["branch_id"]),
        }
        for r in records
    ]

    transaction_items = []
    for r in records:
        transaction_items.append(
            {
                "TransactionId": f"txn-{r['account_id']}",
                "AccountId": str(r["account_id"]),
                "TransactionType": "Deposit",
                "Amount": str(round(float(r["balance"]) * 0.05, 2)),
                "TransactionDate": r["opened_date"],
                "Description": "Initial deposit",
            }
        )

    print("Writing customer items...")
    batch_write(customers_table, customer_items)
    print("Writing account items...")
    batch_write(accounts_table, account_items)
    print("Writing transaction items...")
    batch_write(transactions_table, transaction_items)

    print("DynamoDB sample data generation complete.")
    print("Make sure the tables exist and AWS credentials are configured.")


if __name__ == "__main__":
    main()
