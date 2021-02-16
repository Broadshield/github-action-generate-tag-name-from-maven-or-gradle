# GitHub Action - Generate Tag name from Maven or Gradle
Generates a Git tag name for Pull Releases and Branches based on the application version in pom.xml or gradle.settings files


### Action inputs

<!-- start usage -->
```yaml
- uses: Broadshield/github-action-generate-tag-name-from-maven-or-gradle@v1.0.1
  with:
    # The Github Token to authenticate with
    github_token: ''

    # The default tag to use if no tags exist
    # Default: 
    default_version: ''

    # The path to the pom.xml or build.gradle file
    # Default: ./pom.xml
    filepath: ''

    # PR number to search for
    pr_number: ''

    # branch to search for
    branch: ''

    # Tag prefix used to search for the current version name to iterate
    tag_prefix: ''

    # Search GitHub releases instead of Github Tags
    # Default: true
    releases_only: ''

    # Sort the tags in version order
    # Default: true
    sort_tags: ''

    # The version part to bump, can be major, minor, patch
    # Default: patch
    bump: ''

    # The release branch to bump
    release_branch: ''

    # A named repository in the format Owner\repositoryName
    repository: ''

    # Prepend a v to tags. i.e. v1.0.0
    # Default: true
    prepend_v: ''

    # Searches for tags that have a 'v' at the start and without
    # Default: true
    ignore_v_when_searching: ''
```
<!-- end usage -->
## Inputs

## Outputs

## Credits

| What           | Where                                      |
| -------------- | ------------------------------------------ |
| Tag Resolution | https://github.com/oprypin/find-latest-tag |