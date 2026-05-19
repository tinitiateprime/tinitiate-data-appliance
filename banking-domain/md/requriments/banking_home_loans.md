# Home Loans Data Model

This model focuses on mortgage lending: applications, approvals, properties, and repayments.

## Entities and Relationships

```mermaid
erDiagram
    CUSTOMER ||--o{ LOAN_APPLICATION : submits
    LOAN_APPLICATION ||--|| MORTGAGE_LOAN : results_in
    MORTGAGE_LOAN ||--o{ PAYMENT_SCHEDULE : has
    PROPERTY ||--o{ MORTGAGE_LOAN : secures
    CREDIT_REPORT ||--o{ LOAN_APPLICATION : provides
    CUSTOMER {
        int customer_id PK
        string first_name
        string last_name
        string email
        date date_of_birth
        string ssn
        decimal annual_income
        int credit_score
    }
    LOAN_APPLICATION {
        int application_id PK
        int customer_id FK
        date application_date
        decimal requested_amount
        int term_years
        string status "Pending, Approved, Denied"
        int property_id FK
        int credit_report_id FK
    }
    PROPERTY {
        int property_id PK
        string address
        string property_type "Single Family, Condo"
        decimal appraised_value
        decimal purchase_price
        string description
    }
    CREDIT_REPORT {
        int credit_report_id PK
        int customer_id FK
        int credit_score
        string report_details "JSON or text summary"
        date report_date
    }
    MORTGAGE_LOAN {
        int loan_id PK
        int application_id FK
        decimal loan_amount
        decimal interest_rate
        int term_years
        date start_date
        string loan_status "Active, Paid Off"
        int property_id FK
    }
    PAYMENT_SCHEDULE {
        int payment_id PK
        int loan_id FK
        date due_date
        decimal principal_amount
        decimal interest_amount
        decimal total_payment
        string payment_status "Paid, Pending"
    }
```

## Detailed Descriptions

- **CUSTOMER**: Borrower details, including income and credit score.
- **LOAN_APPLICATION**: Initial request for a home loan.
- **PROPERTY**: Details of the property being financed.
- **CREDIT_REPORT**: Credit history assessment.
- **MORTGAGE_LOAN**: Approved loan terms.
- **PAYMENT_SCHEDULE**: Monthly payment breakdown.

## Data Flow
1. Customer submits application with property details.
2. Credit report is pulled.
3. Application is approved/denied, leading to a loan.
4. Payments are scheduled and tracked.
