import { VersionObject } from './interfaces';
export declare class VersionObjectBuilder {
    private _vo;
    constructor();
    major(major: number): VersionObjectBuilder;
    minor(minor: number): VersionObjectBuilder;
    patch(patch: number): VersionObjectBuilder;
    legacy_build_number(legacy_build_number: number): VersionObjectBuilder;
    buildNum(build: number): VersionObjectBuilder;
    with_v(with_v: string): VersionObjectBuilder;
    minor_prefix(minor_prefix: string): VersionObjectBuilder;
    patch_prefix(patch_prefix: string): VersionObjectBuilder;
    legacy_build_prefix(legacy_build_prefix: string): VersionObjectBuilder;
    label_prefix(label_prefix: string): VersionObjectBuilder;
    label(label: string): VersionObjectBuilder;
    build(): VersionObject;
}
