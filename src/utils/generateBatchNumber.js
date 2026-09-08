'use strict'

const { randomUUID } = require('crypto')

const generateBatchNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const uniqueId = randomUUID().split('-')[0].toUpperCase()

  return `BATCH-${date}-${uniqueId}`
}

module.exports = generateBatchNumber
