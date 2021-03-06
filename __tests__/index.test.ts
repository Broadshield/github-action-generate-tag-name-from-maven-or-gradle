/* eslint-disable @typescript-eslint/no-unused-vars */
import * as core from '@actions/core'
import * as github from '@actions/github'

import { app_version as gradle_app_version } from '../src/appVersionGradle'
import { app_version as maven_app_version } from '../src/appVersionMaven'
import { Repo } from '../src/interfaces'
import { basename, normalize_version, parseVersionString, repoSplit, stripRefs, versionObjToString } from '../src/utils'
import { VersionObjectBuilder } from '../src/versionObjectBuilder'

let inputs = {} as any

describe('Get Versions', () => {
  beforeAll(() => {
    jest.setTimeout(50000)
    // Mock getInput
    jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      // eslint-disable-next-line security/detect-object-injection
      return inputs[name]
    })
    // Mock error/warning/info/debug
    jest.spyOn(core, 'error').mockImplementation(console.log)
    jest.spyOn(core, 'warning').mockImplementation(console.log)
    jest.spyOn(core, 'info').mockImplementation(console.log)
    jest.spyOn(core, 'debug').mockImplementation(console.log)
  })
  let version1 = new VersionObjectBuilder().major(2).minor(3).patch(1).build()

  let version2 = new VersionObjectBuilder().major(2).minor(3).patch(1).with_v('v').build()

  let version3 = new VersionObjectBuilder()
    .major(2)
    .minor(3)
    .patch(1)
    .with_v('v')
    .label_prefix('-')
    .label('PR1234')
    .buildNum(1)
    .build()

  let version4 = new VersionObjectBuilder()
    .major(2)
    .minor(3)
    .patch(1)
    .with_v('v')
    .label_prefix('-')
    .label('PR1234')
    .buildNum(45)
    .build()

  let version5 = new VersionObjectBuilder()
    .major(2)
    .minor(22)
    .patch(0)
    .with_v('v')
    .patch_prefix('.')
    .minor_prefix('.')
    .buildNum(24)
    .build()

  test('version from tests/pom.xml to equal 1.0.0', () => {
    expect(maven_app_version('./__tests__/tests/pom.xml')).toBe('1.0.0')
  })

  test('version from tests/build.gradle to equal 1.0.0', () => {
    expect(gradle_app_version('./__tests__/tests/build.gradle')).toBe('1.0.0-SNAPSHOT')
  })

  test(`parseVersionString given string 2.3.1 should match ${JSON.stringify(version1)}`, () => {
    expect(parseVersionString('2.3.1')).toStrictEqual(version1)
  })
  test(`parseVersionString given string v2.3.1 should match ${JSON.stringify(version2)}`, () => {
    expect(parseVersionString('v2.3.1')).toStrictEqual(version2)
  })
  test(`parseVersionString given string v2.3.1-PR1234+1 should match ${JSON.stringify(version3)}`, () => {
    expect(parseVersionString('v2.3.1-PR1234+1')).toStrictEqual(version3)
  })

  test(`parseVersionString given string v2.3.1-PR1234+45 should match ${JSON.stringify(version4)}`, () => {
    expect(parseVersionString('v2.3.1-PR1234+45')).toStrictEqual(version4)
  })

  test(`versionObjToString given string ${JSON.stringify(version4)} should match v2.3.1-PR1234+45}`, () => {
    expect(versionObjToString(version4)).toStrictEqual('v2.3.1-PR1234+45')
  })

  test(`versionObjToString given string ${JSON.stringify(version5)} should match v2.22.0+24}`, () => {
    expect(versionObjToString(version5)).toStrictEqual('v2.22.0+24')
  })
})

describe('normalize utility', () => {
  test('takes string "1.0.0-SNAPSHOT" and returns 1.0.0', () => {
    expect(normalize_version('1.0.0-SNAPSHOT')).toBe('1.0.0')
  })

  test('takes string "1.0.1-PR123.1" and returns 1.0.1', () => {
    expect(normalize_version('1.0.1-PR123.1')).toBe('1.0.1')
  })

  test('takes string "" and returns the default value 0.0.1', () => {
    expect(normalize_version('', '0.0.1')).toBe('0.0.1')
  })
})

describe('basename utility', () => {
  test('takes string "refs/tags/1.2.3" and returns 1.2.3', () => {
    expect(basename('refs/tags/1.2.3')).toBe('1.2.3')
  })
})

describe('stripRefs utility', () => {
  test('take refs/tags/1.2.3 and returns 1.2.3', () => {
    expect(stripRefs('refs/tags/1.2.3')).toBe('1.2.3')
  })

  test('take refs/heads/feature/UNICORN-1234-new-thing and returns feature/UNICORN-1234-new-thing', () => {
    expect(stripRefs('refs/heads/feature/UNICORN-1234-new-thing')).toBe('feature/UNICORN-1234-new-thing')
  })
})

describe('repoSplit utility', () => {
  // Mock github context
  jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
    return {
      repo: 'api',
      owner: 'Broadshield'
    }
  })
  github.context.eventName = 'push'

  const OLD_ENV = process.env
  const repository = 'Broadshield/api'
  const result: Repo = {
    owner: 'Broadshield',
    repo: 'api'
  }

  beforeEach(() => {
    jest.resetModules() // most important - it clears the cache
    process.env = { ...OLD_ENV } // make a copy
  })

  afterAll(() => {
    process.env = OLD_ENV // restore old env
  })

  test(`take string 'Broadshield/api' and returns object ${JSON.stringify(result)}`, () => {
    expect(repoSplit(repository, github.context)).toStrictEqual(result)
  })

  test(`take null, has environment variable GITHUB_REPOSITORY available and returns object ${JSON.stringify(
    result
  )}`, () => {
    process.env.GITHUB_REPOSITORY = repository
    expect(repoSplit(null, github.context)).toStrictEqual(result)
  })

  test(`take null, has context available and returns object ${JSON.stringify(result)}`, () => {
    delete process.env.GITHUB_REPOSITORY

    expect(repoSplit(null, github.context)).toStrictEqual(result)
  })
})
