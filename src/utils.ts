import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { GitHub } from '@actions/github/lib/utils';

import { getKeyValue, Repo, VersionObject, VersionPrefixes } from './interfaces';

type VersionFieldType = string | number;
const LABEL_PREFIX = core.getInput('label_delimiter', { required: false }) || '-';
const BUILD_PREFIX = core.getInput('build_delimiter', { required: false }) || '+';
export const version_regex =
    /^(?<v>v)?(?<version>(?<major>[\d]+)(?<minor_prefix>\.)?(?<minor>[\d]+)?(?<patch_prefix>\.)?(?<patch>[\d]+)?)((?<legacy_build_prefix>_)(?<legacy_build_number>[\d]+))?((?<label_prefix>[-_])(?<label>[-_/0-9a-zA-Z]+))?([.+](?<build>[\d]+))?$/;

export function basename(path: string): string | null {
    if (!path) return null;
    const result = path.split('/').reverse()[0];
    core.debug(`Basename passed ${path} and returns ${result}`);
    return result;
}

export function stripRefs(path: string): string | null {
    if (!path) return null;
    const result = path.replace('refs/heads/', '').replace('refs/tags/', '');
    core.debug(`stripRefs passed ${path} and returns ${result}`);
    return result;
}

export function normalize_version(v_string?: string, default_version = '0.0.1'): string {
    let result;
    const VERSION_RE = /^([Vv])?(?<version>[\d]+\.[\d]+\.[\d])/;
    if (v_string === undefined) return default_version;
    const strToNormalize = v_string?.trim();
    const match = VERSION_RE.exec(strToNormalize);
    if (match && match.groups) {
        result = match.groups.version;
    } else {
        result = default_version;
    }
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(
        `(${
            Math.round(used * 100) / 100
        } MB) normalize_version passed ${v_string} with default ${default_version} and returns ${result}`,
    );
    return result?.trim();
}

export function repoSplit(inputRepo: string | undefined | null, context: Context): Repo | null {
    const result: Repo = {} as Repo;
    if (inputRepo) {
        [result.owner, result.repo] = inputRepo.split('/');

        core.debug(`repoSplit passed ${inputRepo} and returns ${JSON.stringify(result)}`);
    } else if (process.env.GITHUB_REPOSITORY) {
        [result.owner, result.repo] = process.env.GITHUB_REPOSITORY.split('/');

        core.debug(
            `repoSplit using GITHUB_REPOSITORY ${
                process.env.GITHUB_REPOSITORY
            } and returns ${JSON.stringify(result)}`,
        );
    } else if (context.repo) {
        result.owner = context.repo.owner;
        result.repo = context.repo.repo;

        core.debug(
            `repoSplit using GITHUB_REPOSITORY ${
                process.env.GITHUB_REPOSITORY
            } and returns ${JSON.stringify(result)}`,
        );
    }
    if (result.repo && result.owner) {
        return result;
    }
    throw Error("repoSplit requires a GITHUB_REPOSITORY environment variable like 'owner/repo'");
}

// Functions
export function versionObjToArray(vObj: VersionObject): (string | number)[] {
    const vArray: (string | number)[] = [];
    vArray.push(undfEmpty(vObj.with_v));
    vArray.push(undfEmpty(vObj.major));
    vArray.push(undfEmpty(vObj.minor_prefix));
    vArray.push(undfEmpty(vObj.minor));
    vArray.push(undfEmpty(vObj.patch_prefix));
    vArray.push(undfEmpty(vObj.patch));
    vArray.push(undfEmpty(vObj.legacy_build_prefix));
    vArray.push(undfEmpty(vObj.legacy_build_number));
    vArray.push(undfEmpty(vObj.label_prefix));
    vArray.push(undfEmpty(vObj.label));
    vArray.push(vObj.build === undefined ? BUILD_PREFIX : '');
    vArray.push(undfEmpty(vObj.build));

    core.debug(`versionObjToArray passed ${JSON.stringify(vObj)} returns ${vArray.join('')}`);
    return vArray;
}
function undfEmpty(vStr?: VersionFieldType): string {
    if (vStr === undefined) {
        return '';
    }
    return vStr.toString();
}
export function versionObjToString(vObj: VersionObject): string {
    const vStr = `${undfEmpty(vObj.with_v)}${vObj.major}${undfEmpty(vObj.minor_prefix)}${undfEmpty(
        vObj.minor === undefined ? 0 : vObj.minor,
    )}${undfEmpty(vObj.patch_prefix)}${vObj.patch === undefined ? 0 : vObj.patch}${undfEmpty(
        vObj.legacy_build_prefix,
    )}${undfEmpty(vObj.legacy_build_number)}${undfEmpty(vObj.label_prefix)}${undfEmpty(
        vObj.label,
    )}${vObj.build ? BUILD_PREFIX : ''}${undfEmpty(vObj.build)}`;

    core.debug(`versionObjToString passed ${JSON.stringify(vObj)} returns ${vStr}`);
    return vStr;
}

