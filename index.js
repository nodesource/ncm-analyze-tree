'use strict'

const graphql = require('./lib/graphql')
const semver = require('semver')
const universalModuleTree = require('universal-module-tree')

const analyze = async ({
  dir,
  token,
  pageSize: pageSize = 50,
  concurrency: concurrency = 5,
  onPkgs: onPkgs = () => {},
  filter: filter = () => true,
  url
}) => {
  const pkgs = filterPkgs(await readUniversalTree(dir), filter)
  onPkgs(pkgs)
  let data = new Set()
  const pages = splitSet(pkgs, pageSize)
  const batches = splitSet(pages, concurrency)
  for (const batch of batches) {
    await Promise.all([...batch].map(async page => {
      for (const datum of await fetchData({ pkgs: page, token, url })) {
        data.add(datum)
      }
    }))
  }
  return data
}

const filterPkgs = (pkgs, fn) => {
  const map = new Map()
  for (const pkg of pkgs) {
    const id = `${pkg.name}${pkg.version}`
    if (semver.valid(pkg.version) && !map.get(id) && fn(pkg)) {
      map.set(id, pkg)
    }
  }

  const clean = new Set()
  for (const [, pkg] of map) clean.add(pkg)
  return clean
}

const readUniversalTree = async dir => {
  const tree = await universalModuleTree(dir)
  const list = universalModuleTree.flatten(tree)
  return new Set(list)
}

const fetchData = async ({ pkgs, token, url }) => {
  const query = `{
    ${[...pkgs].map((pkg, i) => `
      pkg${i}: package(name: "${pkg.name}") {
        name
        published
        versions(version: "${pkg.version}") {
          version
          score
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
      }
    `).join('\n')}
  }`
  const res = await graphql({ token, url }, query)
  const data = new Set()
  const values = Object.values(res)
  for (let i = 0; i < values.length; i++) {
    const pkg = values[i]
    const datum = pkg.versions[0]
    datum.name = pkg.name
    datum.published = pkg.published
    datum.paths = [...pkgs][i].paths
    for (const result of datum.results) {
      result.value = JSON.parse(result.value)
    }
    data.add(datum)
  }
  return data
}

const splitSet = (set, n) => {
  const buckets = new Set()
  let bucket
  for (const member of set) {
    if (!bucket) bucket = new Set()
    bucket.add(member)
    if (bucket.size === n) {
      buckets.add(bucket)
      bucket = null
    }
  }
  if (bucket) buckets.add(bucket)
  return buckets
}

module.exports = analyze
