const express = require('express');
const {
    getAccessForums,
    getComment,
    addComment,
    addOrUpdateForumRating,
} = require('../controllers/forum');
const { verifyAuthentication } = require('../middlewares/auth');

const forumRouter = express.Router();

forumRouter.get('/', verifyAuthentication, getAccessForums);
forumRouter.post('/getComment', verifyAuthentication, getComment);
forumRouter.post('/addComment', verifyAuthentication, addComment);
forumRouter.post('/rate', verifyAuthentication, addOrUpdateForumRating);

module.exports = forumRouter;
