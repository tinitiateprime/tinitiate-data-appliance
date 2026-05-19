FROM node:22-alpine

ARG CMS_REPO_URL=https://github.com/tinitiateprime/tintiate-docker-cms.git
ARG CMS_REPO_BRANCH=main
ARG CONTENT_REPO_URL=https://github.com/tinitiateprime/tinitiate-data-appliance.git
ARG CONTENT_REPO_BRANCH=main
ARG CONTENT_REPO_SUBDIR=banking-domain

WORKDIR /app

ENV APP_PORT=4300 \
    CONTENT_REPO=tinitiateprime/tinitiate-data-appliance \
    CONTENT_BRANCH=main \
    CONTENT_SOURCE_DIR=banking-domain \
    CONTENT_DEST_DIR=public/content

RUN apk add --no-cache git

RUN git clone --depth 1 --branch "${CMS_REPO_BRANCH}" "${CMS_REPO_URL}" . \
    && rm -rf .git

RUN npm ci

COPY .cms-overrides/ ./

RUN git clone --depth 1 --branch "${CONTENT_REPO_BRANCH}" "${CONTENT_REPO_URL}" /tmp/content-repo \
    && cp -R "/tmp/content-repo/${CONTENT_REPO_SUBDIR}" "./${CONTENT_SOURCE_DIR}" \
    && rm -rf /tmp/content-repo

RUN npm run build:local

EXPOSE 4300

CMD ["npm", "run", "dev:local"]

