ARG NODE_VERSION=15.2.1-alpine3.12
FROM node:${NODE_VERSION}

# A bunch of `LABEL` fields for GitHub to index
LABEL "com.github.actions.name"="Generate tag name from Maven or Gradle"
LABEL "com.github.actions.description"="Generates a Git tag name for Pull Releases and Branches based on the application version in pom.xml or gradle.settings files"
LABEL "com.github.actions.icon"="git-pull-request"
LABEL "com.github.actions.color"="blue"
LABEL "repository"="https://github.com/Broadshield/github-action-generate-tag-name-from-maven-or-gradle"
LABEL "homepage"="https://github.com/Broadshield/github-action-generate-tag-name-from-maven-or-gradle"
LABEL "maintainer"="Jamie Nelson <jamie@bitflight.io>"

# Copy over project files
COPY . .

# Install dependencies
RUN yarn

# This is what GitHub will run
ENTRYPOINT ["node", "/index.js"]