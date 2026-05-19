# Banking CMS Content Flow

## Content Update Flow

```mermaid
flowchart TD

    A[Developer Updates Markdown Files]
    B[banking-domain Folder]
    C[GitHub Repository]
    D[Docker Build Process]
    E[Clone CMS Repository]
    F[Clone Data Appliance Repository]
    G[Copy banking-domain Content]
    H[app banking-domain]
    I[Run build local]
    J[React CMS]
    K[Browser UI]
    L[User Views Updated Content]

    A --> B
    B --> C
    C --> D

    D --> E
    D --> F

    F --> G
    G --> H

    H --> I
    I --> J

    J --> K
    K --> L
```

---

# Where Content Comes From

```mermaid
flowchart LR

    A[GitHub Data Repository]
    B[tinitiate-data-appliance]
    C[banking-domain Folder]
    D[Markdown Files]
    E[JSON Data]
    F[Images Assets]
    G[React CMS]

    A --> B
    B --> C

    C --> D
    C --> E
    C --> F

    D --> G
    E --> G
    F --> G
```

---

# Where To Update Content

```mermaid
flowchart TD

    A[Open banking-domain Folder]

    A --> B[Update Markdown Files]
    A --> C[Update JSON Data]
    A --> D[Update Images Assets]

    B --> E[banking_overview md]
    B --> F[banking_home_loans md]
    B --> G[banking_it_projects md]

    C --> H[data Folder]

    D --> I[assets images]

    E --> J[Push Changes To GitHub]
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[Run Docker Build Again]
    K --> L[Updated CMS UI]
```

---

# Docker Build Internal Flow

```mermaid
flowchart TD

    A[docker compose build]

    A --> B[Install Git]
    B --> C[Clone React CMS]

    C --> D[Clone Data Appliance]

    D --> E[Copy banking-domain]
    E --> F[app banking-domain]

    F --> G[Run npm ci]
    G --> H[Run build local]

    H --> I[Docker Image Ready]
```

---

# CMS Runtime Flow

```mermaid
flowchart LR

    A[Docker Container Starts]
    B[React CMS Running]
    C[Reads Public Content]
    D[Loads Markdown Data]
    E[Render UI Pages]
    F[Browser]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
```

---

# Important Update Note

```mermaid
flowchart TD

    A[Update Markdown File]
    B[Push To GitHub]
    C[docker compose up]

    D[docker compose build no cache]
    E[New Content Pulled]
    F[Updated UI Visible]

    A --> B --> C

    C --> X[Old Image Used]

    B --> D
    D --> E
    E --> F
```

---

# Example Real Flow

```mermaid
flowchart TD

    A[Edit banking_overview md]

    A --> B[Commit Changes]
    B --> C[Push To GitHub]

    C --> D[docker compose build pull no cache]
    D --> E[docker compose up]

    E --> F[Docker Clones Latest Repo]

    F --> G[Copies banking-domain]
    G --> H[Build React CMS]

    H --> I[Updated Banking Page Visible]
```