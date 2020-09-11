const express = require('express');
const router = express.Router();
var authController = require('../controllers/auth');

router.post('/', authController.login);

module.exports = router;