export interface Repo {
    owner: string;
    repo: string;
}
export interface VersionPrefixes {
    without_v: string;
    with_v: string;
}
export declare const getKeyValue: <U extends keyof T, T extends object>(key: U) => (obj: T) => T[U];
export interface VersionObject {
    with_v?: string;
    major: number;
    minor_prefix?: string;
    minor?: number;
    patch_prefix?: string;
    patch?: number;
    legacy_build_prefix?: string;
    legacy_build_number?: number;
    label_prefix?: string;
    label?: string;
    build?: number;
}
