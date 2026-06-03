#!/usr/bin/env node
'use strict'

const analyze = require('./index.js')

async function main() {
  // Note: Replace with a valid NCM API token
  // Set via environment variable: NCM_TOKEN=your-token node test-local.js
  const token = process.env.NCM_TOKEN || 'accounts token'
  
  const data = await analyze({
    dir: __dirname,
    token: token,
    onPkgs: pkgs => console.log(`Analyzing ${pkgs.size} modules...`)
  })

  for (const pkg of data) {
    console.log(`${pkg.name}@${pkg.version}`)
    
    // Display scores if available
    if (pkg.scores && pkg.scores.length > 0) {
      console.log('  Scores:')
      for (const score of pkg.scores) {
        const status = score.pass ? '✓' : '✗'
        console.log(`    ${status} ${score.title} (${score.severity})`)
      }
    }
    
    // Display paths if available
    if (pkg.paths && pkg.paths.length > 0) {
      console.log('  Dependency paths:')
      for (const path of pkg.paths) {
        console.log(`    ${path.map(p => `${p.data.name}@${p.data.version}`).join(' > ')}`)
      }
    }
    
    console.log('')
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
