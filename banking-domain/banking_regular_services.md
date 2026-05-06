# Regular Banking Services Data Model

This model covers core banking operations: customer management, accounts, transactions, branches, and employees.

## Entities and Relationships

```mermaid
erDiagram
    CUSTOMER ||--o{ ACCOUNT : has
    CUSTOMER {
        int customer_id PK
        string first_name
        string last_name
        string email
        string phone
        date date_of_birth
        string address
        string ssn "Social Security Number (encrypted)"
        date created_date
    }
    ACCOUNT ||--o{ TRANSACTION : generates
    ACCOUNT {
        int account_id PK
        int customer_id FK
        string account_type "e.g., Savings, Checking"
        string account_number
        decimal balance
        date opened_date
        string status "Active, Closed, Frozen"
        int branch_id FK
    }
    BRANCH ||--o{ ACCOUNT : serves
    BRANCH ||--o{ EMPLOYEE : employs
    BRANCH {
        int branch_id PK
        string branch_name
        string address
        string phone
        string manager_id FK
    }
    EMPLOYEE ||--o{ ACCOUNT : manages
    EMPLOYEE {
        int employee_id PK
        string first_name
        string last_name
        string role "e.g., Teller, Manager"
        int branch_id FK
        date hire_date
        decimal salary
    }
    TRANSACTION {
        int transaction_id PK
        int account_id FK
        string transaction_type "Deposit, Withdrawal, Transfer"
        decimal amount
        date transaction_date
        string description
        int employee_id FK "Processed by"
    }
    CUSTOMER ||--o{ CARD : owns
    CARD {
        int card_id PK
        int customer_id FK
        string card_number "Encrypted"
        string card_type "Debit, Credit"
        date expiry_date
        string status "Active, Blocked"
    }
```

## Detailed Descriptions

- **CUSTOMER**: Stores personal information. Linked to accounts and cards.
- **ACCOUNT**: Represents bank accounts. Each customer can have multiple accounts.
- **BRANCH**: Physical locations. Employees and accounts are associated with branches.
- **EMPLOYEE**: Bank staff. Managers oversee branches.
- **TRANSACTION**: Records all financial activities.
- **CARD**: Debit/credit cards issued to customers.

## Data Flow
1. Customer opens an account at a branch.
2. Transactions are processed via accounts.
3. Employees manage operations.
