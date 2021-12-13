import * as core from '@actions/core';
import * as fs from 'fs';
import * as properties from 'java-properties';
import * as path from 'path';

export function app_version(path_str: string): string | undefined {
    const ext = path.extname(path_str);
    if (ext !== null && !(ext.toLowerCase() === '.gradle' || ext.toLowerCase() === '.properties')) {
        core.debug(`extension of path_str (${path_str}) isn't .gradle (ext is: ${ext})`);
        return undefined;
    }
    // Check that the file exists locally
    if (!fs.existsSync(path_str)) {
        core.debug(`ERROR: File not found: (${path_str})`);
        return undefined;
    }
    try {
        // Reference a properties file
        const values = properties.of(path_str);
        const version: string | undefined = values.get('version')?.toString().replace(/'/g, '');

        return version === undefined ? undefined : `${version}`;
    } catch (e) {
        core.error(`ERROR: ${e}`);
        return undefined;
    }
}
