'use strict'

const graphql = require('@ns-private/graphql')
const fs = require('fs')
const { promisify } = require('util')
const readPackageTree = require('read-package-tree')
const lockfile = require('@yarnpkg/lockfile')
const semver = require('semver')
const universalModuleTree = require('@ns-private/universal-module-tree')

const analyze = async ({
  dir,
  token,
  pageSize: pageSize = 50,
  concurrency: concurrency = 5,
  onPkgs: onPkgs = () => {},
  filter: filter = () => true,
  url
}) => {
  const pkgs = filterPkgs(await getPkgs(dir), filter)
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

const getPkgs = async dir => {
  if (await exists(`${dir}/package-lock.json`)) return readPackageLock(dir)
  if (await exists(`${dir}/yarn.lock`)) return readYarnLock(dir)
  return readNodeModules(dir)
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

const id = node => `${node.data.name}@${node.data.version}`

const readPackageLock = async dir => {
  const tree = await universalModuleTree(dir)
  const pkgs = new Map()

  const walk = (node, top) => {
    let pkgObj
    if (pkgs.has(id(node))) {
      pkgObj = pkgs.get(id(node))
    } else {
      pkgObj = {
        name: node.data.name,
        version: node.data.version,
        top: {}
      }
      pkgs.set(id(node), pkgObj)
      for (const child of node.children) {
        walk(child, top)
      }
    }

    if (top && top.data.name !== node.data.name && !pkgObj.top[id(top)]) {
      pkgObj.top[id(top)] = {
        name: top.data.name,
        version: top.data.version
      }
    }
  }

  for (const child of tree.children) {
    walk(child, child)
  }

  const set = new Set()
  for (const [, pkg] of pkgs) set.add(pkg)
  return set
}

const readYarnLock = async dir => {
  const buf = await promisify(fs.readFile)(`${dir}/yarn.lock`)
  const yarnLock = lockfile.parse(buf.toString())
  const pkgs = new Set()
  for (const [pkgId, obj] of Object.entries(yarnLock.object)) {
    pkgs.add({
      name: /(.+)@/.exec(pkgId)[1],
      version: obj.version
    })
  }
  return pkgs
}

const readNodeModules = async dir => {
  const data = await promisify(readPackageTree)(dir)
  const pkgs = new Set()
  const walk = tree => {
    for (const node of tree.children) {
      pkgs.add({
        name: node.package.name,
        version: node.package.version
      })
      walk(node)
    }
  }
  walk(data)
  return pkgs
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
    datum.top = [...pkgs][i].top
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

const exists = async path => {
  try {
    await promisify(fs.stat)(path)
    return true
  } catch (_) {
    return false
  }
}

module.exports = analyze
