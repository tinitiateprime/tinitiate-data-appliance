import random
from datetime import date, timedelta

RECORD_COUNT = 10000
CHUNK_SIZE = 1000
FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Jamie", "Avery", "Riley", "Peyton", "Quinn",
    "Blake", "Cameron", "Drew", "Hayden", "Parker", "Reagan", "Skyler", "Sydney", "Dakota", "Rowan"
]
LAST_NAMES = [
    "Anderson", "Bailey", "Brooks", "Carter", "Davis", "Evans", "Garcia", "Harris", "Johnson", "Kelly",
    "Lee", "Martinez", "Nelson", "Parker", "Roberts", "Scott", "Taylor", "Walker", "Young", "Zimmerman"
]
STREET_NAMES = [
    "Maple", "Oak", "Pine", "Cedar", "Elm", "Birch", "Walnut", "Willow", "Cherry", "Aspen"
]
CITIES = ["New York", "Chicago", "Atlanta", "Houston", "Seattle", "Miami", "Denver", "Boston", "Phoenix", "Dallas"]
STATES = ["NY", "IL", "GA", "TX", "WA", "FL", "CO", "MA", "AZ", "CA"]
ACCOUNT_TYPES = ["Savings", "Checking", "Business", "Money Market"]
STATUS_VALUES = ["Active", "Closed", "Frozen"]
BRANCH_IDS = list(range(1, 21))
TRANSACTION_TYPES = ["Deposit", "Withdrawal", "Transfer", "Payment"]


def random_date(start_year=1955, end_year=2005):
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)


def random_address():
    number = random.randint(100, 9999)
    street = random.choice(STREET_NAMES)
    suffix = random.choice(["St", "Ave", "Blvd", "Rd", "Ln"])
    city = random.choice(CITIES)
    state = random.choice(STATES)
    zip_code = random.randint(10000, 99999)
    return f"{number} {street} {suffix}, {city}, {state} {zip_code}"


def random_ssn(seed_value: int):
    return f"{seed_value:03d}-{(seed_value * 7 % 100):02d}-{(seed_value * 13 % 10000):04d}"


def random_phone(seed_value: int):
    area = 200 + (seed_value % 600)
    exchange = 200 + ((seed_value // 1000) % 600)
    line = 1000 + ((seed_value * 3) % 9000)
    return f"({area}) {exchange}-{line:04d}"


def random_account_number(seed_value: int):
    return f"{10000000 + seed_value:08d}"


def random_transaction_description(transaction_type: str):
    descriptions = {
        "Deposit": "Salary deposit",
        "Withdrawal": "ATM withdrawal",
        "Transfer": "Transfer to external account",
        "Payment": "Utility payment"
    }
    return descriptions.get(transaction_type, "Bank transaction")


def make_record(index: int):
    first_name = random.choice(FIRST_NAMES)
    last_name = random.choice(LAST_NAMES)
    account_type = random.choice(ACCOUNT_TYPES)
    opened_date = random_date(2010, 2024)
    return {
        "customer_id": index,
        "account_id": index,
        "first_name": first_name,
        "last_name": last_name,
        "email": f"{first_name.lower()}.{last_name.lower()}{index}@bankingexample.com",
        "phone": random_phone(index),
        "date_of_birth": random_date(1955, 2000).isoformat(),
        "address": random_address(),
        "ssn": random_ssn(index),
        "account_type": account_type,
        "account_number": random_account_number(index),
        "balance": round(random.uniform(100.0, 200000.0), 2),
        "opened_date": opened_date.isoformat(),
        "status": random.choice(STATUS_VALUES),
        "branch_id": random.choice(BRANCH_IDS),
    }


def generate_records(start=1, count=RECORD_COUNT):
    return [make_record(i) for i in range(start, start + count)]
