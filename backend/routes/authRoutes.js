const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout } = require('../controllers/authController');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

module.exports = router;
