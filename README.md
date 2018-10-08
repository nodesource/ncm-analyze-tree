# ncm-analyze-tree

Get certification data for a module's dependency tree, as it is on disk.

This process is optimized by trying to get all the necessary information from
a `package-lock.json` or `yarn.lock` file, and a full scan of `node_modules/**`
is only reverted to if no lock file exists.

## Usage

Print certification data for this module's dependency tree:

```js
const analyze = require('ncm-analyze-tree')

const data = await analyze({
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
Analyzing 326 modules...
standard@11.0.1

eslint@4.18.2
  standard@11.0.1
ajv@5.5.2
  standard@11.0.1 > eslint@4.18.2
  standard@11.0.1 > eslint@4.18.2 > table@4.0.2
co@4.6.0
  standard@11.0.1 > eslint@4.18.2 > ajv@5.5.2
fast-deep-equal@1.1.0
  standard@11.0.1 > eslint@4.18.2 > ajv@5.5.2
fast-json-stable-stringify@2.0.0
  standard@11.0.1 > eslint@4.18.2 > ajv@5.5.2
json-schema-traverse@0.3.1
  standard@11.0.1 > eslint@4.18.2 > ajv@5.5.2
babel-code-frame@6.26.0
  standard@11.0.1 > eslint@4.18.2
chalk@1.1.3
  standard@11.0.1 > eslint@4.18.2 > babel-code-frame@6.26.0
ansi-styles@2.2.1
  standard@11.0.1 > eslint@4.18.2 > babel-code-frame@6.26.0 > chalk@1.1.3
escape-string-regexp@1.0.5
  standard@11.0.1 > eslint@4.18.2 > babel-code-frame@6.26.0 > chalk@1.1.3
  standard@11.0.1 > eslint@4.18.2 > chalk@2.4.1
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
$ npm install ncm-analyze-tree
```

## API

### analyze({ dir, token, onPkgs, filter, url })

- `onPkgs`: Called with a `Set` of package objects `{ name, version }`, once the
tree has been read
- `filter`: Called with every `pkg` object, return `false` to remove from
analysis
- `url`: `ncm2-api` url

## License & copyright

Copyright &copy; NodeSource.

Licensed under the MIT open source licefnse, see the LICENSE file for details.
