const express = require('express')
const {
  chatWithAI,
  getNearbyPOIList
} = require('../controllers/ai_chat')
const { verifyAuthentication } = require('../middlewares/auth')

const aiRouter = express.Router()

aiRouter.post('/chat', verifyAuthentication, chatWithAI)
aiRouter.post('/nearby', verifyAuthentication, getNearbyPOIList)

module.exports = aiRouter
