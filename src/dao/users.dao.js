// src/users/users.dao.js
const pool = require("../db/sql/db.pool");

// Statisch, dus veilig: geen user input.
const customerSelect = `
  c.customer_id   AS id,
  c.email         AS email,
  CONCAT(c.first_name, ' ', c.last_name) AS displayName,
  c.active        AS active,
  c.store_id      AS storeId,
  c.create_date   AS createdAt,
  c.last_update   AS updatedAt
`;

const TABLE = "customer";

const UsersDao = {
  findById(id, callback) {
    const sql = `
      SELECT ${customerSelect}
      FROM ?? c
      WHERE c.customer_id = ?
      LIMIT 1
    `;
    // ?? => identifier (tabel/kolom), ? => waarde
    pool.query(sql, [TABLE, id], (err, results) => {
      if (err) return callback(err, null);
      if (!results.length) return callback(null, null);
      callback(null, results[0]);
    });
  },

  findAll(callback) {
    const sql = `
      SELECT ${customerSelect}
      FROM ?? c
      ORDER BY c.customer_id ASC
      LIMIT ?
    `;
    // LIMIT ook geparametriseerd; gebruik een integer.
    pool.query(sql, [TABLE, 10], (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    });
  },
};

module.exports = UsersDao;
