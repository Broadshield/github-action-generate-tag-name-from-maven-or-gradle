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
        const xmlData = fs.readFileSync(path_str, 'utf8');
        const xmlObj = parser.parse(xmlData);
        return xmlObj.project.version;
    } catch (err) {
        try {
            // Reference a properties file
            const values = properties.of(path_str);
            const version: string | undefined = values.get('version')?.toString().replace(/'/g, '');

            return version === undefined ? undefined : `${version}`;
        } catch (e) {
            core.error(`ERROR: ${err}`);
            core.error(`ERROR: ${e}`);
            return undefined;
        }
    }
}
