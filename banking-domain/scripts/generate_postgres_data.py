import os
import random
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values
from banking_data_model import generate_records, RECORD_COUNT

BASE_DIR = os.path.dirname(__file__)
DDL_FILE = os.path.join(BASE_DIR, "postgres_ddl.sql")

DEFAULT_DSN = os.environ.get(
    "POSTGRES_DSN",
    "dbname=banking user=postgres password=postgres host=localhost port=5432"
)

TRANSACTION_TYPES = ["Deposit", "Withdrawal", "Transfer", "Payment"]

BRANCHES = [
    ("Central Branch", "100 Main St, New York, NY 10001", "212-555-0100"),
    ("West Branch", "200 Oak Ave, Chicago, IL 60601", "312-555-0200"),
    ("South Branch", "300 Pine Blvd, Atlanta, GA 30301", "404-555-0300"),
]
EMPLOYEES = [
    ("Emma", "Peterson", "Manager", 1, "2015-03-10", 95000.00),
    ("Liam", "Roberts", "Teller", 1, "2018-07-22", 52000.00),
    ("Olivia", "Scott", "Customer Service", 2, "2019-01-15", 58000.00),
]


def run_sql_script(conn, path):
    with open(path, "r", encoding="utf-8") as f:
        with conn.cursor() as cur:
            cur.execute(f.read())
    conn.commit()


def insert_branch_and_employee_data(conn):
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO branches (branch_name, address, phone) VALUES (%s, %s, %s)",
            BRANCHES,
        )
        cur.executemany(
            "INSERT INTO employees (first_name, last_name, role, branch_id, hire_date, salary) VALUES (%s, %s, %s, %s, %s, %s)",
            EMPLOYEES,
        )
    conn.commit()


def insert_customers_accounts(conn, records):
    customer_rows = []
    account_rows = []
    card_rows = []
    transaction_rows = []

    for record in records:
        customer_rows.append(
            (
                record["customer_id"],
                record["first_name"],
                record["last_name"],
                record["email"],
                record["phone"],
                record["date_of_birth"],
                record["address"],
                record["ssn"],
                datetime.utcnow(),
                round(random.uniform(50000, 250000), 2),
                random.randint(600, 820),
            )
        )

        account_rows.append(
            (
                record["account_id"],
                record["customer_id"],
                record["branch_id"],
                record["account_type"],
                record["account_number"],
                record["balance"],
                record["opened_date"],
                record["status"],
            )
        )

        card_rows.append(
            (
                record["customer_id"],
                f"{random.randint(4000, 5999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
                random.choice(["Debit", "Credit"]),
                datetime.utcnow().date().replace(year=datetime.utcnow().year + 3),
                "Active",
            )
        )

        transaction_type = random.choice(TRANSACTION_TYPES)
        transaction_rows.append(
            (
                record["account_id"],
                None,
                transaction_type,
                round(random.uniform(10.0, 5000.0), 2),
                datetime.utcnow(),
                f"{transaction_type} generated for account",
                random.choice([1, 2, 3]),
            )
        )

    with conn.cursor() as cur:
        execute_values(
            cur,
            "INSERT INTO customers (customer_id, first_name, last_name, email, phone, date_of_birth, address, ssn, created_date, annual_income, credit_score) VALUES %s ON CONFLICT (customer_id) DO NOTHING",
            customer_rows,
        )
        execute_values(
            cur,
            "INSERT INTO accounts (account_id, customer_id, branch_id, account_type, account_number, balance, opened_date, status) VALUES %s ON CONFLICT (account_id) DO NOTHING",
            account_rows,
        )
        execute_values(
            cur,
            "INSERT INTO cards (customer_id, card_number, card_type, expiry_date, status) VALUES %s",
            card_rows,
        )
        execute_values(
            cur,
            "INSERT INTO transactions (account_id, card_id, transaction_type, amount, transaction_date, description, employee_id) VALUES %s",
            transaction_rows,
        )
    conn.commit()


def main():
    records = generate_records(1, RECORD_COUNT)

    with psycopg2.connect(DEFAULT_DSN) as conn:
        run_sql_script(conn, DDL_FILE)
        insert_branch_and_employee_data(conn)
        insert_customers_accounts(conn, records)

    print("PostgreSQL DDL applied and sample banking data inserted.")
    print("Use POSTGRES_DSN environment variable to override the connection string.")


if __name__ == "__main__":
    main()
