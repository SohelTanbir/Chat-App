const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// create a new user
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    res.status(201).json({
      success: false,
      message: "Name, email and password are required",
    });
    return;
  }

  // check already exists user with this email address
  const userExist = await User.find({ email });
  if (userExist.length > 0) {
    res.status(201).json({
      success: false,
      message: "User already exists with this email address!",
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hasPassword = await bcrypt.hash(password, salt);
  const userData = {
    name,
    email,
    role,
    password: hasPassword,
  };
  const newUser = await User.create(userData);
  try {
    const result = await newUser.save();
    if (!result) {
      res.status(500).json({
        success: false,
        message: "User created Failed!",
      });
    } else {
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: result,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "There was an server error!",
    });
  }
};

// Login user
const LoginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(201).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // check already exists user with this email address
    const user = await User.find({ email });
    if (!user.length > 0) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }
    // check  password is correct or not
    const isPasswordsCorrect = await bcrypt.compare(password, user[0].password);
    if (!isPasswordsCorrect) {
      return res.status(201).json({
        success: false,
        message: "Incorrect email or password !",
      });
    }
    // generate auth token
    const token = jwt.sign(
      { email, userId: user[0]._id },
      process.env.JWT_SECREAT,
      { expiresIn: "5d" }
    );
    res.status(201).json({
      success: true,
      message: "Login success",
      token,
      userData: {
        userId: user[0]._id,
        name: user[0].name,
        email,
      },
    });
  } catch (err) {
    res.status(201).json({
      success: false,
      error: err.message,
    });
  }
};

// get logged in user data
const getLoggedInUser = async (req, res) => {
  const { email } = req.user;
  try {
    const user = await User.find({ email: email }).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// get all users chats list to start new chat
const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find({}).select("-password");
    if (!allUsers.length) {
      return res.status(404).json({
        success: false,
        message: "Sorry, Chat list is not available!",
      });
    }
    res.status(200).json({
      success: true,
      allUsers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "There was an sever error",
    });
  }
};

// forgot password - generate reset token
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendBaseUrl = process.env.FRONTEND_URL;
    const baseUrl = frontendBaseUrl || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${baseUrl}/password/reset/${resetToken}`;

    if (
      !process.env.SMTP_HOST &&
      !process.env.SMTP_PORT &&
      !process.env.SMTP_SERVICE
    ) {
      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

    const transporter = nodemailer.createTransport(
      process.env.SMTP_SERVICE
        ? {
          service: process.env.SMTP_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
        : {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER
            ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
            : undefined,
        }
    );

    const mailOptions = {
      from:
        process.env.SMTP_FROM ||
        process.env.EMAIL_USER ||
        "no-reply@chatapp.local",
      to: email,
      subject: "Reset your password",
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}. If you did not request this, ignore this email.`,
      html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to email",
      resetUrl,
      resetToken:
        process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "There was a server error",
      error: err.message,
    });
  }
};

// reset password using token
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Token and new password are required",
    });
  }

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or has expired",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "There was a server error",
      error: err.message,
    });
  }
};

// export controllers
module.exports = {
  createUser,
  LoginUser,
  getLoggedInUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
};
