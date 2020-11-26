import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
// import {RequestInterface} from '@octokit/types'
import {app_version as maven_app_version} from './appVersionMaven'
import {app_version as gradle_app_version} from './appVersionGradle'
import Utils from './utils'
import {Repo, VersionObject} from './interfaces'
import Tag from './tag'

async function run(): Promise<void> {
  try {
    const {context} = github

    const {event, number, ref} = context.payload
    core.info(`Event type is: ${event}`)
    const utils = new Utils()
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
    const br = utils.stripRefs(baseBranch)
    const bump_item = br !== release_branch ? 'build' : bump
    const pr = pr_number || number
    const repository =
      core.getInput('repository', {required: false}) ||
      process.env.GITHUB_REPOSITORY

    let repos: null | Repo = null

    try {
      repos = utils.repoSplit(repository, context)
    } catch (e) {
      core.setFailed(`Action failed with error: ${e}`)
    }
    if (!repos) {
      core.setFailed(
        `Action failed with error: No repository information available`
      )
      return
    }

    const appVersion = utils.normalize_version(
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
        suffix = utils.basename(br)
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

// Functions

function bumper(fullTag: string, bumping: string): string {
  // v1.2.3-PR1234.3
  const search_re = /^(v)?(?<version>[0-9]+\.[0-9]+\.[0-9])(_[0-9])?(?<alpha>-.*)?(?<buildnumber>\.[0-9]+)?$/

  const matcher = fullTag.match(search_re)
  if (!matcher) {
    throw Error(`Version to bump is null???`)
  } else {
    const groups = matcher.groups
    if (!groups) {
      throw Error(`No versions found in current tag??? ${fullTag}`)
    } else {
      const version = groups.version
      const alpha = groups.alpha
      const buildnumber = parseInt(groups.buildnumber || '0')

      if (bumping === 'build') {
        return `${version}-${alpha}.${buildnumber + 1}`
      } else if (['major', 'minor', 'patch'].includes(bumping)) {
        const versionObj = parseVersionString(version)
        if (bumping === 'major') {
          versionObj.major += 1
          versionObj.minor = 0
          versionObj.patch = 0
        } else if (bumping === 'minor') {
          versionObj.minor += 1
          versionObj.patch = 0
        } else if (bumping === 'patch') {
          versionObj.patch += 1
        }
        return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
      } else {
        throw Error(
          `Bump value must be one of: major, minor, or patch. Instead '${bumping}' was given`
        )
      }
    }
  }
}

function parseVersionString(str: string): VersionObject {
  const vObj: VersionObject = {major: 0, minor: 0, patch: 0}
  const x = str.split('.')
  // parse from string or default to 0 if can't parse
  vObj.major = parseInt(x[0]) || 0
  vObj.minor = parseInt(x[1]) || 0
  vObj.patch = parseInt(x[2]) || 0
  return vObj
}

function getVersionStringPrefix(
  versionObj: VersionObject,
  bumping: string
): string {
  if (['major', 'minor', 'patch'].includes(bumping)) {
    if (bumping === 'major') {
      return ``
    } else if (bumping === 'minor') {
      return `${versionObj.major}.`
    } else {
      return `${versionObj.major}.${versionObj.minor}`
    }
  } else {
    return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
  }
}
// async function* getItemsFromPages(
//   tool: RequestInterface,
//   pages: Parameters<R>[0],
//   octokit: Octokit
// ) {
//   for await (const page of octokit.paginate.iterator(tool, pages)) {
//     for (const item of page.data) {
//       yield item
//     }
//   }
// }
async function getLatestTag(
  owner: string,
  repo: string,
  tagPrefix: string,
  fromReleases: boolean,
  sortTags: boolean,
  octokit: Octokit
): Promise<string> {
  const tool = fromReleases
    ? octokit.repos.listReleases
    : octokit.repos.listTags
  const pages = octokit.endpoint.merge({
    owner,
    repo,
    per_page: 100
  })
  const tagHelper = new Tag()
  const tags = []
  for await (const page of octokit.paginate.iterator(tool, pages)) {
    for (const pageItem of page.data) {
      for await (const item of pageItem) {
        const tag = fromReleases ? item.get('tag_name') : item.get('name')
        if (!tag.startsWith(tagPrefix)) {
          continue
        }
        if (!sortTags) {
          // Assume that the API returns the most recent tag(s) first.
          return tag
        }
        tags.push(tag)
      }
    }
  }
  if (tags.length === 0) {
    return tagPrefix
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  tags.sort(tagHelper.cmpTags)
  const [latestTag] = tags.slice(-1)
  return latestTag
}
