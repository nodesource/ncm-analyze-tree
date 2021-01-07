'use strict'

const graphql = require('./lib/graphql')
const semver = require('semver')
const universalModuleTree = require('universal-module-tree')

const analyze = async ({
  dir,
  tree,
  token,
  pageSize = 50,
  concurrency = 5,
  onPkgs = () => {},
  filter = () => true,
  url
}) => {
  if (!tree) tree = await readUniversalTree(dir)
  const pkgs = filterPkgs(tree, filter)
  onPkgs(pkgs)
  const data = new Set()
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
  const query = `
    query getPackageVersions($packageVersions: [PackageVersionInput!]!) {
      packageVersions(packageVersions: $packageVersions) {
        name
        version
        published
        publishedAt
        scores {
          group
          name
          pass
          severity
          title
          data
        }
      }
    }
  `

  const variables = {
    packageVersions: [...pkgs].map(({ name, version }) => ({ name, version }))
  }

  const res = await graphql({ token, url }, query, variables)
  const data = new Set()
  for (const [i, datum] of Object.entries(res.packageVersions)) {
    datum.paths = [...pkgs][i].paths
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
