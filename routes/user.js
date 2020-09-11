const express = require('express');
const router = express.Router();
var userController = require('../controllers/user');
var authorization = require('../middlewares/authorization');

router.post('/register', userController.register);

router.get('/verifyUser/:tokenId', userController.verifyUser);

router.post('/resendVerify', userController.resendVerify);

router.post('/forgotPassword', userController.forgotPassword);

router.get('/verifyForgot/:tokenId', userController.verifyForgot);

router.post('/resetPassword', userController.resetPassword);

router.get('/userProfile', [authorization()], userController.userProfile)

module.exports = router;