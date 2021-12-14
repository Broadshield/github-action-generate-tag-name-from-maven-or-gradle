import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { GitHub } from '@actions/github/lib/utils';

import { Bump, Repo } from './interfaces';
import {
    VersionObject,
    VersionObjectValues,
    VersionPrefixes,
    VersionRecords,
} from './versionObject';

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

export function bumper(
    versionObj: VersionObject,
    bumping: Bump,
    is_release_branch: boolean,
): string {
    const newVersion = versionObj.bump(bumping);

    core.debug(`bumper() passed version object ${versionObj.toString()} and bumping ${bumping}}`);
    if (!is_release_branch) {
        core.debug(`bumper() not in release branch will return ${newVersion.toString()}`);
        return newVersion.toString();
    } else {
        core.debug(`bumper() in release branch will return ${newVersion.releaseString()}`);
        return newVersion.releaseString();
    }
}

export function getVersionPrefixes(str: string): VersionPrefixes {
    const search_re = /^([Vv])?(?<version>.*)/;
    const matcher = str?.match(search_re);
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(`(${Math.round(used * 100) / 100} MB) getVersionPrefixes passed ${str}`);
    if (!matcher || !matcher.groups || !matcher.groups.version) {
        throw new Error("getVersionPrefixes: Version can't be found in string");
    }

    return { without_v: matcher.groups.version, with_v: `v${matcher.groups.version}` };
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
                    core.debug(`getLatestTag returns ${tag}`);
                    // Assume that the API returns the most recent tag(s) first.
                    try {
                        tagsList.push(new VersionObject(tag));
                    } catch (err) {
                        // ignore invalid tags
                    }
                    return tagsList;
                }
                const used = process.memoryUsage().heapUsed / 1024 / 1024;
                core.debug(`(${Math.round(used * 100) / 100} MB) getMatchedTags adding tag ${tag}`);
                try {
                    tagsList.push(new VersionObject(tag));
                } catch (err) {
                    // ignore invalid tags
                }
            }
        }
        return tagsList;
    }

    const allTags = await createTagList(fromReleases);
    const tags = getMatchedTags(allTags);

    if (tags.length === 0) {
        core.debug(`getLatestTag found 0 tags starting with prefix ${tagPrefix}`);
        return new VersionObject(tagPrefix);
    }
    const usedFin = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(
        `(${Math.round(usedFin * 100) / 100} MB) getLatestTag found ${
            tags.length
        } tags starting with prefix ${tagPrefix}`,
    );
    core.debug(`getLatestTag found these tags: ${tags.map(t => t.toString())}`);

    tags.sort(cmpTags);
    const [latestTag] = tags.slice(-1);
    core.debug(`getLatestTag returns ${latestTag.toString()}`);
    return latestTag;
}

function cmp(a: VersionObjectValues, b: VersionObjectValues): number {
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
        const k = order[i] as keyof VersionRecords;
        result = cmp(a.data[k], b.data[k]);
        i++;
    }

    return result;
}
