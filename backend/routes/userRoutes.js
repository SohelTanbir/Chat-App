const express = require('express');
const { createUser } = require('../controllers/userController');
const router = express.Router();

// users routes
// router.get('/users', getAllUsers);
router.get('/users/register', createUser);








// expor routes
module.exports = router;



