# GitHub Action - Generate Tag name from Maven or Gradle
Generates a Git tag name for Pull Releases and Branches based on the application version in pom.xml or gradle.settings files

## Inputs

### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

## Outputs

### `time`

The time we greeted you.

## Example usage

uses: actions/hello-world-docker-action@v1
with:
  who-to-greet: 'Mona the Octocat'

## Credits

| What           | Where                                      |
| -------------- | ------------------------------------------ |
| Tag Resolution | https://github.com/oprypin/find-latest-tag |