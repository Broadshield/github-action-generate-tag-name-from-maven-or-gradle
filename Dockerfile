FROM node:12-alpine

# A bunch of `LABEL` fields for GitHub to index
LABEL "com.github.actions.name"="Generate tag name from Maven or Gradle"
LABEL "com.github.actions.description"="Generates a Git tag name for Pull Releases and Branches based on the application version in pom.xml or gradle.settings files"
LABEL "com.github.actions.icon"="git-pull-request"
LABEL "com.github.actions.color"="blue"
LABEL "repository"="https://github.com/Broadshield/github-action-generate-tag-name-from-maven-or-gradle"
LABEL "homepage"="https://github.com/Broadshield/github-action-generate-tag-name-from-maven-or-gradle"
LABEL "maintainer"="Jamie Nelson <jamie@bitflight.io>"
ENV NODE_ENV=production
RUN mkdir -p /app

COPY package.json .
COPY yarn.lock .

# Install dependencies
RUN yarn
# Copy over project files
COPY lib .
COPY index.js .
# This is what GitHub will run
ENTRYPOINT ["node", "index.js"]
