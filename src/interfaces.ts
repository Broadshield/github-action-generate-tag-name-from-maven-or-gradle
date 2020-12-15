export interface Repo {
  owner: string
  repo: string
}

export interface VersionPrefixes {
  without_v: string
  with_v: string
}
// v1.1
// v1.7.6
export interface VersionObject {
  with_v?: string
  major: number
  minor_prefix?: string
  minor?: number
  patch_prefix?: string
  patch?: number
  legacy_build_prefix?: string
  legacy_build_number?: number
  label_prefix?: string
  label?: string
  build?: number
}

export function VersionObjectInitializer(): VersionObject {
  const versionObj: VersionObject = {
    with_v: undefined,
    major: 0,
    minor_prefix: '.',
    minor: undefined,
    patch_prefix: '.',
    patch: undefined,
    legacy_build_prefix: undefined,
    legacy_build_number: undefined,
    label_prefix: undefined,
    label: undefined,
    build: undefined
  }
  return versionObj
}
