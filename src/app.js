require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const routes = require('./routes')
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler')
const logger = require('./utils/logger')

const app = express()

app.use(helmet())
app.use(cors())
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }),
)

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

app.use('/api/v1', routes)

app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Successfully hit the home page',
  })
})

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
