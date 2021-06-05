import * as core from '@actions/core'
import * as parser from 'fast-xml-parser'
import * as fs from 'fs'
import * as path from 'path'

export function app_version(path_str: string): string | undefined {
  const ext = path.extname(path_str)
  if (ext !== null && ext.toLowerCase() !== '.xml') {
    core.debug(`extension of path_str (${path_str}) isn't .xml (ext is: ${ext})`)
    return undefined
  }
  // Check that the file exists locally
  if (!fs.existsSync(path_str)) {
    core.debug(`ERROR: File not found: (${path_str})`)
    return undefined
  }
  try {
    const xmlData = fs.readFileSync(path_str, 'utf8')
    const jsonObj = parser.parse(xmlData)
    return jsonObj.project.version
  } catch (err) {
    core.error(err)
    return undefined
  }
}
