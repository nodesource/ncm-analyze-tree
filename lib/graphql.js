// inlined from @ns-private/graphql for publish

'use strict'

const { GraphQLClient } = require('graphql-request')

const NCMAPI_URL = process.env.NCMAPI_URL || 'https://api.ncm.nodesource.com/ncm2/api/v2/graphql'

module.exports = (opts, query, variables) => {
  if (typeof opts === 'string') {
    opts = { opts }
  }
  const url = opts.url || NCMAPI_URL

  const client = new GraphQLClient(url, {
    headers: {
      Authorization: `Bearer ${opts.token}`
    }
  })
  return client.request(query, variables)
}
