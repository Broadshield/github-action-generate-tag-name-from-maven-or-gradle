const Maven = require('./lib/appVersionMaven.mjs')
const Gradle = require('./lib/appVersionGradle.mjs')
const Utils = require('./lib/utils.mjs')


describe('Get Versions', () => {
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
});

describe('normalize utility', () => {
    test('takes string "1.0.0-SNAPSHOT" and returns 1.0.0', () => {
        expect(Utils.normalize_version('1.0.0-SNAPSHOT')).toBe('1.0.0');
    });

    test('takes string "1.0.1-PR123.1" and returns 1.0.1', () => {
        expect(Utils.normalize_version('1.0.1-PR123.1')).toBe('1.0.1');
    });

    test('takes string "" and returns the default value 0.0.1', () => {
        expect(Utils.normalize_version('', '0.0.1')).toBe('0.0.1');
    });
});

describe('basename utility', () => {
    test('takes string "refs/tags/1.2.3" and returns 1.2.3', () => {
        expect(Utils.basename('refs/tags/1.2.3')).toBe('1.2.3');
    });
});

describe('stripRefs utility', () => {
    test('take refs/tags/1.2.3 and returns 1.2.3', () => {
        expect(Utils.stripRefs('refs/tags/1.2.3')).toBe('1.2.3');
    });

    test('take refs/heads/feature/UNICORN-1234-new-thing and returns feature/UNICORN-1234-new-thing', () => {
        expect(Utils.stripRefs('refs/heads/feature/UNICORN-1234-new-thing')).toBe('feature/UNICORN-1234-new-thing');
    });
});

describe('repoSplit utility', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules() // most important - it clears the cache
        process.env = { ...OLD_ENV }; // make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    test(`take string 'Broadshield/api' and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
        process.env.GITHUB_REPOSITORY = 'Broadshield/api'
        expect(Utils.repoSplit('Broadshield/api')).toEqual({ owner: 'Broadshield', repo: 'api' });
    });

    test(`take null, has environment variable GITHUB_REPOSITORY available and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
        process.env.GITHUB_REPOSITORY = 'Broadshield/api'
        expect(Utils.repoSplit(null)).toEqual({ owner: 'Broadshield', repo: 'api' });
    });

    test(`take null, has context available and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
        delete process.env.GITHUB_REPOSITORY
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
        expect(Utils.repoSplit(null)).toEqual({ owner: 'Broadshield', repo: 'api' });
    });
});
