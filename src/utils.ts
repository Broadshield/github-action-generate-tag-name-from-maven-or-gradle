import {Context} from '@actions/github/lib/context'
import {Repo, VersionObject, VersionPrefixes} from './interfaces'
// import {Octokit} from '@octokit/rest'
import Tag from './tag'
import * as core from '@actions/core'
import {GitHub} from '@actions/github/lib/utils'

export function basename(path: string): string | null {
  if (!path) return null
  const result = path.split('/').reverse()[0]
  core.debug(`Basename passed ${path} and returns ${result}`)
  return result
}

export function stripRefs(path: string): string | null {
  if (!path) return null
  const result = path.replace('refs/heads/', '').replace('refs/tags/', '')
  core.debug(`stripRefs passed ${path} and returns ${result}`)
  return result
}

export function normalize_version(
  v_string: string | undefined,
  default_version = '0.0.1'
): string {
  let result
  const VERSION_RE = /^([v])?(?<version>[0-9]+\.[0-9]+\.[0-9])/
  if (v_string === undefined) return default_version
  const match = VERSION_RE.exec(v_string)
  if (match && match.groups) {
    result = match.groups.version
  } else {
    result = default_version
  }

  core.debug(
    `normalize_version passed ${v_string} with default ${default_version} and returns ${result}`
  )
  return result
}

export function repoSplit(
  inputRepo: string | undefined | null,
  context: Context
): Repo | null {
  if (inputRepo) {
    const [owner, repo] = inputRepo.split('/')
    const result = {owner, repo}
    core.debug(
      `repoSplit passed ${inputRepo} and returns ${JSON.stringify(result)}`
    )
    return result
  }
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
    const result = {owner, repo}
    core.debug(
      `repoSplit using GITHUB_REPOSITORY ${
        process.env.GITHUB_REPOSITORY
      } and returns ${JSON.stringify(result)}`
    )
    return result
  }

  if (context.payload.repository) {
    const result = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }
    core.debug(
      `repoSplit using GITHUB_REPOSITORY ${
        process.env.GITHUB_REPOSITORY
      } and returns ${JSON.stringify(result)}`
    )
    return result
  }
  throw Error(
    "repoSplit requires a GITHUB_REPOSITORY environment variable like 'owner/repo'"
  )
}

// Functions

