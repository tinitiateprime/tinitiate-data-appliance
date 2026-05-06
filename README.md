
## Run the Banking CMS in Docker

The Docker setup can run from a fresh machine even when neither GitHub
repository has already been cloned locally. During the Docker image build,
Docker clones the React CMS repository, then clones the data appliance
repository and copies its `banking-domain/` content into the CMS project.

Required GitHub repositories and branches:

| Purpose | Repository | Branch | Docker use |
| --- | --- | --- | --- |
| React CMS | `https://github.com/tinitiateprime/tintiate-docker-cms.git` | `main` | Cloned into `/app` inside the Docker image |
| Banking data appliance | `https://github.com/tinitiateprime/tinitiate-data-appliance.git` | `main` | Cloned into `/tmp/content-repo` inside the Docker image |

Inside the image, Docker copies:

```text
/tmp/content-repo/banking-domain -> /app/banking-domain
```

That copy is required because the CMS runs from `/app`, while the data
appliance repository is only a temporary checkout used during the image build.

### Docker And Folder Structure Summary

The Docker setup supports three valid local folder structures.

Full data appliance project checkout:

```text
tinitiate-data-appliance/
  Dockerfile
  docker-compose.yml
  .env.example
  README.md
  banking-domain/
    README.md
    banking_overview.md
    data/
    ...
```

Docker-only folder with Compose:

```text
banking-cms-docker/
  Dockerfile
  docker-compose.yml
  .env.example
```

Dockerfile-only folder:

```text
dockerfile-only-run/
  Dockerfile
```

You do not need these folders locally for the default Docker build:

```text
cms-react/
banking-domain/
```

They are cloned or created inside Docker during the build. The final CMS app
inside the Docker image looks like this:

```text
/app/
  package.json
  package-lock.json
  src/
  scripts/
  public/
  banking-domain/
    README.md
    banking_overview.md
    data/
    ...
```
 
Use `docker compose up --build` when your folder has both `Dockerfile` and
`docker-compose.yml`. Use `docker build` followed by `docker run` when your
folder has only `Dockerfile`.

### Requirements

- Docker Desktop or Docker Engine must be installed and running.
- Docker must have internet access to GitHub.
- Node.js and npm are not required on the host when using Docker only.
- Node.js and npm are required only if you want to test the React CMS locally
  outside Docker.

### Scenario 1: You Already Have This Project Locally

Use this when you have cloned the data appliance project on your machine:

```bash
git clone --branch main https://github.com/tinitiateprime/tinitiate-data-appliance.git
cd tinitiate-data-appliance
git pull origin main
```

Expected folder structure:

```text
tinitiate-data-appliance/
  Dockerfile
  docker-compose.yml
  .env.example
  README.md
  banking-domain/
    README.md
    banking_overview.md
    data/
    ...
```

Run the two-step Docker flow from the project root:

```bash
docker compose build --pull
docker compose up
```

Open:

```text
http://localhost:4300/
```

In this default mode, Docker still clones both GitHub repositories during the
image build. Your local `banking-domain/` folder is useful for editing,
reviewing, and testing content, but the image build uses the configured GitHub
branch unless you customize the Dockerfile or add a local bind mount for
development.

To stop the container:

```bash
docker compose down
```

### Scenario 2: You Do Not Have Any Local Project Folder

Use this when you do not have `tinitiate-data-appliance/`, `cms-react/`, or
`banking-domain/` locally.

Create any folder, for example:

```text
banking-cms-docker/
  Dockerfile
  docker-compose.yml
  .env.example
```

Then run from that folder:

```bash
docker compose build --pull
docker compose up
```

This works because the Dockerfile clones both repositories:

```text
GitHub 1 CMS:
https://github.com/tinitiateprime/tintiate-docker-cms.git
branch: main

GitHub 2 data appliance:
https://github.com/tinitiateprime/tinitiate-data-appliance.git
branch: main
```

No local `cms-react/` folder is needed. No local `banking-domain/` folder is
needed.

### Scenario 3: You Only Have a Dockerfile

Having only the `Dockerfile` is enough for the default setup because the
Dockerfile contains default repository URLs and branch names.

Minimum folder structure:

```text
dockerfile-only-run/
  Dockerfile
```

Build the image:

```bash
docker build --pull -t banking-domain-cms .
```

Run the container:

```bash
docker run --rm -p 4300:4300 --name banking-domain-cms banking-domain-cms
```

Open:

```text
http://localhost:4300/
```

Stop it with `Ctrl+C`.

Use a different runtime port on the host, for example host port `4500`:

```bash
docker run --rm -p 4500:4300 --name banking-domain-cms banking-domain-cms
```

Use different repositories or branches without Compose:

