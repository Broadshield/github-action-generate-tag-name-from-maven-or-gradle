import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as os from 'node:os';

//
// SUMMARY
//
// This script rebuilds the usage section in the README.md to be consistent with the action.yml

interface Input {
  description?: string;
  required?: boolean;
  default?: string;
}
interface Output {
  description?: string;
}
interface Runs {
  using: string;
  main: string;
}
interface Branding {
  color: string;
  icon: string;
}
type Inputs = { [id: string]: Input };
type Outputs = { [id: string]: Output };
interface Action {
  name: string;
  description: string;
  branding: Branding;
  inputs: Inputs;
  outputs: Outputs;
  runs: Runs;
}

export function updateUsage(
  actionReference: string,
  actionYamlPath = 'action.yml',
  readmePath = 'README.md',
  startToken = '<!-- start usage -->',
  endToken = '<!-- end usage -->',
): void {
  if (!actionReference) {
    throw new Error('Parameter actionReference must not be empty');
  }

  // Load the action.yml
  const _actionYaml = yaml.load(fs.readFileSync(actionYamlPath).toString());

  if (typeof _actionYaml !== 'object' || _actionYaml === null) {
    throw new Error("Yaml file read in isn't an object");
  }
  const actionYaml = _actionYaml as Action;
  // Load the README
  const originalReadme = fs.readFileSync(readmePath).toString();

  // Find the start token
  const startTokenIndex = originalReadme.indexOf(startToken);
  if (startTokenIndex < 0) {
    throw new Error(`Start token '${startToken}' not found`);
  }

  // Find the end token
  const endTokenIndex = originalReadme.indexOf(endToken);
  if (endTokenIndex < 0) {
    throw new Error(`End token '${endToken}' not found`);
  } else if (endTokenIndex < startTokenIndex) {
    throw new Error('Start token must appear before end token');
  }

  // Build the new README
  const newReadme: string[] = [];

  // Append the beginning
  newReadme.push(
    originalReadme.slice(0, Math.max(0, startTokenIndex + startToken.length)),
    '```yaml',
    `- uses: ${actionReference}`,
    '  with:',
  );
  if (!actionYaml) {
    throw new Error('No action.yml file');
  }

  const { inputs } = actionYaml;
  let firstInput = true;
  for (const key of Object.keys(inputs)) {
    const input = inputs[key];

    // Line break between inputs
    if (!firstInput) {
      newReadme.push('');
    }

    // Constrain the width of the description
    const width = 80;
    let description = (input.description as string)
      .trimEnd()
      .replace(/\r\n/g, '\n') // Convert CR to LF
      .replace(/ +/g, ' ') //    Squash consecutive spaces
      .replace(/ \n/g, '\n'); //  Squash space followed by newline
    while (description) {
      // Longer than width? Find a space to break apart
      let segment: string = description;
      if (description.length > width) {
        segment = description.slice(0, Math.max(0, width + 1));
        while (!segment.endsWith(' ') && !segment.endsWith('\n') && segment) {
          segment = segment.slice(0, Math.max(0, segment.length - 1));
        }

        // Trimmed too much?
        if (segment.length < width * 0.67) {
          segment = description;
        }
      } else {
        segment = description;
      }

      // Check for newline
      const newlineIndex = segment.indexOf('\n');
      if (newlineIndex >= 0) {
        segment = segment.slice(0, Math.max(0, newlineIndex + 1));
      }

      // Append segment
      newReadme.push(`    # ${segment}`.trimEnd());

      // Remaining
      description = description.slice(segment.length);
    }

    if (input.default !== undefined) {
      // Append blank line if description had paragraphs
      if (/\n *\r?\n/.test((input.description as string).trimEnd())) {
        newReadme.push('    #');
      }

      // Default
      newReadme.push(`    # Default: ${input.default}`);
    }

    // Input name
    newReadme.push(`    ${key}: ''`);

    firstInput = false;
  }

  newReadme.push('```', originalReadme.slice(endTokenIndex));

  // Write the new README
  fs.writeFileSync(readmePath, newReadme.join(os.EOL));
}

// updateUsage(
//   'peter-evans/rebase@v1',
//   path.join(__dirname, '..', '..', 'action.yml'),
//   path.join(__dirname, '..', '..', 'README.md')
// )
