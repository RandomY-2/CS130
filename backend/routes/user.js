const express = require('express')
const {
  register,
  signin,
  getUsrByToken
} = require('../controllers/user')
const { verifyAuthentication } = require('../middlewares/auth')

const userRouter = express.Router()

userRouter.post('/register', register)
userRouter.post('/login', signin)
userRouter.get('/info', verifyAuthentication, getUsrByToken)

module.exports = userRouter
