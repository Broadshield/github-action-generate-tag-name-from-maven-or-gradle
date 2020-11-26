import {app_version as maven_app_version} from '../src/appVersionMaven'
import {app_version as gradle_app_version} from '../src/appVersionGradle'
import Utils from '../src/utils'
import {Repo, VersionObject} from '../src/interfaces'
import Tag from '../src/tag'
import {Context} from '@actions/github/lib/context'

const utils = new Utils()

describe('Get Versions', () => {
  test('version from tests/pom.xml to equal 1.0.0', () => {
    expect(maven_app_version('./__tests__/tests/pom.xml')).toBe('1.0.0')
  })

  test('version from tests/build.gradle to equal 1.0.0', () => {
    expect(gradle_app_version('./__tests__/tests/build.gradle')).toBe(
      '1.0.0-SNAPSHOT'
    )
  })
})

describe('normalize utility', () => {
  test('takes string "1.0.0-SNAPSHOT" and returns 1.0.0', () => {
    expect(utils.normalize_version('1.0.0-SNAPSHOT')).toBe('1.0.0')
  })

  test('takes string "1.0.1-PR123.1" and returns 1.0.1', () => {
    expect(utils.normalize_version('1.0.1-PR123.1')).toBe('1.0.1')
  })

  test('takes string "" and returns the default value 0.0.1', () => {
    expect(utils.normalize_version('', '0.0.1')).toBe('0.0.1')
  })
})

describe('basename utility', () => {
  test('takes string "refs/tags/1.2.3" and returns 1.2.3', () => {
    expect(utils.basename('refs/tags/1.2.3')).toBe('1.2.3')
  })
})

describe('stripRefs utility', () => {
  test('take refs/tags/1.2.3 and returns 1.2.3', () => {
    expect(utils.stripRefs('refs/tags/1.2.3')).toBe('1.2.3')
  })

  test('take refs/heads/feature/UNICORN-1234-new-thing and returns feature/UNICORN-1234-new-thing', () => {
    expect(utils.stripRefs('refs/heads/feature/UNICORN-1234-new-thing')).toBe(
      'feature/UNICORN-1234-new-thing'
    )
  })
})

describe('repoSplit utility', () => {
  const OLD_ENV = process.env
  const repository = 'Broadshield/api'
  const context: Context = {
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
  }

  beforeEach(() => {
    jest.resetModules() // most important - it clears the cache
    process.env = {...OLD_ENV} // make a copy
  })

  afterAll(() => {
    process.env = OLD_ENV // restore old env
  })

  test(`take string 'Broadshield/api' and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
    expect(utils.repoSplit(repository, context)).toEqual({
      owner: 'Broadshield',
      repo: 'api'
    })
  })

  test(`take null, has environment variable GITHUB_REPOSITORY available and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
    process.env.GITHUB_REPOSITORY = repository
    expect(utils.repoSplit(null, context)).toEqual({
      owner: 'Broadshield',
      repo: 'api'
    })
  })

  test(`take null, has context available and returns object {owner: 'Broadshield', repo: 'api'}`, () => {
    delete process.env.GITHUB_REPOSITORY

    expect(utils.repoSplit(null, context)).toEqual({
      owner: 'Broadshield',
      repo: 'api'
    })
  })
})
