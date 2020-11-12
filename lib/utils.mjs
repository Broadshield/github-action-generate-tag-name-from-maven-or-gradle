module.exports = {
    context: null,
    basename: function (path) {
        if (!path) return null;
        return path.split('/').reverse()[0];
    },
    stripRefs: function (path) {
        if (!path) return null;
        return path.replace("refs/heads/", "").replace("refs/tags/", "");
    },
    normalize_version: function (v_string, default_version = '0.0.1') {
        const VERSION_RE = /^([v])?(?<version>[0-9]+\.[0-9]+\.[0-9])/
        let match = VERSION_RE.exec(v_string)
        if (match) {
            return match.groups.version
        } else {
            return default_version
        }
    },
    repoSplit: function (inputRepo) {
        if (inputRepo) {
            const [owner, repo] = inputRepo.split('/')
            return { owner, repo }
        }
        if (process.env.GITHUB_REPOSITORY) {
            const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
            return { owner, repo }
        }

        if (this.context.payload.repository) {
            return {
                owner: this.context.payload.repository.owner.login,
                repo: this.context.payload.repository.name
            }
        }
        throw error('context.repo requires a GITHUB_REPOSITORY environment variable like \'owner/repo\'')

    }
}