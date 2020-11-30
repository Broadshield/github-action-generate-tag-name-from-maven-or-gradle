export interface Repo {
  owner: string
  repo: string
}

export interface VersionPrefixes {
  without_v: string
  with_v: string
}

export interface VersionObject {
  major: number
  minor: number
  patch: number
  label?: string
  build?: number
  with_v?: string
}
