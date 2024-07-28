require('dotenv').config()
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: process.env.MAIL_API_KEY
    }
}));

exports.getLogin = (req, res, next) => {
    const messages = req.flash('error');
    let message = null;
    if (messages.length > 0){
        message = messages[0];
    }
    // console.log(req.session)
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: false,
        errorMessage: message,
        oldInputs: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    if (!errors.isEmpty()){
        // console.log(errors.array())
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInputs: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({email: email})
    .then(user => {
        // check if user exists
        if (!user){
            return res.status(422).render('auth/login', {
                pageTitle: 'Login',
                path: '/login',
                isAuthenticated: false,
                errorMessage: 'Invalid email or password.',
                oldInputs: {
                    email: email,
                    password: password
                },
                validationErrors: []
            });
        }
        // check if password is correct
        return bcrypt
                .compare(password, user.password)
                .then(matchedPassword => {
                    if (matchedPassword){
                        req.session.isLoggedIn = true;
                        req.session.user = user
                        return req.session.save(err => {
                            if (err){
                                console.log('Error to save session: ' + err);
                            }
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        pageTitle: 'Login',
                        path: '/login',
                        isAuthenticated: false,
                        errorMessage: 'Invalid email or password.',
                        oldInputs: {
                            email: email,
                            password: password
                        },
                        validationErrors: []
                    });
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', err);
                    res.redirect('/login');
                });
    })
    .catch(err => console.log(err));
}

exports.getSignup = (req, res, next) => {
    const messages = req.flash('error');
    let message = null;
    if (messages.length > 0){
        message = messages[0];
    }
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        isAuthenticated: false,
        errorMessage: message,
        oldInputs: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        // console.log(errors.array())
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInputs: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });
    }

   bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
        // create new user
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: {items: []}
        });
        return user.save();
    })
    .then(result => {
        console.log('User created! '+ result);
        res.redirect('/login');

        // transporter.sendMail({
        //     to: email,
        //     from: 'no-reply@toro.com',
        //     subject: 'Signup succeeded!',
        //     html: '<h1>You successfully signed up!</h1>'
        // });
    }).catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
}

exports.getReset = (req, res, next) => {
    const messages = req.flash('error');
    let message = null;
    if (messages.length > 0){
        message = messages[0];
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        isAuthenticated: false,
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if (!user){
                req.flash('error', 'No account with that email found.');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            res.redirect('/');
            // transporter.sendMail({
            //     to: req.body.email,
            //     from: 'no-reply@toro.com',
            //     subject: 'Password reset',
            //     html: `
            //         <p>You requested a password reset</p>
            //         <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
            //     `
            // });
        })
        .catch(err => console.log(err));
    });
};

exports.getNewPassword = (req, res, next) => {

    const token = req.params.token;

    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        const messages = req.flash('error');
        let message = null;
        if (messages.length > 0){
            message = messages[0];
        }
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/new-password',
            isAuthenticated: false,
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    })
    .catch(err => console.log(err));
    
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.newPassword;
    // console.log('newPassword', newPassword);
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: {$gt: Date.now()},
         _id: userId
    })
    .then(user => {
        resetUser = user
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => console.log(err));
};