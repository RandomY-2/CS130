const jwt = require('jsonwebtoken')

module.exports.verifyAuthentication = async (req, res, next) => {
  const token = req.headers.authentication

  console.log('auth middleware for', { token })

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log('jwt token authentication failed for', { token })
        res.status(403).json({ message: 'Authentication Failed' })
      } else {
        console.log('authenticated user', { user })
        req.user = user
        next()
      }
    })
  } else {
    console.log('token not provided')
    res.status(401).json({ message: 'Authentication Failed' })
  }
}
