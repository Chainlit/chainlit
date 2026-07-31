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

function parsePackageSelector(selector) {
  const atIndex = selector.lastIndexOf('@');
  const packageNameEnd = selector.startsWith('@') ? selector.indexOf('/') : 0;

  if (!selector || (selector.startsWith('@') && packageNameEnd <= 1)) {
    throw new Error(`Invalid override selector "${selector}"`);
  }

  const parsedSelector =
    atIndex <= packageNameEnd
      ? {
          packageName: selector,
          sourceRange: '*'
        }
      : {
          packageName: selector.slice(0, atIndex),
          sourceRange: selector.slice(atIndex + 1) || '*'
        };

  if (
    !/^(?:@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/i.test(parsedSelector.packageName)
  ) {
    throw new Error(`Invalid override selector "${selector}"`);
  }

  return parsedSelector;
}

export function parseOverrideSelector(selector) {
  try {
    const packageSelector = parsePackageSelector(selector);

    if (semver.validRange(packageSelector.sourceRange)) {
      return packageSelector;
    }
  } catch {
    // Try parsing the selector as a parent-to-dependency edge below.
  }

  for (let edgeIndex = selector.indexOf('>'); edgeIndex >= 0; ) {
    try {
      const parentSelector = parsePackageSelector(selector.slice(0, edgeIndex));
      const dependencySelector = parsePackageSelector(
        selector.slice(edgeIndex + 1)
      );

      if (
        semver.validRange(parentSelector.sourceRange) &&
        semver.validRange(dependencySelector.sourceRange)
      ) {
        return {
          ...dependencySelector,
          parentSelector
        };
      }
    } catch {
      // Keep looking because the range itself may contain a comparator.
    }

    edgeIndex = selector.indexOf('>', edgeIndex + 1);
  }

  throw new Error(`Invalid override selector "${selector}"`);
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

function parseDependencyVersion(reference) {
  if (typeof reference !== 'string') {
    return null;
  }

  const parsedPackage = parsePackageKey(reference);

  if (parsedPackage && semver.valid(parsedPackage.version)) {
    return parsedPackage.version;
  }

  const version = reference.split('(', 1)[0];
  return semver.valid(version) ? version : null;
}

function getEdgeVersions(snapshots, parentSelector, dependencyName) {
  const versions = new Set();

  for (const [snapshotKey, snapshot] of Object.entries(snapshots)) {
    const parsedParent = parsePackageKey(snapshotKey);

    if (
      !parsedParent ||
      parsedParent.packageName !== parentSelector.packageName ||
      !semver.valid(parsedParent.version) ||
      !semver.satisfies(parsedParent.version, parentSelector.sourceRange, {
        includePrerelease: true
      })
    ) {
      continue;
    }

    const dependencyReference =
      snapshot.dependencies?.[dependencyName] ??
      snapshot.optionalDependencies?.[dependencyName];
    const dependencyVersion = parseDependencyVersion(dependencyReference);

    if (dependencyVersion) {
      versions.add(dependencyVersion);
    }
  }

  return [...versions].sort(semver.compare);
}

export function validateLockfile(lockfilePath, lockfileContents) {
  const parsed = yaml.parse(lockfileContents);
  const overrides = parsed.overrides || {};
  const packages = parsed.packages || {};
  const snapshots = parsed.snapshots || {};
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
    const { packageName, sourceRange, parentSelector } =
      parseOverrideSelector(selector);

    if (typeof targetRange !== 'string' || !semver.validRange(targetRange)) {
      continue;
    }

    const resolvedVersions = parentSelector
      ? getEdgeVersions(snapshots, parentSelector, packageName)
      : [...(packageVersions.get(packageName) || [])].sort(semver.compare);

    for (const version of resolvedVersions) {
      if (semver.satisfies(version, targetRange, { includePrerelease: true })) {
        continue;
      }

      if (semver.satisfies(version, sourceRange, { includePrerelease: true })) {
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
