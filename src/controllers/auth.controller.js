const authService = require('../services/auth.service');
const logger = require('../util/logger');

const TAG = '[auth.controller]';

/**
 * Alleen paden toestaan die lokaal zijn (beginnen met "/" maar niet met "//" of "http")
 * Zo voorkom je open redirects.
 */
function safeRedirect(res, fallbackPath = '/') {
    return (target) => {
        try {
            if (typeof target !== 'string') return res.redirect(fallbackPath);
            // alleen relative app paths
            if (target.startsWith('/') && !target.startsWith('//')) {
                return res.redirect(target);
            }
        } catch (_) { /* ignore */ }
        return res.redirect(fallbackPath);
    };
}

module.exports = {
    // GET /login
    login(req, res) {

        // Optioneel: ?next=/protected/pagina -> bewaar als returnTo
        const next = req.query?.next;
        if (next && !req.session.user) {
            req.session.returnTo = next;
        }

        const model = {
            title: 'Staff login',
            errors: null,
            values: { username: '' },
            // csrfToken staat al in res.locals.csrfToken als je csurf gebruikt
        };
        return res.render('login', model);
    },

    // POST /login
    postLogin(req, res) {

        authService.login(req.body, (err, user) => {
            if (err) {
                logger.warn(`${TAG} postLogin error`, err);
                const model = {
                    title: 'Staff login',
                    errors: err.type === 'validation'
                        ? err.errors
                        : { form: err.message || 'Login mislukt' },
                    values: { username: req.body?.username || '' },
                };
                return res.status(400).render('login', model);
            }

            // Session fixation mitigatie: regenereer de sessie-ID vóórdat je user zet
            req.session.regenerate((regenErr) => {
                if (regenErr) {
                    logger.error(`${TAG} session regenerate failed`, regenErr);
                    return res.status(500).render('errors/500', { title: 'Fout', error: regenErr });
                }

                // Optioneel: "remember me" -> langere cookie
                // In je form voeg je bv. <input type="checkbox" name="remember" value="1">
                const remember = req.body?.remember === '1' || req.body?.remember === 'on';
                if (remember) {
                    // 30 dagen
                    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
                } else {
                    // session cookie (tot browser sluit) -> maxAge undefined
                    req.session.cookie.expires = false;
                    req.session.cookie.maxAge = null;
                }

                // Zet veilige user payload in de sessie
                req.session.user = user;

                // Return-to afhandelen en verwijderen
                const goto = req.session.returnTo || '/';
                delete req.session.returnTo;

                // Sla en redirect
                req.session.save(() => {
                    // 303: See Other (voorkomt formulier-resubmits)
                    res.status(303);
                    return safeRedirect(res, '/')(goto);
                });
            });
        });
    },

    // POST /auth/logout
    logout(req, res) {

        // Alles onder POST houden i.v.m. CSRF-bescherming
        req.session.destroy(() => {
            // Cookie-naam moet overeenkomen met je session config (name: 'sid')
            res.clearCookie('sid');
            // 303 om back/refresh issues te vermijden
            return res.redirect(303, '/login');
        });
    },
};