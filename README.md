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
  console.log(`${pkg.name}@${pkg.version}`)
  for (const path of pkg.paths) {
    console.log(`  ${path.map(pkg => `${pkg.data.name}@${pkg.data.version}`).join(' > ')}`)
  }
}
```

```bash
$ node example.js | head -n25
Analyzing 331 modules...
array-union@1.0.2
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1
  standard@11.0.1 > eslint@4.18.2 > file-entry-cache@2.0.0 > flat-cache@1.3.0 > del@2.2.2 > globby@5.0.0
array-uniq@1.0.3
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > array-union@1.0.2
dir-glob@2.0.0
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1
arrify@1.0.1
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > dir-glob@2.0.0
  standard@11.0.1 > eslint@4.18.2 > file-entry-cache@2.0.0 > flat-cache@1.3.0 > del@2.2.2 > globby@5.0.0
path-type@3.0.0
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > dir-glob@2.0.0
pify@3.0.0
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > dir-glob@2.0.0 > path-type@3.0.0
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1
  standard@11.0.1 > standard-engine@8.0.1 > pkg-conf@2.1.0 > load-json-file@4.0.0
fast-glob@2.2.2
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1
@mrmlnc/readdir-enhanced@2.2.1
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > fast-glob@2.2.2
call-me-maybe@1.0.1
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > fast-glob@2.2.2 > @mrmlnc/readdir-enhanced@2.2.1
glob-to-regexp@0.3.0
  @ns-private/check-deps@2.0.0 > dependency-check@3.2.0 > globby@8.0.1 > fast-glob@2.2.2 > @mrmlnc/readdir-enhanced@2.2.1
```

The returned data is of this format:

```
{
  name
  version
  score
  paths[]
  published
  publishedAt
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
