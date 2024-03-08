const express = require('express');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const {
    detectLandmark,
} = require('../controllers/landmark_detection');
const { verifyAuthentication } = require('../middlewares/auth');

const landmarkRouter = express.Router();

landmarkRouter.post('/detect', verifyAuthentication, upload.single('image'), detectLandmark);

module.exports = landmarkRouter;
