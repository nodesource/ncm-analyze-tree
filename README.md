# ncm-analyze-tree

Get certification data for a module's dependency tree, as it is on disk.

This process is optimized by trying to get all the necessary information from
a `package-lock.json` or `yarn.lock` file, and a full scan of `node_modules/**`
is only reverted to if no lock file exists.

[![Build Status](http://badges.control-tower.nodesource.io/ncm-analyze-tree/status.svg)](https://us-west-2.console.aws.amazon.com/codebuild/home?region=us-west-2#/projects/ncm-analyze-tree-ci/view)

## Usage

Print certification data for this module's dependency tree:

```js
const analyze = require('@ns-private/ncm-analyze-tree')

const data = await fn({
  dir: __dirname,
  token: 'accounts token',
  onPkgs: pkgs => console.log(`Analyzing ${pkgs.size} modules...`)
})

for (const pkg of data) {
  console.log(`${pkg.name}@${pkg.version} ${pkg.top.length ? `(required by ${pkg.top.map(top => `${top.name}@${top.version}`).join(', ')})` : ''}`)
}
```

```bash
$ node example.js | head -n25
Analyzing 331 modules...
is-relative@1.0.0 (required by @ns-private/check-deps@2.0.0)
is-unc-path@1.0.0 (required by @ns-private/check-deps@2.0.0)
unc-path-regex@0.1.2 (required by @ns-private/check-deps@2.0.0)
resolve@1.8.1 (required by @ns-private/check-deps@2.0.0, standard@11.0.1)
path-parse@1.0.6 (required by @ns-private/check-deps@2.0.0)
npm-run-path@2.0.2 (required by @ns-private/check-deps@2.0.0)
path-key@2.0.1 (required by @ns-private/check-deps@2.0.0)
node-fetch@2.2.0
standard@11.0.1
eslint@4.18.2 (required by standard@11.0.1)
ajv@5.5.2 (required by standard@11.0.1)
co@4.6.0 (required by standard@11.0.1)
fast-deep-equal@1.1.0 (required by standard@11.0.1)
fast-json-stable-stringify@2.0.0 (required by standard@11.0.1)
json-schema-traverse@0.3.1 (required by standard@11.0.1)
babel-code-frame@6.26.0 (required by standard@11.0.1)
chalk@1.1.3 (required by standard@11.0.1)
ansi-styles@2.2.1 (required by standard@11.0.1)
escape-string-regexp@1.0.5 (required by standard@11.0.1)
has-ansi@2.0.0 (required by standard@11.0.1)
ansi-regex@2.1.1 (required by standard@11.0.1)
strip-ansi@3.0.1 (required by standard@11.0.1)
supports-color@2.0.0 (required by standard@11.0.1)
esutils@2.0.2 (required by standard@11.0.1)
```

The returned data is of this format:

```
{
  name
  version
  score
  top
  results {
    severity
    pass
    name
    test
    value
  }
  vulnerabilities {
    id,
    title,
    semver {
      vulnerable
    },
    severity
  }
}
```

## Installation

```bash
$ npm install @ns-private/ncm-analyze-tree
```

## API

### analyze({ dir, token, onPkgs, filter, url })

- `onPkgs`: Called with a `Set` of package objects `{ name, version }`, once the
tree has been read
- `filter`: Called with every `pkg` object, return `false` to remove from
analysis
- `url`: `ncm2-api` url
