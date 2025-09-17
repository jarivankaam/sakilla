// src/users/users.service.js
const UsersDao = require('../dao/users.dao');

const UsersService = {
    get(userId, callback) {
        if (!userId) {
            // no ID → return all
            return UsersDao.findAll(callback);
        }

        const id = Number(userId);
        if (!Number.isInteger(id) || id <= 0) {
            const err = new Error('Invalid user id');
            err.status = 400;
            return callback(err, null);
        }

        UsersDao.findById(id, (err, user) => {
            if (err) return callback(err, null);
            if (!user) {
                const notFound = new Error('User not found');
                notFound.status = 404;
                return callback(notFound, null);
            }
            callback(null, user);
        });
    },
};

module.exports = UsersService;
