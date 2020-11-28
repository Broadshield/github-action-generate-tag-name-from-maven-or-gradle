import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
// import {RequestInterface} from '@octokit/types'
import {app_version as maven_app_version} from './appVersionMaven'
import {app_version as gradle_app_version} from './appVersionGradle'
import {
  stripRefs,
  repoSplit,
  normalize_version,
  getVersionStringPrefix,
  basename,
  parseVersionString,
  getLatestTag,
  bumper
} from './utils'
import {Repo} from './interfaces'

async function run(): Promise<void> {
  try {
    const {context} = github

    const {event, number, ref} = context.payload
    core.info(`Event type is: ${event}`)
    const github_token = core.getInput('github_token', {required: false})
    const branch = core.getInput('branch', {required: false})
    const pr_number = core.getInput('pr_number', {required: false})
    const filepath = core.getInput('filepath', {required: true})
    const default_version = core.getInput('default_version', {required: false})
    const tag_prefix = core.getInput('tag_prefix', {required: false})
    const releases_only =
      core.getInput('releases_only', {required: false}) === 'true'
    const sort_tags = core.getInput('sort_tags', {required: false}) === 'true'
    const bump = core.getInput('bump', {required: false})
    const release_branch = core.getInput('release_branch', {required: true})

    const octokit = new Octokit({
      auth: github_token,
      userAgent: 'github-action-generate-tag-name-from-maven-or-gradle v1.0.0'
    })

    // It's somewhat safe to assume that the most recently created release is actually latest.
    const sortTagsDefault = releases_only ? 'false' : 'true'
    const sortTags =
      (`${sort_tags}` || sortTagsDefault).toLowerCase() === 'true'
    const baseBranch = branch || ref
    const br = stripRefs(baseBranch)
    const bump_item = br !== release_branch ? 'build' : bump
    const pr = pr_number || number
    const repository =
      core.getInput('repository', {required: false}) ||
      process.env.GITHUB_REPOSITORY

    let repos: null | Repo = null

    try {
      repos = repoSplit(repository, context)
    } catch (e) {
      core.setFailed(`Action failed with error: ${e}`)
    }
    if (!repos) {
      core.setFailed(
        `Action failed with error: No repository information available`
      )
      return
    }

    const appVersion = normalize_version(
      maven_app_version(filepath) || gradle_app_version(filepath),
      default_version
    )
    const prefix = tag_prefix || appVersion

    let searchPrefix
    if (bump_item === 'build') {
      let suffix: string | null = 'alpha'
      if (pr) {
        suffix = `PR${pr}`
      } else if (br) {
        suffix = basename(br)
      }
      searchPrefix = `${prefix}-${suffix}`
    } else {
      searchPrefix = getVersionStringPrefix(
        parseVersionString(prefix),
        bump_item
      )
    }

    const latestGitTag = await getLatestTag(
      repos.owner,
      repos.repo,
      searchPrefix,
      releases_only,
      sortTags,
      octokit
    )
    const tag_name = bumper(latestGitTag, bump_item)
    core.setOutput('tag_name', tag_name)
    core.setOutput('app_version', appVersion)
    core.setOutput('search_prefix', searchPrefix)
    core.info(`Tag Name: ${tag_name}`)
    core.info(`App Version: ${appVersion}`)
    core.info(`Search Prefix: ${searchPrefix}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
