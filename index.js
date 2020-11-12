
const { Toolkit } = require('actions-toolkit')
const Maven = require('./lib/appVersionMaven.mjs')
const Gradle = require('./lib/appVersionGradle.mjs')
const Utils = require('./lib/utils.mjs')
const Tag = require("./lib/tag.mjs")


Toolkit.run(async tools => {
    const { context } = tools
    tools.log.info(`Event type is: ${context.event}`)
    const {
        number,
        ref,
        sha,
    } = context.payload

    const {
        branch,
        pr_number,
        filepath,
        default_version,
        tag_prefix,
        releases_only,
        sort_tags,
        bump,
        release_branch,
    } = tools.inputs




    // It's somewhat safe to assume that the most recently created release is actually latest.
    const sortTagsDefault = (releases_only ? "false" : "true");
    const sortTags = (sort_tags || sortTagsDefault).toLowerCase() === "true";

    const br = Utils.stripRefs(branch || ref)
    const bump_item = br != release_branch ? 'build' : bump
    const pr = pr_number || number


    let repos

    Utils.context = context
    try {
        repos = Utils.repoSplit(repository)
    } catch (e) {
        tools.exit.failure(e)
        return null
    }

    const appVersion = Utils.normalize_version(await Maven.app_version(filepath) || await Gradle.app_version(filepath), default_version)
    const prefix = tag_prefix || appVersion

    let searchPrefix
    if (bump_item == 'build') {
        let suffix = 'alpha'
        if (pr) {
            suffix = `PR${pr}`
        } else if (br) {
            suffix = Utils.basename(br)
        }
        searchPrefix = `${prefix}-${suffix}`
    } else {
        searchPrefix = getVersionStringPrefix(prefix, bump_item)
    }

    const latestGitTag = await getLatestTag(repos.owner, repos.repo, searchPrefix, releasesOnly, sortTags)

    tools.outputs.tag_name = bumper(latestGitTag)
    tools.outputs.app_version = appVersion
    tools.outputs.search_prefix = searchPrefix
    console.log(`Tag Name: ${tools.outputs.tag_name}`)
    console.log(`App Version: ${tools.outputs.app_version}`)
    console.log(`Search Prefix: ${tools.outputs.search_prefix}`)

    function bumper(fullTag, bumping) {
        // v1.2.3-PR1234.3
        const search_re = /^(v)?(?<version>[0-9]+\.[0-9]+\.[0-9])(_[0-9])?(?<alpha>-.*)?(?<buildnumber>\.[0-9]+)?$/
        let groups = fullTag.match(search_re).groups
        const version = groups.version
        const alpha = groups.alpha
        const buildnumber = parseInt(groups.buildnumber || "0")

        if (bumping == 'build') {
            return `${version}-${alpha}.${buildnumber + 1}`
        } else if (bumping in ['major', 'minor', 'patch']) {
            const versionObj = parseVersionString(version)
            if (bumping == 'major') {
                versionObj.major += 1
                versionObj.minor = 0
                versionObj.patch = 0
            }
            else if (bumping == 'minor') {
                versionObj.minor += 1
                versionObj.patch = 0
            } else if (bumping == 'patch') {
                versionObj.patch += 1
            }
            return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`
        } else {
            throw (`Bump value must be one of: major, minor, or patch. Instead '${bumping}' was given`)
        }
    }

    function parseVersionString(str) {
        if (typeof (str) != 'string') { return false; }
        var x = str.split('.');
        // parse from string or default to 0 if can't parse
        var maj = parseInt(x[0]) || 0;
        var min = parseInt(x[1]) || 0;
        var pat = parseInt(x[2]) || 0;
        return {
            major: maj,
            minor: min,
            patch: pat
        }
    }

    function getVersionStringPrefix(versionObj, bumping) {
        if (bumping in ['major', 'minor', 'patch']) {
            if (bumping == 'major') {
                return ``
            }
            else if (bumping == 'minor') {
                return `${versionObj.major}.`
            } else if (bumping == 'patch') {
                versionObj.patch += 1
            }
        } else {
            return `${versionObj.major}.${versionObj.minor}`
        }
    }

    async function getLatestTag(owner, repo, tagPrefix, fromReleases, sortTags) {
        const tool = (fromReleases ? tools.github.repos.listReleases : tools.github.repos.listTags);
        const pages = tool.endpoint.merge({ "owner": owner, "repo": repo, "per_page": 100 });

        const tags = [];
        for await (const item of Tag.getItemsFromPages(pages, iterator = tools.github.paginate.iterator)) {
            const tag = (fromReleases ? item["tag_name"] : item["name"]);
            if (!tag.startsWith(tagPrefix)) {
                continue;
            }
            if (!sortTags) {
                // Assume that the API returns the most recent tag(s) first.
                return tag;
            }
            tags.push(tag);
        }
        if (tags.length === 0) {
            return tagPrefix;
        }
        tags.sort(Tag.tagUtil.cmpTags);
        const [latestTag] = tags.slice(-1);
        return latestTag;
    }

})