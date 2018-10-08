'use strict'

const analyze = require('.')

const prefix = process.env.NS_ENV
  ? `${process.env.NS_ENV}.`
  : ''
const url = `https://${prefix}api.nodesource.com/ncm2/api/v1`

const dir = process.argv[2] || __dirname
const type = process.argv[3]
const token = process.env.NCM_TOKEN
const fn = type
  ? analyze[type]
  : analyze

const main = async () => {
  const data = await fn({
    url,
    dir,
    token,
    onPkgs: pkgs => console.log(`Analyzing ${pkgs.size} modules...`)
    // filter: pkg => pkg.name[0] === 'e'
  })

  for (const pkg of data) {
    console.log(`${pkg.name}@${pkg.version}`)
    for (const path of pkg.paths) {
      console.log(`  ${path.map(pkg => `${pkg.data.name}@${pkg.data.version}`).join(' > ')}`)
    }
  }
  console.log(`Fetched data for ${data.size} modules.`)
}

main().catch(console.error)
