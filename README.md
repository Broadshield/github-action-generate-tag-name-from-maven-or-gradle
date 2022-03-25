<!-- start title -->

# GitHub Action: 🏷️ Generate Tag Name from Maven or Gradle

<!-- end title -->
<!-- start description -->

Generates a Git tag name for Pull Releases and Branches based on the application version in pom.xml or gradle.settings files

<!-- end description -->

## Action inputs

<!-- start usage -->

```yaml
- uses: Broadshield/github-action-generate-tag-name-from-maven-or-gradle@v1.0.3
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

    # The delimiter character to use to separate the version from the build number
    # Default: +
    build_delimiter: ''

    # The delimiter character to use to separate the version from the label
    # Default: -
    label_delimiter: ''
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| **Input**                     | **Description**                                                              | **Default** | **Required** |
| :---------------------------- | :--------------------------------------------------------------------------- | :---------: | :----------: |
| **`github_token`**            | The Github Token to authenticate with                                        |             |  **false**   |
| **`default_version`**         | The default tag to use if no tags exist                                      |             |  **false**   |
| **`filepath`**                | The path to the pom.xml or build.gradle file                                 | `./pom.xml` |   **true**   |
| **`pr_number`**               | PR number to search for                                                      |             |  **false**   |
| **`branch`**                  | branch to search for                                                         |             |  **false**   |
| **`tag_prefix`**              | Tag prefix used to search for the current version name to iterate            |             |  **false**   |
| **`releases_only`**           | Search GitHub releases instead of Github Tags                                |   `true`    |  **false**   |
| **`sort_tags`**               | Sort the tags in version order                                               |   `true`    |  **false**   |
| **`bump`**                    | The version part to bump, can be major, minor, patch                         |   `patch`   |  **false**   |
| **`release_branch`**          | The release branch to bump                                                   |             |   **true**   |
| **`repository`**              | A named repository in the format Owner\repositoryName                        |             |  **false**   |
| **`prepend_v`**               | Prepend a v to tags. i.e. v1.0.0                                             |   `true`    |  **false**   |
| **`ignore_v_when_searching`** | Searches for tags that have a 'v' at the start and without                   |   `true`    |  **false**   |
| **`build_delimiter`**         | The delimiter character to use to separate the version from the build number |     `+`     |  **false**   |
| **`label_delimiter`**         | The delimiter character to use to separate the version from the label        |     `-`     |  **false**   |

<!-- end inputs -->

## Outputs

<!-- start outputs -->

| **Output**      | **Description**                 | **Default** | **Required** |
| :-------------- | :------------------------------ | ----------- | ------------ |
| `tag_name`      | The generated tag with the bump |             |              |
| `app_version`   | The App version found           |             |              |
| `search_prefix` | The search prefix used          |             |              |

<!-- end outputs -->

## Credits

| What           | Where                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Tag Resolution | [https://github.com/oprypin/find-latest-tag](https://github.com/oprypin/find-latest-tag) |
