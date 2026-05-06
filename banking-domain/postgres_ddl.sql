-- PostgreSQL DDL for Banking Domain

DROP TABLE IF EXISTS payment_schedule CASCADE;
DROP TABLE IF EXISTS mortgage_loans CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS credit_reports CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    ssn VARCHAR(11) UNIQUE,
    created_date TIMESTAMP DEFAULT NOW(),
    annual_income NUMERIC(14,2),
    credit_score INTEGER
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(50),
    branch_id INTEGER REFERENCES branches(branch_id),
    hire_date DATE,
    salary NUMERIC(14,2)
);

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    branch_id INTEGER REFERENCES branches(branch_id),
    account_type VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    balance NUMERIC(18,2) DEFAULT 0,
    opened_date DATE,
    status VARCHAR(20)
);

CREATE TABLE cards (
    card_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    card_number VARCHAR(30) NOT NULL UNIQUE,
    card_type VARCHAR(20),
    expiry_date DATE,
    status VARCHAR(20)
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(account_id),
    card_id INTEGER REFERENCES cards(card_id),
    transaction_type VARCHAR(50),
    amount NUMERIC(18,2) NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    description TEXT,
    employee_id INTEGER REFERENCES employees(employee_id)
);

CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    address TEXT NOT NULL,
    property_type VARCHAR(50),
    appraised_value NUMERIC(18,2),
    purchase_price NUMERIC(18,2),
    description TEXT
);

CREATE TABLE credit_reports (
    credit_report_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    credit_score INTEGER,
    report_details TEXT,
    report_date DATE
);

CREATE TABLE loan_applications (
    application_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    application_date DATE,
    requested_amount NUMERIC(18,2),
    term_years INTEGER,
    status VARCHAR(50),
    property_id INTEGER REFERENCES properties(property_id),
    credit_report_id INTEGER REFERENCES credit_reports(credit_report_id)
);

CREATE TABLE mortgage_loans (
    loan_id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES loan_applications(application_id),
    property_id INTEGER REFERENCES properties(property_id),
    loan_amount NUMERIC(18,2),
    interest_rate NUMERIC(6,4),
    term_years INTEGER,
    start_date DATE,
    loan_status VARCHAR(50)
);

CREATE TABLE payment_schedule (
    payment_id SERIAL PRIMARY KEY,
    loan_id INTEGER REFERENCES mortgage_loans(loan_id),
    due_date DATE,
    principal_amount NUMERIC(18,2),
    interest_amount NUMERIC(18,2),
    total_payment NUMERIC(18,2),
    payment_status VARCHAR(20)
);

CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_loan_applications_customer_id ON loan_applications(customer_id);
CREATE INDEX idx_mortgage_loans_application_id ON mortgage_loans(application_id);
