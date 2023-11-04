const express = require('express');
const { createUser, LoginUser, getLoggedInUser } = require('../controllers/userController');
const checkLogin = require('../middlewares/checkLogin');
const router = express.Router();

// users routes
// router.get('/users', getAllUsers);
router.post('/users/register', createUser);
router.post('/users/login', LoginUser);
router.get('/users/user',checkLogin,  getLoggedInUser);








// expor routes
module.exports = router;



