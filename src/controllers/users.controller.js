// src/users/users.controller.js
const UsersService = require("../services/users.service");

const UsersController = {
  get(req, res) {
    const { id } = req.params;

    UsersService.get(id, (err, data) => {
      if (err) {
        return res.status(err.status || 500).render({ error: err.message });
      }

      res.render("users", { users: data });
    });
  },
};

module.exports = UsersController;
