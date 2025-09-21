// services/auth.service.js
const bcrypt = require('bcrypt');
const staffDao = require('../dao/staff.dao');

const SALT_ROUNDS = 12;
const BCRYPT_PREFIX = /^\$2[aby]\$/; // herken bcrypt veld

function normalizeUsername(u) {
    return String(u || '').trim();
}

function validateLogin({ username, password }) {
    const errors = {};
    if (!username) errors.username = 'Gebruikersnaam is vereist';
    if (!password) errors.password = 'Wachtwoord is vereist';
    return { valid: Object.keys(errors).length === 0, errors };
}

async function login(payload, cb) {
    try {
        const username = normalizeUsername(payload.username);
        const password = payload.password;

        const { valid, errors } = validateLogin({ username, password });
        if (!valid) return cb({ type: 'validation', errors });

        const staff = await staffDao.findByUsername(username);
        if (!staff || staff.active === 0) {
            return cb({ type: 'auth', message: 'Onjuiste inloggegevens' });
        }

        const stored = staff.password || '';
        let ok = false;

        if (BCRYPT_PREFIX.test(stored)) {
            // Bcrypt-vergelijking
            ok = await bcrypt.compare(password, stored);
        } else {
            // Legacy plain-text (zoals in originele Sakila dump)
            ok = stored === password;
            // (Optioneel) progressive upgrade: als match, vervang door bcrypt-hash
            //   Vereist dat kolom breed genoeg is (≥ 60 chars); zie ALTER onderaan.
            if (ok) {
                try {
                    const newHash = await bcrypt.hash(password, SALT_ROUNDS);
                    await staffDao.updatePasswordHash(staff.staff_id, newHash);
                } catch (_) {
                    // stil falen: upgrade lukt later nog wel
                }
            }
        }

        if (!ok) return cb({ type: 'auth', message: 'Onjuiste inloggegevens' });

        const safeUser = {
            staff_id: staff.staff_id,
            username: staff.username,
            name: `${staff.first_name} ${staff.last_name}`.trim(),
            store_id: staff.store_id,
            email: staff.email,
        };

        cb(null, safeUser);
    } catch (err) {
        cb(err);
    }
}

module.exports = { login };
