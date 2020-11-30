import {Context} from '@actions/github/lib/context'
import {Repo, VersionObject} from './interfaces'
import {Octokit} from '@octokit/rest'
import Tag from './tag'

export function basename(path: string): string | null {
  if (!path) return null
  return path.split('/').reverse()[0]
}

export function stripRefs(path: string): string | null {
  if (!path) return null
  return path.replace('refs/heads/', '').replace('refs/tags/', '')
}

export function normalize_version(
  v_string: string | undefined,
  default_version = '0.0.1'
): string {
  const VERSION_RE = /^([v])?(?<version>[0-9]+\.[0-9]+\.[0-9])/
  if (v_string === undefined) return default_version
  const match = VERSION_RE.exec(v_string)
  if (match && match.groups) {
    return match.groups.version
  } else {
    return default_version
  }
}

export function repoSplit(
  inputRepo: string | undefined | null,
  context: Context
): Repo | null {
  if (inputRepo) {
    const [owner, repo] = inputRepo.split('/')
    return {owner, repo}
  }
  if (process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
    return {owner, repo}
  }

  if (context.payload.repository) {
    return {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    }
  }
  throw Error(
    "context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'"
  )
}

// Functions

export function bumper(fullTag: string, bumping: string): string {
  const versionObj = parseVersionString(fullTag)

  const currentVersion = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
  const label = versionObj.label || 'alpha'
  const v = versionObj.with_v || ''

  if (bumping === 'build') {
    const buildnumber = versionObj.build || 0
    return `${v}${currentVersion}-${label}.${buildnumber + 1}`
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
    return `${v}${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
  } else {
    throw Error(
      `Bump value must be one of: build, major, minor, or patch. Instead '${bumping}' was given`
    )
  }
}

export function parseVersionString(str: string): VersionObject {
  const vObj: VersionObject = {major: 0, minor: 0, patch: 0}

  const search_re = /^(?<v>v)?(?<version>[\d]+\.[\d]+\.[\d]+)(_[\d]+)?([-_])?(?<label>[-_/0-9a-zA-Z]+)?(\.(?<build>[\d]+))?$/
  const matcher = str?.match(search_re)
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

  return vObj
}

export function getVersionStringPrefix(
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

export async function getLatestTag(
  owner: string,
  repo: string,
  tagPrefix: string,
  fromReleases: boolean,
  sortTags: boolean,
  octokit: Octokit
): Promise<string> {
  const pages = {
    owner,
    repo,
    per_page: 100
  }
  const tagHelper = new Tag()
  const tags = []
  let allNames: string[]
  if (fromReleases) {
    allNames = await octokit.paginate(
      octokit.repos.listReleases,
      pages,
      response => response.data.map(item => item.tag_name)
    )
  } else {
    allNames = await octokit.paginate(octokit.repos.listTags, pages, response =>
      response.data.map(item => item.name)
    )
  }

  for (const tag of allNames) {
    if (!tag.startsWith(tagPrefix)) {
      continue
    }
    if (!sortTags) {
      // Assume that the API returns the most recent tag(s) first.
      return tag
    }
    tags.push(tag)
  }

  if (tags.length === 0) {
    return tagPrefix
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  tags.sort(tagHelper.cmpTags)
  const [latestTag] = tags.slice(-1)
  return latestTag
}
