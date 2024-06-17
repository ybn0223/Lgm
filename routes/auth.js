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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../database");
const router = (0, express_1.Router)();
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username, password, password2 } = req.body;
    let wrongCredentials = false;
    let userExists = true;
    if (password !== password2) {
        return res.status(400).send('Passwords do not match');
    }
    try {
        const result = yield (0, database_1.registerUser)(email, username, password);
        if (result !== 'User registered successfully') {
            res.render("index", {
                wrongCredentials,
                user: false,
                userExists,
                emailNotFound: false
            });
            return;
        }
        const user = yield database_1.usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).send('User was not found');
        }
        req.session.user = user;
        return res.redirect('/');
    }
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).send('Server error');
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield database_1.usersCollection.findOne({ username });
        if (!user) {
            res.render("index", {
                wrongCredentials: true,
                user: false,
                userExists: false,
                emailNotFound: true
            });
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.render("index", {
                wrongCredentials: true,
                user: false,
                userExists: false,
                emailNotFound: false
            });
            return;
        }
        req.session.user = user;
        return res.redirect('/');
    }
    catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).send('Server error');
    }
}));
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
});
router.post('/change-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: 'New passwords do not match' });
        }
        if (!req.session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.session.user._id;
        const user = yield database_1.usersCollection.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield database_1.usersCollection.updateOne({ _id: userId }, { $set: { password: hashedPassword } });
        res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
exports.default = router;
