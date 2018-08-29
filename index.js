'use strict'

const graphql = require('@ns-private/graphql')
const fs = require('fs')
const { promisify } = require('util')
const readPackageTree = require('read-package-tree')
const lockfile = require('@yarnpkg/lockfile')

const analyze = async ({
  dir,
  token,
  pageSize: pageSize = 50,
  concurrency: concurrency = 5
}) => {
  const pkgs = await getPkgs(dir)
  let data = new Set()
  const pages = splitSet(pkgs, pageSize)
  const batches = splitSet(pages, concurrency)
  for (const batch of batches) {
    await Promise.all([...batch].map(async page => {
      for (const datum of await fetchData({ pkgs: page, token })) {
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

const readPackageLock = async dir => {
  const buf = await promisify(fs.readFile)(`${dir}/package-lock.json`)
  const packageLock = JSON.parse(buf.toString())
  const pkgs = new Set()
  const walk = obj => {
    if (!obj.dependencies) return
    for (const [name, value] of Object.entries(obj.dependencies)) {
      pkgs.add({ name, version: value.version })
      walk(value)
    }
  }
  walk(packageLock)
  return pkgs
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

const fetchData = async ({ pkgs, token }) => {
  const query = `{
    ${[...pkgs].map((pkg, i) => `
      pkg${i}: package(name: "${pkg.name}") {
        name
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
  const res = await graphql({ token }, query)
  const data = new Set()
  for (const pkg of Object.values(res)) {
    const datum = pkg.versions[0]
    datum.name = pkg.name
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
