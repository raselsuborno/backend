const express = require('express')
const serverless = require('serverless-http')  // maps Express to Vercel

const app = express()
app.use(express.json())

// Routes
app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// Add your other routes here
// app.get('/api/services', ...)

// Export for Vercel
module.exports = serverless(app)
