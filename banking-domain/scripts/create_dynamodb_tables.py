import os
import time
import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

TABLE_DEFINITIONS = [
    {
        "TableName": "BankingCustomers",
        "AttributeDefinitions": [
            {"AttributeName": "CustomerId", "AttributeType": "S"}
        ],
        "KeySchema": [
            {"AttributeName": "CustomerId", "KeyType": "HASH"}
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "BankingAccounts",
        "AttributeDefinitions": [
            {"AttributeName": "AccountId", "AttributeType": "S"},
            {"AttributeName": "CustomerId", "AttributeType": "S"}
        ],
        "KeySchema": [
            {"AttributeName": "AccountId", "KeyType": "HASH"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "CustomerIdIndex",
                "KeySchema": [{"AttributeName": "CustomerId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "BankingTransactions",
        "AttributeDefinitions": [
            {"AttributeName": "TransactionId", "AttributeType": "S"},
            {"AttributeName": "AccountId", "AttributeType": "S"}
        ],
        "KeySchema": [
            {"AttributeName": "TransactionId", "KeyType": "HASH"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "AccountIdIndex",
                "KeySchema": [{"AttributeName": "AccountId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "BankingLoans",
        "AttributeDefinitions": [
            {"AttributeName": "LoanId", "AttributeType": "S"},
            {"AttributeName": "CustomerId", "AttributeType": "S"}
        ],
        "KeySchema": [
            {"AttributeName": "LoanId", "KeyType": "HASH"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "LoanCustomerIdIndex",
                "KeySchema": [{"AttributeName": "CustomerId", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    }
]


def create_table(dynamodb, definition):
    table_name = definition["TableName"]
    try:
        table = dynamodb.Table(table_name)
        table.load()
        print(f"Table already exists: {table_name}")
        return table
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "ResourceNotFoundException":
            raise

    print(f"Creating table: {table_name}")
    table = dynamodb.create_table(**definition)
    table.wait_until_exists()
    print(f"Created table: {table_name}")
    return table


def main():
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

    for definition in TABLE_DEFINITIONS:
        create_table(dynamodb, definition)

    print("DynamoDB table creation complete. Ensure AWS credentials are configured.")


if __name__ == "__main__":
    main()
