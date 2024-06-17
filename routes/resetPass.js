"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../database"); // Adjust import path as per your project structure
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
dotenv_1.default.config();
const resetMail = (_a = process.env.RESET_EMAIL) !== null && _a !== void 0 ? _a : "";
const resetPass = (_b = process.env.RESET_PASS) !== null && _b !== void 0 ? _b : "";
// POST route to handle forgot password request
router.post('/forgotPassword', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // Find user by email in MongoDB collection
        const user = yield database_1.usersCollection.findOne({ email });
        if (!user) {
            let wrongCredentials = false;
            let userExists = false;
            let user = false;
            let emailNotFound = true;
            res.render("index", {
                wrongCredentials, user, userExists, emailNotFound
            });
            return;
        }
        // Generate a unique token for password reset
        const resetToken = crypto_1.default.randomBytes(20).toString('hex');
        const resetTokenExpiration = new Date(Date.now() + 3600000); // Token expires in 1 hour
        // Update user's resetToken and resetTokenExpiration in MongoDB collection
        yield database_1.usersCollection.updateOne({ _id: user._id }, {
            $set: {
                resetToken,
                resetTokenExpiration
            }
        });
        // Send password reset email (replace with your email sending logic)
        const transporter = nodemailer_1.default.createTransport({
            // Your email configuration
            service: 'gmail',
            auth: {
                user: resetMail,
                pass: resetPass
            }
        });
        const mailOptions = {
            from: resetMail,
            to: user.email,
            subject: 'LMG Project wachtwoord opnieuw instellen',
            text: `Je hebt aangegeven dat je het wachtwoord voor LMG project bent vergeten. Je kunt een nieuw wachtwoord instellen door op de onderstaande link te klikken\n\nhttp://${req.headers.host}/users/reset-password/${resetToken}\n\nHeb je niet zelf aangegeven dat je jouw wachtwoord wil wijzigen? Dan kun je deze e-mail negeren.`
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error('Error sending password reset email:', err);
                res.redirect("/404");
            }
            res.redirect("/");
        });
    }
    catch (err) {
        console.error('Error processing forgot password request:', err);
        res.status(500).json({ error: 'Server error' });
    }
}));
router.get("/users/reset-password/:token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.params.token;
    try {
        // Ensure token is a string
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Invalid token' });
        }
        // Find user by reset token and check token expiration in MongoDB collection
        const user = yield database_1.usersCollection.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        // Render the password reset form
        let wrongCredentials = false;
        let userExists = false;
        let emailNotFound = false;
        res.render('resetPassword', { token, user: userExists, emailNotFound, wrongCredentials, userExists });
    }
    catch (err) {
        console.error('Error rendering password reset form:', err);
        res.status(500).json({ error: 'Server error' });
    }
}));
// POST route to handle password reset with token
router.post('/reset-password/:token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    const { password } = req.body;
    try {
        // Find user by reset token and check token expiration in MongoDB collection
        const user = yield database_1.usersCollection.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: new Date() }
        });
        if (!user) {
            res.redirect("/404");
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        let date = new Date("0001-01-01");
        // Update user's password (in a real application, you would hash the password before saving)
        yield database_1.usersCollection.updateOne({ _id: user._id }, {
            $set: {
                password: hashedPassword,
                resetToken: "",
                resetTokenExpiration: date
            },
        });
        res.redirect("/");
        return;
    }
    catch (err) {
        console.error('Error resetting password:', err);
        res.redirect("/404");
        return;
    }
}));
exports.default = router;
