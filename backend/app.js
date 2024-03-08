const express = require('express');
const cors = require('cors');
require('dotenv').config();

const FirebaseSingleton = require('./third_party/db');
const GCPLandmarkSingleton = require('./third_party/google_lens');
const OpenAIAPISingleton = require('./third_party/chatgpt')

const app = express();

FirebaseSingleton.getInstance().getDatabase();
GCPLandmarkSingleton.getInstance();
OpenAIAPISingleton.getInstance();

// Init Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', require('./routes/user'));
app.use('/api/landmark', require('./routes/landmark_detection'));
app.use('/api/ai', require('./routes/ai_chat'));
app.use('/api/forum', require('./routes/forum'));

module.exports = app;
