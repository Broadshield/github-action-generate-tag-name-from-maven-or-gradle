import * as core from '@actions/core';
import * as parser from 'fast-xml-parser';
import * as fs from 'fs';
import * as properties from 'java-properties';

export function app_version(path_str: string): string | undefined {
    // Check that the file exists locally
    if (!fs.existsSync(path_str)) {
        core.debug(`ERROR: File not found: (${path_str})`);
        return undefined;
    }
    try {
        core.debug(`Reading file as xml: (${path_str})`);
        const xmlData = fs.readFileSync(path_str, 'utf8');
        return parser.parse(xmlData).project.version;
    } catch (err) {
        try {
            core.debug(`Reading file as properties: (${path_str})`);
            // Reference a properties file
            const pfile = properties.of(path_str);
            if (pfile.get('version')) {
                const versionRaw = <string>pfile.get('version');
                core.debug(`Found property: (${versionRaw})`);
                const version = versionRaw.replace(/['"]/g, '');
                core.debug(`Version: (${version})`);
                return version;
            } else {
                core.debug(`ERROR: Property 'version' not found in: (${path_str})`);
                return undefined;
            }
        } catch (e) {
            core.error(`ERROR: ${err}`);
            core.error(`ERROR: ${e}`);
            return undefined;
        }
    }
}