```bash
docker build --pull -t banking-domain-cms \
  --build-arg CMS_REPO_URL=https://github.com/tinitiateprime/tintiate-docker-cms.git \
  --build-arg CMS_REPO_BRANCH=main \
  --build-arg CONTENT_REPO_URL=https://github.com/tinitiateprime/tinitiate-data-appliance.git \
  --build-arg CONTENT_REPO_BRANCH=main \
  --build-arg CONTENT_REPO_SUBDIR=banking-domain \
  .
```

On Windows PowerShell:

```powershell
docker build --pull -t banking-domain-cms `
  --build-arg CMS_REPO_URL=https://github.com/tinitiateprime/tintiate-docker-cms.git `
  --build-arg CMS_REPO_BRANCH=main `
  --build-arg CONTENT_REPO_URL=https://github.com/tinitiateprime/tinitiate-data-appliance.git `
  --build-arg CONTENT_REPO_BRANCH=main `
  --build-arg CONTENT_REPO_SUBDIR=banking-domain `
  .
```

### Is docker-compose.yml Required?

`docker-compose.yml` is not strictly required. It is recommended because it
keeps the build arguments, runtime environment variables, image name, container
name, port mapping, and restart policy in one file.

`Dockerfile` alone is enough for the default setup. `docker-compose.yml` alone
is not enough because it points to the `Dockerfile` for the actual image build.

Use only `Dockerfile` when:

- You want the smallest possible setup.
- You are fine running `docker build` and `docker run` manually.
- You are using the default GitHub repositories and branches.

Use `Dockerfile` plus `docker-compose.yml` when:

- You want a repeatable two-step control process.
- You want to configure values through `.env`.
- You want simpler start and stop commands.
- You want the same setup to be easier for other users to run.

Recommended Docker Compose folder structure:

```text
banking-cms-docker/
  Dockerfile
  docker-compose.yml
  .env.example
  README.md
```

Optional `.env` setup:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` if you need a different port, repository, branch, or content
subfolder.

### Two-Step Docker Compose Control

Step 1, build the image:

```bash
docker compose build --pull
```

During this build Docker:

- Installs Git in the Node image.
- Clones the React CMS from `CMS_REPO_URL` using `CMS_REPO_BRANCH`.
- Installs CMS dependencies with `npm ci`.
- Clones the data appliance from `CONTENT_REPO_URL` using
  `CONTENT_REPO_BRANCH`.
- Copies `CONTENT_REPO_SUBDIR`, normally `banking-domain`, into the CMS.
- Runs `npm run build:local` to verify the cloned appliance content builds.

Step 2, start the container:

```bash
docker compose up
```

Stop the container:

```bash
docker compose down
```

Rebuild without cache when you want to force Docker to fetch the latest GitHub
content again:

```bash
docker compose build --pull --no-cache
docker compose up
```

If you already have a running container and you want to refresh the latest
markdown/data from GitHub, stop it and rebuild the image without cache:

```bash
docker compose down
docker compose build --pull --no-cache
docker compose up
```

Running only `docker compose down` and then `docker compose up` starts the old
image again. It does not clone GitHub again, so new `.md` changes will not show
until the image is rebuilt.

Use a different port with Compose:

```bash
APP_PORT=4500 docker compose up
```

On Windows PowerShell:

```powershell
$env:APP_PORT = "4500"
docker compose up
```

### Optional: Test the CMS Locally Without Docker

Use this only when you want to test the React CMS directly on your machine.
This requires Node.js and npm on the host.

Clone the CMS beside the appliance content:

```bash
git clone --branch main https://github.com/tinitiateprime/tintiate-docker-cms.git cms-react
cd cms-react
npm ci
npm run build:github
cd ..
```

Test the CMS against local appliance content:

```bash
cd cms-react
CONTENT_SOURCE_DIR=../banking-domain CONTENT_DEST_DIR=public/content npm run build:local
cd ..
```

On Windows PowerShell:

```powershell
cd cms-react
$env:CONTENT_SOURCE_DIR = "..\banking-domain"
$env:CONTENT_DEST_DIR = "public\content"
npm run build:local
cd ..
```

### Configuration Reference

Configurable values are shown in `.env.example`:

```text
APP_PORT=4300

CMS_REPO_URL=https://github.com/tinitiateprime/tintiate-docker-cms.git
CMS_REPO_BRANCH=main

CONTENT_REPO=tinitiateprime/tinitiate-data-appliance
CONTENT_REPO_URL=https://github.com/tinitiateprime/tinitiate-data-appliance.git
CONTENT_BRANCH=main
CONTENT_REPO_BRANCH=main
CONTENT_REPO_SUBDIR=banking-domain
CONTENT_SOURCE_DIR=banking-domain
CONTENT_DEST_DIR=public/content
GITHUB_TOKEN=
```
