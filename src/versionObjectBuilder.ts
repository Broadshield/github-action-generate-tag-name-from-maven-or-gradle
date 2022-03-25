import { VersionObject } from './versionObject';

export class VersionObjectBuilder {
  private _vo: VersionObject;

  constructor() {
    this._vo = new VersionObject('0.0.0');
  }

  major(major: number): VersionObjectBuilder {
    this._vo.data.major = major;
    return this;
  }
  minor(minor: number): VersionObjectBuilder {
    this._vo.data.minor = minor;
    return this;
  }
  patch(patch: number): VersionObjectBuilder {
    this._vo.data.patch = patch;
    return this;
  }
  legacy_build_number(legacy_build_number: number): VersionObjectBuilder {
    this._vo.data.legacy_build_number = legacy_build_number;
    return this;
  }
  buildNum(build: number): VersionObjectBuilder {
    this._vo.data.build = build;
    return this;
  }
  // Strings
  with_v(with_v: string): VersionObjectBuilder {
    this._vo.data.with_v = with_v;
    return this;
  }
  minor_prefix(minor_prefix: string): VersionObjectBuilder {
    this._vo.data.minor_prefix = minor_prefix;
    return this;
  }
  patch_prefix(patch_prefix: string): VersionObjectBuilder {
    this._vo.data.patch_prefix = patch_prefix;
    return this;
  }
  legacy_build_prefix(legacy_build_prefix: string): VersionObjectBuilder {
    this._vo.data.legacy_build_prefix = legacy_build_prefix;
    return this;
  }
  label_prefix(label_prefix: string): VersionObjectBuilder {
    this._vo.data.label_prefix = label_prefix;
    return this;
  }
  label(label: string): VersionObjectBuilder {
    this._vo.data.label = label;
    return this;
  }

  build(): VersionObject {
    if (!this._vo.data.version || this._vo.data.version === '0.0.0') {
      this._vo.data.version = this._vo.versionString();
    }
    return this._vo;
  }
}
