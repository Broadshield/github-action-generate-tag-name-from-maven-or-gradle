import * as core from '@actions/core';
import { XMLParser } from 'fast-xml-parser';
import * as properties from 'java-properties';
import * as fs from 'node:fs';

interface PomDocumentInterface {
  [key: string]: any;
  project: {
    version: string;
  };
}

export function app_version(path_str: string): string | undefined {
  // Check that the file exists locally
  if (!fs.existsSync(path_str)) {
    core.debug(`ERROR: File not found: (${path_str})`);
    return undefined;
  }
  try {
    const parser = new XMLParser();
    core.debug(`Reading file as xml: (${path_str})`);
    const xmlData = fs.readFileSync(path_str, 'utf8').toString();
    const pomDocument: PomDocumentInterface = parser.parse(xmlData) as PomDocumentInterface;
    return pomDocument.project.version;
  } catch (error) {
    try {
      core.debug(`Reading file as properties: (${path_str})`);
      // Reference a properties file
      const pfile = properties.of(path_str);
      if (pfile.get('version')) {
        const versionRaw: string = pfile.get('version') as string;
        core.debug(`Found property: (${versionRaw})`);
        const version: string = versionRaw.replace(/["']/g, '');
        core.debug(`Version: (${version})`);
        return version;
      }
      core.debug(
        `ERROR: Property 'version' not found in: (${path_str}) keys available (${pfile.getKeys()})`,
      );
      return undefined;
    } catch (error_) {
      core.error(`ERROR: ${error}`);
      core.error(`ERROR: ${error_}`);
      return undefined;
    }
  }
}
