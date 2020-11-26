import {Context} from '@actions/github/lib/context'
import {Repo} from './interfaces'

class Utils {
  basename(path: string): string | null {
    if (!path) return null
    return path.split('/').reverse()[0]
  }

  stripRefs(path: string): string | null {
    if (!path) return null
    return path.replace('refs/heads/', '').replace('refs/tags/', '')
  }

  normalize_version(
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

  repoSplit(
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
}

export default Utils
