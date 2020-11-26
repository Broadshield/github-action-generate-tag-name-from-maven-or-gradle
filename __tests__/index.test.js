"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var appVersionMaven_1 = require("../src/appVersionMaven");
var appVersionGradle_1 = require("../src/appVersionGradle");
var utils_1 = require("../src/utils");
var utils = new utils_1["default"]();
describe('Get Versions', function () {
    test('version from tests/pom.xml to equal 1.0.0', function () {
        expect(appVersionMaven_1.app_version('./__tests__/tests/pom.xml')).toBe('1.0.0');
    });
    test('version from tests/build.gradle to equal 1.0.0', function () {
        expect(appVersionGradle_1.app_version('./__tests__/tests/build.gradle')).toBe('1.0.0-SNAPSHOT');
    });
});
describe('normalize utility', function () {
    test('takes string "1.0.0-SNAPSHOT" and returns 1.0.0', function () {
        expect(utils.normalize_version('1.0.0-SNAPSHOT')).toBe('1.0.0');
    });
    test('takes string "1.0.1-PR123.1" and returns 1.0.1', function () {
        expect(utils.normalize_version('1.0.1-PR123.1')).toBe('1.0.1');
    });
    test('takes string "" and returns the default value 0.0.1', function () {
        expect(utils.normalize_version('', '0.0.1')).toBe('0.0.1');
    });
});
describe('basename utility', function () {
    test('takes string "refs/tags/1.2.3" and returns 1.2.3', function () {
        expect(utils.basename('refs/tags/1.2.3')).toBe('1.2.3');
    });
});
describe('stripRefs utility', function () {
    test('take refs/tags/1.2.3 and returns 1.2.3', function () {
        expect(utils.stripRefs('refs/tags/1.2.3')).toBe('1.2.3');
    });
    test('take refs/heads/feature/UNICORN-1234-new-thing and returns feature/UNICORN-1234-new-thing', function () {
        expect(utils.stripRefs('refs/heads/feature/UNICORN-1234-new-thing')).toBe('feature/UNICORN-1234-new-thing');
    });
});
describe('repoSplit utility', function () {
    var OLD_ENV = process.env;
    var repository = 'Broadshield/api';
    var context = {
        eventName: 'push',
        ref: '/refs/tags/1.0.0',
        actor: 'jamie-github',
        sha: 'abc123',
        workflow: 'test',
        action: 'tag-name-from-gradle-or-maven',
        job: 'unit-tests',
        runNumber: 1,
        runId: 1,
        issue: {
            repo: 'api',
            owner: 'Broadshield',
            number: 1
        },
        repo: {
            repo: 'api',
            owner: 'Broadshield'
        },
        payload: {
            repository: {
                owner: {
                    login: 'Broadshield'
                },
                name: 'api'
            }
        }
    };
    beforeEach(function () {
        jest.resetModules(); // most important - it clears the cache
        process.env = __assign({}, OLD_ENV); // make a copy
    });
    afterAll(function () {
        process.env = OLD_ENV; // restore old env
    });
    test("take string 'Broadshield/api' and returns object {owner: 'Broadshield', repo: 'api'}", function () {
        expect(utils.repoSplit(repository, context)).toEqual({
            owner: 'Broadshield',
            repo: 'api'
        });
    });
    test("take null, has environment variable GITHUB_REPOSITORY available and returns object {owner: 'Broadshield', repo: 'api'}", function () {
        process.env.GITHUB_REPOSITORY = repository;
        expect(utils.repoSplit(null, context)).toEqual({
            owner: 'Broadshield',
            repo: 'api'
        });
    });
    test("take null, has context available and returns object {owner: 'Broadshield', repo: 'api'}", function () {
        delete process.env.GITHUB_REPOSITORY;
        expect(utils.repoSplit(null, context)).toEqual({
            owner: 'Broadshield',
            repo: 'api'
        });
    });
});
