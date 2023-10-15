const express = require('express');
const { createUser, LoginUser } = require('../controllers/userController');
const router = express.Router();

// users routes
// router.get('/users', getAllUsers);
router.post('/users/register', createUser);
router.post('/users/login', LoginUser);








// expor routes
module.exports = router;



