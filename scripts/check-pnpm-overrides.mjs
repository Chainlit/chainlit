import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import yaml from 'yaml';

export const DEFAULT_LOCKFILES = [
  'pnpm-lock.yaml',
  'frontend/pnpm-lock.yaml',
  'libs/copilot/pnpm-lock.yaml',
  'libs/react-client/pnpm-lock.yaml'
];

export function parseOverrideSelector(selector) {
  const atIndex = selector.lastIndexOf('@');

  if (atIndex <= 0) {
    throw new Error(`Invalid override selector "${selector}"`);
  }

  return {
    packageName: selector.slice(0, atIndex),
    sourceRange: selector.slice(atIndex + 1)
  };
}

export function parsePackageKey(packageKey) {
  const match = packageKey.match(/^((?:@[^/]+\/)?[^@]+)@([^()]+?)(?=\(|$)/);

  if (!match) {
    return null;
  }

  return {
    packageName: match[1],
    version: match[2]
  };
}

export function validateLockfile(lockfilePath, lockfileContents) {
  const parsed = yaml.parse(lockfileContents);
  const overrides = parsed.overrides || {};
  const packages = parsed.packages || {};
  const packageVersions = new Map();
  const errors = [];

  for (const packageKey of Object.keys(packages)) {
    const parsedPackage = parsePackageKey(packageKey);

    if (!parsedPackage || !semver.valid(parsedPackage.version)) {
      continue;
    }

    if (!packageVersions.has(parsedPackage.packageName)) {
      packageVersions.set(parsedPackage.packageName, new Set());
    }

    packageVersions.get(parsedPackage.packageName).add(parsedPackage.version);
  }

  for (const [selector, targetRange] of Object.entries(overrides)) {
    const { packageName } = parseOverrideSelector(selector);
    const resolvedVersions = [...(packageVersions.get(packageName) || [])].sort(
      semver.compare
    );

    if (!semver.validRange(targetRange)) {
      errors.push(
        `${lockfilePath}: override "${selector}" has invalid target range "${targetRange}"`
      );
      continue;
    }

    for (const version of resolvedVersions) {
      if (
        !semver.satisfies(version, targetRange, { includePrerelease: true })
      ) {
        errors.push(
          `${lockfilePath}: resolved ${packageName}@${version} does not satisfy override "${selector}" -> "${targetRange}"`
        );
      }
    }
  }

  return errors;
}

export function main(lockfilePaths = DEFAULT_LOCKFILES) {
  const allErrors = [];

  for (const relativePath of lockfilePaths) {
    const absolutePath = path.resolve(relativePath);
    const contents = fs.readFileSync(absolutePath, 'utf8');
    allErrors.push(...validateLockfile(relativePath, contents));
  }

  if (allErrors.length > 0) {
    console.error(allErrors.join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validated pnpm override targets across ${lockfilePaths.length} lockfiles.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cliPaths = process.argv.slice(2);
  main(cliPaths.length > 0 ? cliPaths : DEFAULT_LOCKFILES);
}
