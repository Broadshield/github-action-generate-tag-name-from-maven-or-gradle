import * as core from '@actions/core';

import { Bump, BumpType } from './interfaces';

export const LABEL_PREFIX = core.getInput('label_delimiter', { required: false }) || '-';
export const BUILD_PREFIX = core.getInput('build_delimiter', { required: false }) || '+';
export type VersionFieldType = string | number;
export interface VersionPrefixes {
  without_v: string;
  with_v: string;
}
export type VersionObjectStringRecordValueType = string | undefined;
export type VersionObjectNumberRecordValueType = number | undefined;

export type VersionObjectStrings =
  | 'with_v'
  | 'minor_prefix'
  | 'patch_prefix'
  | 'legacy_build_prefix'
  | 'label_prefix'
  | 'label'
  | 'version'
  | 'rawVersion';
export type VersionObjectNumbers = 'major' | 'minor' | 'patch' | 'legacy_build_number' | 'build';
export type VersionObjectKeys = VersionObjectStrings | VersionObjectNumbers;
export type VersionObjectValues =
  | VersionObjectStringRecordValueType
  | VersionObjectNumberRecordValueType;

export interface VersionRecords {
  [index: string]: VersionObjectValues;
  with_v?: string;
  minor_prefix?: string;
  patch_prefix?: string;
  legacy_build_prefix?: string;
  label_prefix?: string;
  label?: string;
  version?: string;
  major?: number;
  minor?: number;
  patch?: number;
  legacy_build_number?: number;
  build?: number;
}

export class VersionObject {
  data: VersionRecords;
  rawVersion?: string;
  rawBuild?: string;
  rawLabel?: string;
  version_regex =
    /^(?<with_v>v)?(?<version>(?<major>[\d]+)(?<minor_prefix>\.)?(?<minor>[\d]+)?(?<patch_prefix>\.)?(?<patch>[\d]+)?)((?<legacy_build_prefix>_)(?<legacy_build_number>[\d]+))?/;
  build_regex = /\+(?<build>[\d]+$)$/;
  label_regex = /(?<label_prefix>[-_])(?<label>.*)/;

  get with_v(): VersionObjectStringRecordValueType {
    return this.data.with_v;
  }
  get version(): VersionObjectStringRecordValueType {
    return this.data.version;
  }
  get major(): number {
    return this.data.major || 0;
  }
  get minor(): number {
    return this.data.minor || 0;
  }
  get patch(): number {
    return this.data.patch || 0;
  }
  get minor_prefix(): string {
    return this.data.minor_prefix || '.';
  }
  get patch_prefix(): string {
    return this.data.patch_prefix || '.';
  }
  get legacy_build_number(): VersionObjectNumberRecordValueType {
    return this.data.legacy_build_number;
  }
  get build(): VersionObjectNumberRecordValueType {
    return this.data.build;
  }
  get label(): VersionObjectStringRecordValueType {
    return this.data.label;
  }

  constructor(v?: string | VersionObject) {
    this.data = {} as VersionRecords;
    if (v !== undefined) {
      if (typeof v === 'string') {
        this.rawVersion = v;
        this.parse();
      } else {
        if (v.rawVersion !== undefined) {
          this.rawVersion = v.rawVersion;
          this.parse();
        }
        for (const key in v) {
          if (v.data[key] !== undefined) {
            this.data[key] = v.data[key];
          }
        }
      }
    }
  }

  parse(): void {
    const matcher = this.rawVersion?.match(this.version_regex);
    core.debug(`parse(): passed ${this.rawVersion}`);
    if (!matcher || matcher.groups === undefined) {
      core.error(`parse(): Version can't be found in string: ${this.rawVersion}`);
      throw Error(`Version can't be found in string: ${this.rawVersion}`);
    }
    for (const key in matcher.groups) {
      if (['major', 'minor', 'patch'].includes(key)) {
        this.data[key] = parseInt(matcher.groups[key]) || 0;
      } else if (['legacy_build_number'].includes(key)) {
        this.data[key] = parseInt(matcher.groups[key]) || undefined;
      } else {
        this.data[key] = matcher.groups[key] || undefined;
      }
    }
    this.rawBuild = this.rawVersion?.substr(matcher[0].length);
    // Get the build number if it exists
    if (this.rawBuild) {
      const matcher1 = this.rawBuild.match(this.build_regex);
      let len1 = 0;
      if (matcher1 && matcher1.groups) {
        len1 = matcher1[0].length;
        for (const key in matcher1.groups) {
          if (['build'].includes(key)) {
            this.data[key] = parseInt(matcher1.groups[key]) || undefined;
          } else {
            this.data[key] = matcher1.groups[key] || undefined;
          }
        }
      }

      this.rawLabel = this.rawBuild.substr(0, this.rawBuild.length - len1);
      // Get the label if it exists
      if (this.rawLabel) {
        const matcher2 = this.rawLabel.match(this.label_regex);
        if (matcher2 && matcher2.groups) {
          for (const key in matcher2.groups) {
            this.data[key] = matcher2.groups[key] || undefined;
          }
        }
      }
    }
    core.debug(`parse() created ${JSON.stringify(this.data)}`);
  }

