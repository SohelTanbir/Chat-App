const express = require("express");
const {
  createUser,
  LoginUser,
  getLoggedInUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const checkLogin = require("../middlewares/checkLogin");
const router = express.Router();

// users routes
// router.get('/users', getAllUsers);
router.post("/users/register", createUser);
router.post("/users/login", LoginUser);
router.post("/users/password/forgot", forgotPassword);
router.post("/users/password/reset/:token", resetPassword);
router.get("/password/reset/:token", (req, res) => {
  const frontendBaseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
  return res.redirect(`${frontendBaseUrl}/password/reset/${req.params.token}`);
});
router.get("/users/user", checkLogin, getLoggedInUser);
router.get("/users/all", checkLogin, getAllUsers);

// expor routes
module.exports = router;
