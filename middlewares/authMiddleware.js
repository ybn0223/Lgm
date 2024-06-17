"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNotAuthenticated = exports.ensureAuthenticated = void 0;
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    else {
        res.redirect('/');
    }
}
exports.ensureAuthenticated = ensureAuthenticated;
function ensureNotAuthenticated(req, res, next) {
    if (req.session.user) {
        return res.redirect('/home'); // Redirect to home if already logged in
    }
    next();
}
exports.ensureNotAuthenticated = ensureNotAuthenticated;
