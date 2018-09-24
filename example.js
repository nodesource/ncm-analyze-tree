'use strict'

const analyze = require('.')
const fetch = require('node-fetch')

const prefix = process.env.NS_ENV
  ? `${process.env.NS_ENV}.`
  : ''
const url = `https://${prefix}api.nodesource.com/ncm2/api/v1`

const dir = process.argv[2] || __dirname
const type = process.argv[3]
const fn = type
  ? analyze[type]
  : analyze

const main = async () => {
  const res = await fetch(
    `https://${prefix}api.nodesource.com/accounts/auth/login`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: 'julian.gruber+ncm-integration-test@nodesource.com',
        password: 'NCM-integration-test1'
      })
    }
  )
  const token = res.headers.get('authorization').split(' ')[1]

  const data = await fn({
    url,
    dir,
    token,
    onPkgs: pkgs => console.log(`Analyzing ${pkgs.size} modules...`)
    // filter: pkg => pkg.name[0] === 'e'
  })

  for (const pkg of data) {
    console.log(`${pkg.name}@${pkg.version}`)
  }
  console.log(`Fetched data for ${data.size} modules.`)
}

main().catch(console.error)
