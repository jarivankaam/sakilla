const authService = require('../services/auth.service');
const logger = require('../util/logger');

const TAG = '[auth.controller]';

/** Alleen lokale redirects toestaan */
function safeRedirect(res, fallbackPath = '/') {
    return (target) => {
        try {
            if (typeof target !== 'string') return res.redirect(fallbackPath);
            if (target.startsWith('/') && !target.startsWith('//')) {
                return res.redirect(target);
            }
        } catch (_) { /* ignore */ }
        return res.redirect(fallbackPath);
    };
}

module.exports = {
    // GET /auth/login
    login(req, res) {

        // Optioneel: ?next=/protected/pagina
        const next = req.query?.next;
        if (next && !req.session.user) {
            req.session.returnTo = next;
        }

        const model = {
            title: 'Staff login',
            errors: null,
            values: { username: '' },
            // csrfToken kan in res.locals.csrfToken staan als je csurf gebruikt
        };
        return res.render('login', model); // <-- map/views/auth/login.jade
    },

    // POST /auth/login
    postLogin(req, res) {

        authService.login(req.body, (err, user) => {
            if (err) {
                const model = {
                    title: 'Staff login',
                    errors: err.type === 'validation'
                        ? err.errors
                        : { form: err.message || 'Login mislukt' },
                    values: { username: req.body?.username || '' },
                };
                return res.status(400).render('auth/login', model); // <-- juiste view pad
            }

            // Session fixation mitigatie
            req.session.regenerate((regenErr) => {
                if (regenErr) {
                    return res.status(500).render('errors/500', { title: 'Fout', error: regenErr });
                }

                // (optioneel) remember me
                const remember = req.body?.remember === '1' || req.body?.remember === 'on';
                if (remember) {
                    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 dagen
                } else {
                    req.session.cookie.expires = false;
                    req.session.cookie.maxAge = null;
                }

                // user in sessie
                req.session.user = user;

                // Return-to
                const goto = req.session.returnTo || '/';
                delete req.session.returnTo;

                req.session.save(() => {
                    res.status(303);                  // See Other
                    return safeRedirect(res, '/')(goto);
                });
            });
        });
    },

    // POST /auth/logout
    logout(req, res) {

        req.session.destroy(() => {
            res.clearCookie('sid');              // cookie-naam uit je session config
            return res.redirect(303, '/auth/login'); // <-- direct naar /auth/login
        });
    },
};