export function bumper(fullTag: string, bumping: string): string {
  const versionObj = parseVersionString(fullTag)

  const currentVersion = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
  const label = versionObj.label || 'alpha'
  const v = versionObj.with_v || ''

  core.debug(`bumper passed fullTag ${fullTag} and bumping ${bumping}}`)
  core.debug(
    `bumper-- currentVersion: ${currentVersion}, label: ${label}, v: ${v}`
  )
  let result
  if (bumping === 'build') {
    const buildnumber = versionObj.build || 0
    result = `${v}${currentVersion}-${label}.${buildnumber + 1}`
  } else if (['major', 'minor', 'patch'].includes(bumping)) {
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
    result = `${v}${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
  } else {
    throw Error(
      `Bump value must be one of: build, major, minor, or patch. Instead '${bumping}' was given`
    )
  }
  core.debug(`bumper returns: ${result}`)
  return result
}

export function parseVersionString(str: string): VersionObject {
  const vObj: VersionObject = {major: 0, minor: 0, patch: 0}

  const search_re = /^(?<v>v)?(?<version>[\d]+\.[\d]+\.[\d]+)(_[\d]+)?([-_])?(?<label>[-_/0-9a-zA-Z]+)?(\.(?<build>[\d]+))?$/
  const matcher = str?.match(search_re)
  core.debug(`parseVersionString passed ${str}`)
  if (
    matcher === null ||
    matcher.groups === undefined ||
    matcher.groups.version === undefined
  ) {
    throw new Error("Version can't be found in string")
  }

  const groups = matcher.groups
  const version = groups.version

  const x = version.split('.')
  // parse from string or default to 0 if can't parse
  vObj.major = parseInt(x[0]) || 0
  vObj.minor = parseInt(x[1]) || 0
  vObj.patch = parseInt(x[2]) || 0
  vObj.build = parseInt(groups.build) || undefined
  vObj.label = groups.label || undefined
  vObj.with_v = groups.v || undefined
  core.debug(`parseVersionString returns ${JSON.stringify(vObj)}`)
  return vObj
}

export function getVersionStringPrefix(
  versionObj: VersionObject,
  bumping: string
): string {
  let result
  if (['major', 'minor', 'patch'].includes(bumping)) {
    if (bumping === 'major') {
      result = ``
    } else if (bumping === 'minor') {
      result = `${versionObj.major}.`
    } else {
      result = `${versionObj.major}.${versionObj.minor}`
    }
  } else {
    result = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
    if (versionObj.label) {
      result = `${result}-${versionObj.label}`
    }
  }
  if (versionObj.with_v) {
    result = `${versionObj.with_v}${result}`
  }
  core.debug(
    `getVersionStringPrefix passed versionObj ${JSON.stringify(
      versionObj
    )} and bumping ${bumping} and returns ${result}`
  )
  return result
}

export function getVersionPrefixes(str: string): VersionPrefixes {
  const search_re = /^(v)?(?<version>.*)/
  const matcher = str?.match(search_re)
  core.debug(`parseVersionString passed ${str}`)
  if (
    matcher === null ||
    matcher.groups === undefined ||
    matcher.groups.version === undefined
  ) {
    throw new Error("Version can't be found in string")
  }

  const groups = matcher.groups
  const version = groups.version
  return {without_v: version, with_v: `v${version}`}
}

export async function getLatestTag(
  owner: string,
  repo: string,
  tagPrefix: string,
  fromReleases: boolean,
  sortTags: boolean,
  ignore_v_when_searching: boolean,
  octokit: InstanceType<typeof GitHub>
): Promise<string> {
  core.debug(
    `getLatestTag passed owner: ${owner}, repo: ${repo}, tagPrefix: ${tagPrefix}, fromReleases: ${fromReleases}, sortTags: ${sortTags}`
  )
  const pages = {
    owner,
    repo,
    per_page: 100
  }
  const tagHelper = new Tag()
  const versionPrefixes = getVersionPrefixes(tagPrefix)
  const tags = []
  let allNames: string[]
  if (fromReleases) {
    allNames = await octokit.paginate(
      octokit.repos.listReleases,
      pages,
      response => response.data.map(item => item.tag_name)
    )
    core.debug(
      `getLatestTag received tags from releases: found ${allNames.length}`
    )
  } else {
    allNames = await octokit.paginate(octokit.repos.listTags, pages, response =>
      response.data.map(item => item.name)
    )
    core.debug(`getLatestTag received tags from tags: found ${allNames.length}`)
  }

  for (const tag of allNames) {
    if (ignore_v_when_searching) {
      if (
        !getVersionPrefixes(tag).without_v.startsWith(versionPrefixes.without_v)
      ) {
        continue
      }
    } else {
      if (!tag.startsWith(tagPrefix)) {
        continue
      }
    }
    if (!sortTags) {
      core.debug(`getLatestTag returns ${tag}`)
      // Assume that the API returns the most recent tag(s) first.
      return tag
    }
    tags.push(tag)
  }

  if (tags.length === 0) {
    core.debug(`getLatestTag found 0 tags starting with prefix ${tagPrefix}`)
    return tagPrefix
  }
  core.debug(
    `getLatestTag found ${tags.length} tags starting with prefix ${tagPrefix}`
  )
  core.debug(`getLatestTag found these tags: ${JSON.stringify(tags)}`)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  tags.sort(tagHelper.cmpTags)
  const [latestTag] = tags.slice(-1)
  core.debug(`getLatestTag returns ${latestTag}`)
  return latestTag
}
