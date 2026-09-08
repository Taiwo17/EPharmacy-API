const request = require('supertest')
const app = require('../src/app')

describe('Health check', () => {
  it('GET /api/v1/health returns 200', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.statusCode).toBe(200)
  })
})
