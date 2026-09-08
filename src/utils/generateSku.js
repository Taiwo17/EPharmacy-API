'use strict'

const { Product } = require('../models')

async function generateSku() {
  const lastProduct = await Product.findOne({
    order: [['createdAt', 'DESC']],
    attributes: ['sku'],
  })

  let nextNumber = 1

  if (lastProduct?.sku) {
    const match = lastProduct.sku.match(/(\d+)$/)

    if (match) {
      nextNumber = Number(match[1]) + 1
    }
  }

  return `MED-${String(nextNumber).padStart(6, '0')}`
}

module.exports = generateSku
