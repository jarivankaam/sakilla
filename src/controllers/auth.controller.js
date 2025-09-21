// controllers/auth.controller.js
const authService = require('../services/auth.service');
const logger = require('../util/logger');
const TAG = '[auth.controller]';

module.exports = {
    // GET /auth/login
    login(req, res) {
        logger.debug(`${TAG} login`);
        const model = { title: 'Staff login', errors: null, values: {} };
        return res.render('auth/login', model);
    },

    // POST /auth/login
    postLogin(req, res) {
        logger.debug(`${TAG} postLogin`);
        authService.login(req.body, (err, user) => {
            if (err) {
                logger.warn(`${TAG} postLogin error`, err);
                const model = {
                    title: 'Staff login',
                    errors: err.type === 'validation' ? err.errors : { form: err.message || 'Login mislukt' },
                    values: { username: req.body.username || '' },
                };
                return res.status(400).render('auth/login', model);
            }
            req.session.user = user;
            req.session.save(() => res.redirect('/'));
        });
    },

    // POST /auth/logout
    logout(req, res) {
        logger.debug(`${TAG} logout`);
        req.session.destroy(() => {
            res.clearCookie('sid');
            res.redirect('/auth/login');
        });
    },
};
