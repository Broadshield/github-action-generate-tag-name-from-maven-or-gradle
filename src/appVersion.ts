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
            return properties.of(path_str).get('version')?.toString().replace(/['"]/g, '');
        } catch (e) {
            core.error(`ERROR: ${err}`);
            core.error(`ERROR: ${e}`);
            return undefined;
        }
    }
}
