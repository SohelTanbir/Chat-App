const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "users");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, safeName);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
        return;
    }
    cb(new Error("Only image files are allowed"), false);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
});