  toArray(): VersionFieldType[] {
    const vArray: VersionFieldType[] = [];
    vArray.push(this.undfEmpty(this.data.with_v));
    vArray.push(this.major);
    vArray.push(this.minor_prefix);
    vArray.push(this.minor);
    vArray.push(this.patch_prefix);
    vArray.push(this.patch);
    vArray.push(this.undfEmpty(this.data.legacy_build_prefix));
    vArray.push(this.undfEmpty(this.data.legacy_build_number));
    vArray.push(this.undfEmpty(this.data.label_prefix));
    vArray.push(this.undfEmpty(this.data.label));
    vArray.push(this.data.build === undefined ? BUILD_PREFIX : '');
    vArray.push(this.undfEmpty(this.data.build));

    core.debug(`ToArray() passed ${JSON.stringify(this.data)} returns ${vArray.join('')}`);
    return vArray;
  }

  undfEmpty(vStr?: VersionFieldType): string {
    if (vStr === undefined) {
      return '';
    }
    return vStr.toString();
  }
  bump(bumpType: Bump): VersionObject {
    const v = new VersionObject(this);
    switch (bumpType) {
      case BumpType.Major:
        v.data.major = v.major + 1;
        v.data.minor = 0;
        v.data.patch = 0;
        break;
      case BumpType.Minor:
        v.data.minor = v.minor + 1;
        v.data.patch = 0;
        break;
      case BumpType.Patch:
        v.data.patch = v.patch + 1;
        break;
      case BumpType.Build:
        v.data.build = (v.data.build || 0) + 1;
        break;
      default:
        throw Error(`BumpType ${bumpType} not supported`);
    }
    return v;
  }
  versionString(): string {
    const vStr = `${this.data.major}${this.minor_prefix}${this.minor}${this.patch_prefix}${this.patch}`;

    core.debug(`versionString() returns ${vStr}`);
    return vStr;
  }
  releaseString(display_v?: boolean): string {
    const should_display_v: boolean =
      display_v === undefined ? this.data.with_v?.toLowerCase() === 'v' : display_v;
    if (should_display_v) {
      return `v${this.versionString()}`;
    } else {
      return `${this.versionString()}`;
    }
  }
  toString(): string {
    const vStr = `${this.releaseString()}${this.undfEmpty(
      this.data.legacy_build_prefix
    )}${this.undfEmpty(this.data.legacy_build_number)}${this.undfEmpty(
      this.data.label_prefix
    )}${this.undfEmpty(this.data.label)}${this.undfEmpty(
      this.data.build ? BUILD_PREFIX : ''
    )}${this.undfEmpty(this.data.build)}`;

    core.debug(`toString() passed ${JSON.stringify(this.data)} returns ${vStr}`);
    return vStr;
  }
  prefixString(bumping: Bump, suffix: string | undefined, is_release_branch: boolean): string {
    let result;
    switch (bumping) {
      case BumpType.Major:
        result = '';
        break;
      case BumpType.Minor:
        result = `${this.major}.`;
        break;
      case BumpType.Patch:
        result = `${this.major}.${this.minor}`;
        break;
      case BumpType.Build:
        result = `${this.major}.${this.minor}.${this.patch}`;
        if (!is_release_branch && (this.label || suffix)) {
          result = `${result}${LABEL_PREFIX}${this.label || suffix || ''}`;
        }
        break;
      default:
        throw Error(`BumpType ${bumping} not supported`);
    }

    if (this.with_v) {
      result = `${this.undfEmpty(this.with_v)}${result}`;
    }
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    core.debug(
      `(${Math.round(used * 100) / 100} MB) prefixString(): passed ${JSON.stringify(
        this
      )} and bumping ${bumping} and returns ${result}`
    );
    return result;
  }
}
