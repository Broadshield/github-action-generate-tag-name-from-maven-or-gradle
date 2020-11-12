const Maven = require('./lib/appVersionMaven.mjs')
const Gradle = require('./lib/appVersionGradle.mjs')
const Utils = require('./lib/utils.mjs')


// import { basename, normalize_version } from "./lib/utils.mjs"
// import { cmpTags } from "./lib/latestTag.mjs"
test('version from tests/pom.xml to equal 1.0.0', () => {
    Maven.app_version('./tests/pom.xml').then(data => {
        expect(data).toBe('1.0.0');
    });
});
test('version from tests/build.gradle to equal 1.0.0', () => {
    Gradle.app_version('./tests/build.gradle').then(data => {
        expect(data).toBe('1.0.0-SNAPSHOT');
    });
});

test('Normalize utility takes 1.0.0-SNAPSHOT and returns 1.0.0', () => {
    expect(Utils.normalize_version('1.0.0-SNAPSHOT')).toBe('1.0.0');
});

test('Normalize utility takes 1.0.1-PR123.1 and returns 1.0.1', () => {
    expect(Utils.normalize_version('1.0.1-PR123.1')).toBe('1.0.1');
});

test('Normalize utility takes "" and returns the default value 0.0.1', () => {
    expect(Utils.normalize_version('', '0.0.1')).toBe('0.0.1');
});

test('Basename utility takes refs/tags/1.2.3 and returns 1.2.3', () => {
    expect(Utils.basename('refs/tags/1.2.3')).toBe('1.2.3');
});

test('stripRefs utility takes refs/tags/1.2.3 and returns 1.2.3', () => {
    expect(Utils.stripRefs('refs/tags/1.2.3')).toBe('1.2.3');
});

test('stripRefs utility takes refs/heads/feature/UNICORN-1234-new-thing and returns feature/UNICORN-1234-new-thing', () => {
    expect(Utils.stripRefs('refs/heads/feature/UNICORN-1234-new-thing')).toBe('feature/UNICORN-1234-new-thing');
});

test(`repoSplit utility takes Broadshield/api and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
    expect(Utils.repoSplit('Broadshield/api')).toEqual({owner: 'Broadshield', repo: 'api'});
});

test(`repoSplit utility takes null, has context available and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
    const context = {
        payload: {
            repository: {
                owner: {
                    login: 'Broadshield'
                },
                name: 'api'
            }
        }
    };
    Utils.context = context;
    expect(Utils.repoSplit(null)).toEqual({owner: 'Broadshield', repo: 'api'});
});
