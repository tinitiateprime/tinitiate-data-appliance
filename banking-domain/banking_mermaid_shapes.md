# Banking CMS Content Flow

## Content Update Flow

```mermaid
flowchart TD
    A["Developer updates Markdown files"]
    B["banking-domain folder"]
    C["GitHub repository"]
    D["Docker build process"]
    E["Clone CMS repository"]
    F["Clone data appliance repository"]
    G["Copy banking-domain content"]
    H["/app/banking-domain"]
    I["Run npm run build:local"]
    J["React CMS"]
    K["Browser UI"]
    L["User views updated content"]

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
    A["GitHub data repository"]
    B["tinitiate-data-appliance"]
    C["banking-domain folder"]
    D["Markdown files"]
    E["JSON data"]
    F["Image assets"]
    G["React CMS"]

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
    A["Open banking-domain folder"]
    B["Update Markdown files"]
    C["Update JSON data"]
    D["Update image assets"]
    E["banking_overview.md"]
    F["banking_home_loans.md"]
    G["banking_it_projects.md"]
    H["data folder"]
    I["assets/images"]
    J["Push changes to GitHub"]
    K["Run Docker build again"]
    L["Updated CMS UI"]

    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    C --> H
    D --> I
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K
    K --> L
```

---

# Docker Build Internal Flow

```mermaid
flowchart TD
    A["docker compose build"]
    B["Install Git"]
    C["Clone React CMS"]
    D["Clone data appliance"]
    E["Copy banking-domain"]
    F["/app/banking-domain"]
    G["Run npm ci"]
    H["Run npm run build:local"]
    I["Docker image ready"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
```

---

# CMS Runtime Flow

```mermaid
flowchart LR
    A["Docker container starts"]
    B["React CMS running"]
    C["Reads public content"]
    D["Loads Markdown data"]
    E["Renders UI pages"]
    F["Browser"]

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
    A["Update Markdown file"]
    B["Push to GitHub"]
    C["docker compose up"]
    D["docker compose build --no-cache"]
    E["New content pulled"]
    F["Updated UI visible"]
    X["Old image used"]

    A --> B
    B --> C
    C --> X
    B --> D
    D --> E
    E --> F
```

---

# Example Real Flow

```mermaid
flowchart TD
    A["Edit banking_overview.md"]
    B["Commit changes"]
    C["Push to GitHub"]
    D["docker compose build --pull --no-cache"]
    E["docker compose up"]
    F["Docker clones latest repo"]
    G["Copies banking-domain"]
    H["Build React CMS"]
    I["Updated banking page visible"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
```
