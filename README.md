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

const data = await analyze({
  dir: __dirname,
  token: 'accounts token'
})
console.log(data)
```

```bash
$ node example.js | head -n25
Set {
  { version: '2.1.0',
  score: 100,
  results:
   [ [Object], [Object], [Object], [Object], [Object], [Object] ],
  vulnerabilities: [],
  name: 'doctrine' },
  { version: '1.3.2',
  score: 100,
  results:
   [ [Object], [Object], [Object], [Object], [Object], [Object] ],
  vulnerabilities: [],
  name: 'error-ex' },
  { version: '1.12.0',
  score: 100,
  results:
   [ [Object], [Object], [Object], [Object], [Object], [Object] ],
  vulnerabilities: [],
  name: 'es-abstract' },
  { version: '1.1.1',
  score: 100,
  results:
   [ [Object], [Object], [Object], [Object], [Object], [Object] ],
  vulnerabilities: [],
  name: 'es-to-primitive' },
```

## Installation

```bash
$ npm install @ns-private/ncm-analyze-tree
```

## API

### analyze({ dir, token })
