import * as core from '@actions/core';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as properties from 'java-properties';

export function app_version(path_str: string): string | undefined {
  // Check that the file exists locally
  if (!fs.existsSync(path_str)) {
    core.debug(`ERROR: File not found: (${path_str})`);
    return undefined;
  }
  try {
    const parser = new XMLParser();
    core.debug(`Reading file as xml: (${path_str})`);
    const xmlData = fs.readFileSync(path_str, 'utf8');
    return parser.parse(xmlData).project.version;
  } catch (err) {
    try {
      core.debug(`Reading file as properties: (${path_str})`);
      // Reference a properties file
      const pfile = properties.of(path_str);
      if (pfile.get('version')) {
        const versionRaw: string = pfile.get('version') as string;
        core.debug(`Found property: (${versionRaw})`);
        const version: string = versionRaw.replace(/['"]/g, '');
        core.debug(`Version: (${version})`);
        return version;
      } else {
        core.debug(
          `ERROR: Property 'version' not found in: (${path_str}) keys available (${pfile.getKeys()})`
        );
        return undefined;
      }
    } catch (e) {
      core.error(`ERROR: ${err}`);
      core.error(`ERROR: ${e}`);
      return undefined;
    }
  }
}
