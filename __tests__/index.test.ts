import * as core from '@actions/core';
import * as github from '@actions/github';

import { app_version } from '../src/appVersion';
import { Repo } from '../src/interfaces';
import { basename, normalize_version, repoSplit, stripRefs } from '../src/utils';
import { VersionObject } from '../src/versionObject';
import { VersionObjectBuilder } from '../src/versionObjectBuilder';

const inputs = {} as any;

describe('Get Versions', () => {
    beforeAll(() => {
        jest.setTimeout(50000);
        // Mock getInput
        jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
            return inputs[name];
        });
        // Mock error/warning/info/debug
        jest.spyOn(core, 'error').mockImplementation(console.log);
        jest.spyOn(core, 'warning').mockImplementation(console.log);
        jest.spyOn(core, 'info').mockImplementation(console.log);
        jest.spyOn(core, 'debug').mockImplementation(console.log);
    });
    const version1 = new VersionObjectBuilder().major(2).minor(3).patch(1).build();

    const version2 = new VersionObjectBuilder().major(2).minor(3).patch(1).with_v('v').build();

    const version3 = new VersionObjectBuilder()
        .major(2)
        .minor(3)
        .patch(1)
        .with_v('v')
        .label_prefix('-')
        .label('PR1234')
        .buildNum(1)
        .build();

    const version4 = new VersionObjectBuilder()
        .major(2)
        .minor(3)
        .patch(1)
        .with_v('v')
        .label_prefix('-')
        .label('PR1234')
        .buildNum(45)
        .build();

    const version5 = new VersionObjectBuilder()
        .major(2)
        .minor(22)
        .patch(0)
        .with_v('v')
        .patch_prefix('.')
        .minor_prefix('.')
        .buildNum(24)
        .build();

    const version12 = new VersionObjectBuilder()
        .major(0)
        .minor(0)
        .patch(4)
        .patch_prefix('.')
        .minor_prefix('.')
        .build();

    const version13 = new VersionObjectBuilder()
        .major(0)
        .minor(0)
        .patch(41)
        .with_v('v')
        .patch_prefix('.')
        .minor_prefix('.')
        .label_prefix('-')
        .label('org.flywaydb.flyway-7.6.0.1')
        .build();

    test('version from tests/pom.xml to equal 1.0.0', () => {
        expect(app_version('./__tests__/tests/pom.xml')).toBe('1.0.0');
    });

    test('version from tests/build.gradle to equal 1.0.0-SNAPSHOT', () => {
        expect(app_version('./__tests__/tests/build.gradle')).toBe('1.0.0-SNAPSHOT');
    });

    test('version from tests/gradle.properties to equal 1.0.0-SNAPSHOT', () => {
        expect(app_version('./__tests__/tests/gradle.properties')).toBe('1.0.0-SNAPSHOT');
    });

    test(`VersionObject given string v0.0.41-org.flywaydb.flyway-7.6.0.1 should match ${JSON.stringify(
        version13,
    )}`, () => {
        expect(new VersionObject('v0.0.41-org.flywaydb.flyway-7.6.0.1').data).toStrictEqual(
            version13.data,
        );
    });
    test(`VersionObject given string v0.0.41-org.flywaydb.flyway-7.6.0.1 should return the same`, () => {
        expect(new VersionObject('v0.0.41-org.flywaydb.flyway-7.6.0.1').toString()).toStrictEqual(
            'v0.0.41-org.flywaydb.flyway-7.6.0.1',
        );
    });
    test(`new VersionObject given string 2.3.1 should match ${JSON.stringify(
        version1.data,
    )}`, () => {
        expect(new VersionObject('2.3.1').data).toStrictEqual(version1.data);
    });
    test(`new VersionObject given string 0.0.4 should match ${JSON.stringify(
        version12.data,
    )}`, () => {
        expect(new VersionObject('0.0.4').data).toStrictEqual(version12.data);
    });
    test(`new VersionObject given string v2.3.1 should match ${JSON.stringify(
        version2.data,
    )}`, () => {
        expect(new VersionObject('v2.3.1').data).toStrictEqual(version2.data);
    });
    test(`new VersionObject given string v2.3.1-PR1234+1 should match ${JSON.stringify(
        version3.data,
    )}`, () => {
        expect(new VersionObject('v2.3.1-PR1234+1').data).toStrictEqual(version3.data);
    });

    test(`new VersionObject given string v2.3.1-PR1234+45 should match ${JSON.stringify(
        version4.data,
    )}`, () => {
        expect(new VersionObject('v2.3.1-PR1234+45').data).toStrictEqual(version4.data);
    });

    test(`versionObj.toString() given string ${JSON.stringify(
        version4,
    )} should match v2.3.1-PR1234+45`, () => {
        expect(version4.toString()).toStrictEqual('v2.3.1-PR1234+45');
    });

    test(`versionObj.toString() given string ${JSON.stringify(
        version5,
    )} should match v2.22.0+24`, () => {
        expect(version5.toString()).toStrictEqual('v2.22.0+24');
    });
});

describe('normalize utility', () => {
    test('takes string "1.0.0-SNAPSHOT" and returns 1.0.0', () => {
        expect(normalize_version('1.0.0-SNAPSHOT')).toBe('1.0.0');
    });

    test('takes string "1.0.1-PR123.1" and returns 1.0.1', () => {
        expect(normalize_version('1.0.1-PR123.1')).toBe('1.0.1');
    });

    test('takes string "" and returns the default value 0.0.1', () => {
        expect(normalize_version('', '0.0.1')).toBe('0.0.1');
    });
});

describe('basename utility', () => {
    test('takes string "refs/tags/1.2.3" and returns 1.2.3', () => {
        expect(basename('refs/tags/1.2.3')).toBe('1.2.3');
    });
});

describe('stripRefs utility', () => {
    test('take refs/tags/1.2.3 and returns 1.2.3', () => {
        expect(stripRefs('refs/tags/1.2.3')).toBe('1.2.3');
    });

    test('take refs/heads/feature/UNICORN-1234-new-thing and returns feature/UNICORN-1234-new-thing', () => {
        expect(stripRefs('refs/heads/feature/UNICORN-1234-new-thing')).toBe(
            'feature/UNICORN-1234-new-thing',
        );
    });
});

describe('repoSplit utility', () => {
    // Mock github context
    jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
        return {
            repo: 'api',
            owner: 'Broadshield',
        };
    });
    github.context.eventName = 'push';

    const OLD_ENV = process.env;
    const repository = 'Broadshield/api';
    const result: Repo = {
        owner: 'Broadshield',
        repo: 'api',
    };

    beforeEach(() => {
        jest.resetModules(); // most important - it clears the cache
        process.env = { ...OLD_ENV }; // make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });

    test(`take string 'Broadshield/api' and returns object ${JSON.stringify(result)}`, () => {
        expect(repoSplit(repository, github.context)).toStrictEqual(result);
    });

    test(`take null, has environment variable GITHUB_REPOSITORY available and returns object ${JSON.stringify(
        result,
    )}`, () => {
        process.env.GITHUB_REPOSITORY = repository;
        expect(repoSplit(null, github.context)).toStrictEqual(result);
    });

    test(`take null, has context available and returns object ${JSON.stringify(result)}`, () => {
        delete process.env.GITHUB_REPOSITORY;

        expect(repoSplit(null, github.context)).toStrictEqual(result);
    });
});
