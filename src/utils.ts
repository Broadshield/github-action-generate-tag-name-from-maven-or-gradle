import {Context} from '@actions/github/lib/context'
import {Repo, VersionObject, VersionPrefixes} from './interfaces'
import * as core from '@actions/core'
import {GitHub} from '@actions/github/lib/utils'

const LABEL_PREFIX = '-'
const BUILD_PREFIX = '.'
export const version_regex = /^(?<v>v)?(?<version>(?<major>[\d]+)(?<minor_prefix>\.)?(?<minor>[\d]+)?(?<patch_prefix>\.)?(?<patch>[\d]+)?)((?<legacy_build_prefix>_)(?<legacy_build_number>[\d]+))?((?<label_prefix>[-_])(?<label>[-_/0-9a-zA-Z]+))?(\.(?<build>[\d]+))?$/

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
export function versionObjToArray(vObj: VersionObject): (string | number)[] {
  const vArray: (string | number)[] = []
  vArray.push(vObj.with_v || '')
  vArray.push(vObj.major)
  vArray.push(vObj.minor_prefix || '')
  vArray.push(vObj.minor || '')
  vArray.push(vObj.patch_prefix || '')
  vArray.push(vObj.patch || '')
  vArray.push(vObj.legacy_build_prefix || '')
  vArray.push(vObj.legacy_build_number || '')
  vArray.push(vObj.label_prefix || '')
  vArray.push(vObj.label || '')
  vArray.push(vObj.build ? '.' : '')
  vArray.push(vObj.build || '')

  core.debug(
    `versionObjToArray passed ${JSON.stringify(vObj)} returns ${vArray.join(
      ''
    )}`
  )
  return vArray
}

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
    const buildnumber = (versionObj.build || 0) + 1
    result = `${v}${currentVersion}${LABEL_PREFIX}${label}${BUILD_PREFIX}${buildnumber}`
  } else if (['major', 'minor', 'patch'].includes(bumping)) {
    if (bumping === 'major') {
      versionObj.major = (versionObj.major || 0) + 1
      versionObj.minor = 0
      versionObj.patch = 0
    } else if (bumping === 'minor') {
      versionObj.minor = (versionObj.minor || 0) + 1
      versionObj.patch = 0
    } else if (bumping === 'patch') {
      versionObj.patch = (versionObj.patch || 0) + 1
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

  const search_re = version_regex
  const matcher = str?.match(search_re)
  core.debug(`parseVersionString passed ${str}`)
  if (
    matcher === null ||
    matcher.groups === undefined ||
    matcher.groups.version === undefined
  ) {
    throw new Error("parseVersionString: Version can't be found in string")
  }

  const groups = matcher.groups
  const version = groups.version

  vObj.with_v = groups.v || undefined
  // parse from string or default to 0 if can't parse
  vObj.major = parseInt(groups.major) || 0
  vObj.minor_prefix = groups.minor_prefix || undefined
  vObj.minor = parseInt(groups.minor) || 0
  vObj.patch_prefix = groups.patch_prefix || undefined
  vObj.patch = parseInt(groups.patch) || 0
  vObj.legacy_build_prefix = groups.legacy_build_prefix || undefined
  vObj.legacy_build_number = parseInt(groups.legacy_build_number) || undefined
  vObj.label_prefix = groups.label_prefix || undefined
  vObj.label = groups.label || undefined
  vObj.build = parseInt(groups.build) || undefined

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
      result = `${result}${LABEL_PREFIX}${versionObj.label}`
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
    throw new Error("getVersionPrefixes: Version can't be found in string")
  }

  const groups = matcher.groups
  const version = groups.version
  return {without_v: version, with_v: `v${version}`}
}
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
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

  const versionPrefixes = getVersionPrefixes(tagPrefix)
  const tags: VersionObject[] = []
  let allNames: string[]
  let search_str

  if (ignore_v_when_searching) {
    search_str = `^(v)?${escapeRegExp(versionPrefixes.without_v)}`
  } else {
    search_str = `^${tagPrefix}`
  }
  const search_re = RegExp(search_str)
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
    if (!tag.match(search_re)) {
      continue
    }

    if (!sortTags) {
      core.debug(`getLatestTag returns ${tag}`)
      // Assume that the API returns the most recent tag(s) first.
      return tag
    }

    tags.push(parseVersionString(tag))
  }

  if (tags.length === 0) {
    core.debug(`getLatestTag found 0 tags starting with prefix ${tagPrefix}`)
    return tagPrefix
  }
  core.debug(
    `getLatestTag found ${tags.length} tags starting with prefix ${tagPrefix}`
  )
  core.debug(`getLatestTag found these tags: ${JSON.stringify(tags)}`)
  tags.sort(cmpTags)
  const [latestTag] = tags.slice(-1)
  core.debug(`getLatestTag returns ${latestTag}`)
  return versionObjToArray(latestTag).join('')
}

export function cmpTags(a: VersionObject, b: VersionObject): number {
  return cmpArrays(tagSortKey(a), tagSortKey(b))
}

function tagSortKey(vo: VersionObject): (string | number)[] {
  const a: (string | number)[] = versionObjToArray(vo)
  // Example: 'v1.23rc4' -> ['v', '1', '.', '23', 'rc', '4', ''];

  for (let i = 0; i < a.length; i += 1) {
    // Give any string part that starts with a word character a sorting priority
    // by inserting a `false` (< `true`) item into the key array.
    if (typeof a[i] === 'string') {
      a.splice(i, 0, /^\B/.test(`${a[i]}`) ? 'true' : 'false')
    }
  }
  // Examples (sorted):
  //
  // * 'v1.3'  -> [false, 'v', 1, true, '.', 3, true, '']
  // * '1.2b1' -> [true, '', 1, true, '.', 2, false, 'b', 1, true, '']
  // * '1.2'   -> [true, '', 1, true, '.', 2, true, '']
  // * '1.2-1' -> [true, '', 1, true, '.', 2, true, '-', 1, true, '']
  // * '1.11'  -> [true, '', 1, true, '.', 11, true, '']
  return a
}

function cmpArrays(a: (string | number)[], b: (string | number)[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    if (a[i] !== b[i]) {
      return a[i] > b[i] ? 1 : -1
    }
  }
  return a.length - b.length
}
