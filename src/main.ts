import * as core from '@actions/core';
import * as github from '@actions/github';

import { app_version } from './appVersion';
import { Bump, Repo } from './interfaces';
import {
  basename,
  bumper,
  getLatestTag,
  getVersionPrefixes,
  normalize_version,
  repoSplit,
  stripRefs,
} from './utils';
import { VersionObject } from './versionObject';

async function run(): Promise<void> {
  try {
    const { context } = github;

    const { ref } = context.payload;
    const github_token: string | undefined =
      core.getInput('github_token', { required: false }) || process.env.GITHUB_TOKEN || undefined;
    const branch: string | undefined = core.getInput('branch', { required: false });
    const tmpPr: number = parseInt(core.getInput('pr_number', { required: false }) ?? 0, 10);
    const { pull_request } = context.payload;
    const pr = pull_request && tmpPr === 0 ? pull_request.number : tmpPr;

    const filepath = core.getInput('filepath', { required: true })?.trim();
    const default_version = core.getInput('default_version', { required: false })?.trim();
    const tag_prefix = core.getInput('tag_prefix', { required: false })?.trim();
    const releases_only = core.getInput('releases_only', { required: false })?.trim() === 'true';
    const sort_tags = core.getInput('sort_tags', { required: false })?.trim() === 'true';
    const bump: Bump = core.getInput('bump', { required: false })?.trim().toLowerCase() as Bump;
    const release_branch = core.getInput('release_branch', { required: true })?.trim();
    /*  TODO: Add v prepending */
    const prepend_v = core.getBooleanInput('prepend_v', { required: false });
    const ignore_v_when_searching = core.getBooleanInput('ignore_v_when_searching', {
      required: false,
    });

    core.debug('Loading octokit: started');

    if (!github_token) {
      core.setFailed('github_token not supplied');
      return;
    }
    const octokit = github.getOctokit(github_token);

    // new Octokit({
    //   auth: github_token,
    //   userAgent: 'github-action-generate-tag-name-from-maven-or-gradle v1.0.0'
    // })
    core.debug('Loading octokit: completed');
    // It's somewhat safe to assume that the most recently created release is actually latest.
    const sortTagsDefault = releases_only ? 'false' : 'true';
    const sortTags = (`${sort_tags}` || sortTagsDefault).toLowerCase() === 'true';
    const baseBranch: string = branch || (ref as string);
    const br = stripRefs(baseBranch);
    const is_release_branch = br?.startsWith(release_branch) || false;
    const bump_item: Bump = !is_release_branch ? 'build' : bump;
    const repository =
      core.getInput('repository', { required: false }) || process.env.GITHUB_REPOSITORY || null;

    let repos: null | Repo = null;

    try {
      repos = repoSplit(repository, context);
    } catch (error) {
      core.setFailed(`Action failed with error: ${error}`);
    }
    if (!repos) {
      core.setFailed('Action failed with error: No repository information available');
      return;
    }

    const appVersion = normalize_version(app_version(filepath), default_version);
    core.debug(`appVersion: ${appVersion}`);
    const prefix = tag_prefix || appVersion;
    let suffix: string | undefined;

    if (pr) {
      suffix = `PR${pr}`;
    } else if (br) {
      suffix = basename(br)?.replace(/\./g, '-');
    }
    const versionObj = new VersionObject(prefix);
    const searchPrefix = versionObj.prefixString(bump_item, suffix, is_release_branch);

    const latestGitTag = await getLatestTag(
      repos.owner,
      repos.repo,
      searchPrefix,
      releases_only,
      sortTags,
      ignore_v_when_searching,
      octokit,
    );

    const tag_name = bumper(latestGitTag, bump_item, is_release_branch);
    const tagOptions = getVersionPrefixes(tag_name);
    core.setOutput('tag_name_with_v', tagOptions.with_v);
    core.setOutput('tag_name_without_v', tagOptions.without_v);
    core.setOutput('tag_name', prepend_v ? tagOptions.with_v : tagOptions.without_v);
    core.setOutput('app_version', appVersion);
    core.setOutput('search_prefix', searchPrefix);
    core.setOutput('prefix', prefix);
    core.setOutput('suffix', suffix);
    core.setOutput('bump_item', bump_item);
    core.setOutput('latest_git_tag', latestGitTag.toString());
    core.setOutput('is_release_branch', is_release_branch);
    core.info(`Tag Name: ${tag_name}`);
    core.info(`App Version: ${appVersion}`);
    core.info(`Search Prefix: ${searchPrefix}`);
  } catch (error) {
    core.setFailed(`ERROR: ${error}`);
  }
}
await Promise.resolve(run());