export function bumper(
    versionObj: VersionObject,
    bumping: string,
    is_release_branch: boolean,
): string {
    const currentVersion = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
    const label = versionObj.label || 'alpha';
    const v = versionObj.with_v || '';

    core.debug(
        `bumper passed version object ${versionObjToString(versionObj)} and bumping ${bumping}}`,
    );
    core.debug(`bumper-- currentVersion:${currentVersion},label:${label},v: ${v}`);
    let result;
    if (bumping === 'build') {
        const buildnumber = (versionObj.build || 0) + 1;
        result = `${v}${currentVersion}${is_release_branch ? '' : LABEL_PREFIX}${
            is_release_branch ? '' : label
        }${BUILD_PREFIX}${buildnumber}`;
    } else if (['major', 'minor', 'patch'].includes(bumping)) {
        if (bumping === 'major') {
            versionObj.major = (versionObj.major || 0) + 1;
            versionObj.minor = 0;
            versionObj.patch = 0;
        } else if (bumping === 'minor') {
            versionObj.minor = (versionObj.minor || 0) + 1;
            versionObj.patch = 0;
        } else if (bumping === 'patch') {
            versionObj.patch = (versionObj.patch || 0) + 1;
        }
        result = `${v}${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
    } else {
        throw Error(
            `Bump value must be one of: build, major, minor, or patch.Instead '${bumping}' was given`,
        );
    }
    core.debug(`bumper returns: ${result}`);
    return result;
}

export function parseVersionString(str: string): VersionObject {
    const vObj: VersionObject = { major: 0, minor: 0, patch: 0 };

    const search_re = version_regex;
    const matcher = str?.match(search_re);
    core.debug(`parseVersionString passed ${str}`);
    if (matcher === null || matcher.groups === undefined) {
        throw new Error("parseVersionString: Version can't be found in string");
    }

    const groups = matcher.groups;

    vObj.with_v = groups.v || undefined;
    // parse from string or default to 0 if can't parse
    vObj.major = parseInt(groups.major) || 0;
    vObj.minor_prefix = groups.minor_prefix || undefined;
    vObj.minor = parseInt(groups.minor) || 0;
    vObj.patch_prefix = groups.patch_prefix || undefined;
    vObj.patch = parseInt(groups.patch) || 0;
    vObj.legacy_build_prefix = groups.legacy_build_prefix || undefined;
    vObj.legacy_build_number = parseInt(groups.legacy_build_number) || undefined;
    vObj.label_prefix = groups.label_prefix || undefined;
    vObj.label = groups.label || undefined;
    vObj.build = parseInt(groups.build) || undefined;

    core.debug(`parseVersionString returns ${JSON.stringify(vObj)}`);
    return vObj;
}

export function getVersionStringPrefix(
    versionObj: VersionObject,
    bumping: string,
    suffix: string | undefined,
    is_release_branch: boolean,
): string {
    let result;
    if (['major', 'minor', 'patch'].includes(bumping)) {
        if (bumping === 'major') {
            result = '';
        } else if (bumping === 'minor') {
            result = `${versionObj.major}.`;
        } else {
            result = `${versionObj.major}.${versionObj.minor}`;
        }
    } else {
        result = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
        if (!is_release_branch && (versionObj.label || suffix)) {
            result = `${result}${LABEL_PREFIX}${versionObj.label || suffix}`;
        }
    }
    if (versionObj.with_v) {
        result = `${versionObj.with_v}${result}`;
    }
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(
        `(${
            Math.round(used * 100) / 100
        } MB) getVersionStringPrefix passed versionObj ${JSON.stringify(
            versionObj,
        )} and bumping ${bumping} and returns ${result}`,
    );
    return result;
}

export function getVersionPrefixes(str: string): VersionPrefixes {
    const search_re = /^(v)?(?<version>.*)/;
    const matcher = str?.match(search_re);
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(`(${Math.round(used * 100) / 100} MB) parseVersionString passed ${str}`);
    if (matcher === null || matcher.groups === undefined || matcher.groups.version === undefined) {
        throw new Error("getVersionPrefixes: Version can't be found in string");
    }

    const groups = matcher.groups;
    const version = groups.version;
    return { without_v: version, with_v: `v${version} ` };
}
function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
export async function getLatestTag(
    owner: string,
    repo: string,
    tagPrefix: string,
    fromReleases: boolean,
    sortTags: boolean,
    ignore_v_when_searching: boolean,
    octokit: InstanceType<typeof GitHub>,
): Promise<VersionObject> {
    const usedUp = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(
        `(${
            Math.round(usedUp * 100) / 100
        } MB) getLatestTag passed owner: ${owner}, repo: ${repo}, tagPrefix: ${tagPrefix}, fromReleases: ${fromReleases}, sortTags: ${sortTags}`,
    );
    const pages = {
        owner,
        repo,
        per_page: 100,
    };

    const versionPrefixes = getVersionPrefixes(tagPrefix);

    let search_str;

    if (ignore_v_when_searching) {
        search_str = `^(v)?${escapeRegExp(versionPrefixes.without_v)}`;
    } else {
        search_str = `^${tagPrefix}`;
    }
    const search_re = RegExp(search_str);
    async function createTagList(_fromReleases: boolean): Promise<string[]> {
        let allNames: string[];
        let used = 0;
        if (_fromReleases) {
            allNames = await octokit.paginate(octokit.rest.repos.listReleases, pages, response =>
                response.data.map(item => item.tag_name),
            );
            used = process.memoryUsage().heapUsed / 1024 / 1024;
            core.debug(
                `(${
                    Math.round(used * 100) / 100
                } MB) getLatestTag received tags from releases: found ${allNames.length}`,
            );
        } else {
            allNames = await octokit.paginate(octokit.rest.repos.listTags, pages, response =>
                response.data.map(item => item.name),
            );
            used = process.memoryUsage().heapUsed / 1024 / 1024;
            core.debug(
                `(${Math.round(used * 100) / 100} MB) getLatestTag received tags from tags: found ${
                    allNames.length
                }`,
            );
        }
        return allNames;
    }
    function getMatchedTags(allTagsArray: string[]): VersionObject[] {
        const tagsList: VersionObject[] = [];

        for (const tag of allTagsArray) {
            if (tag.match(search_re)) {
                if (!sortTags) {
                    core.debug(`getLatestTag returns ${JSON.stringify(tag)}`);
                    // Assume that the API returns the most recent tag(s) first.
                    tagsList.push(parseVersionString(tag));
                    return tagsList;
                }
                const used = process.memoryUsage().heapUsed / 1024 / 1024;
                core.debug(`(${Math.round(used * 100) / 100} MB) getMatchedTags adding tag ${tag}`);
                tagsList.push(parseVersionString(tag));
            }
        }
        return tagsList;
    }

    const allTags = await createTagList(fromReleases);
    const tags = getMatchedTags(allTags);

    if (tags.length === 0) {
        core.debug(`getLatestTag found 0 tags starting with prefix ${tagPrefix}`);
        return parseVersionString(tagPrefix);
    }
    const usedFin = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(
        `(${Math.round(usedFin * 100) / 100} MB) getLatestTag found ${
            tags.length
        } tags starting with prefix ${tagPrefix}`,
    );
    core.debug(`getLatestTag found these tags: ${JSON.stringify(tags)}`);

    tags.sort(cmpTags);
    const [latestTag] = tags.slice(-1);
    core.debug(`getLatestTag returns ${latestTag}`);
    return latestTag;
}

function cmp(a: number | string | undefined, b: number | string | undefined): number {
    if (a === undefined && b === undefined) {
        return 0;
    }
    if (a === undefined) {
        return 1;
    }
    if (b === undefined) {
        return -1;
    }

    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}
export function cmpTags(a: VersionObject, b: VersionObject): number {
    const order = ['major', 'minor', 'patch', 'legacy_build_number', 'label', 'build'];

    let i = 0;
    let result = 0;
    /* try getting a different result from 0 (equal)
     * as long as we have extra properties to compare
     */

    while (result === 0 && i < order.length) {
        const k = order[i] as keyof VersionObject;
        result = cmp(
            getKeyValue<keyof VersionObject, VersionObject>(k)(a),
            getKeyValue<keyof VersionObject, VersionObject>(k)(b),
        );

        i++;
    }

    return result;
}
