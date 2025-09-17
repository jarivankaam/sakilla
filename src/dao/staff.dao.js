// dao/staff.dao.js
const pool = require("../db/sql/db.pool");
const bcrypt = require("bcrypt");

// Columns you allow to be written to the DB (prevents accidental/unsafe field updates)
const ALLOWED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "address_id",
  "picture",
  "store_id",
  "active",
  "username",
  "password", // will be hashed if provided
];

// Public select never exposes password
const staffPublicSelect = `
  s.staff_id AS id,
  s.email AS email,
  CONCAT(s.first_name, ' ', s.last_name) AS fullName,
  s.address_id,
  s.picture,
  s.store_id,
  s.active,
  s.username,
  s.last_update
`;

const TABLE = "staff";

// Helper: pick only whitelisted fields
function pickAllowedFields(src = {}) {
  const out = {};
  for (const k of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  }
  return out;
}

const StaffDao = {
  /**
   * Get one staff by id (public fields only)
   */
  findById(id, callback) {
    const sql = `
      SELECT ${staffPublicSelect}
      FROM ?? s
      WHERE s.staff_id = ?
      LIMIT 1
    `;
    pool.query(sql, [TABLE, id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  },

  /**
   * Get all staff (public fields only), with optional limit/offset
   * @param {number} [limit=10]
   * @param {number} [offset=0]
   */
  findAll(limit = 10, offset = 0, callback) {
    // Support old signature findAll(callback)
    if (typeof limit === "function") {
      callback = limit;
      limit = 10;
      offset = 0;
    } else if (typeof offset === "function") {
      callback = offset;
      offset = 0;
    }

    const sql = `
      SELECT ${staffPublicSelect}
      FROM ?? s
      ORDER BY s.staff_id ASC
      LIMIT ? OFFSET ?
    `;
    pool.query(sql, [TABLE, Number(limit), Number(offset)], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  /**
   * Auth-only fetch (includes hashed password) — do NOT expose result to clients
   */
  findAuthByUsername(username, callback) {
    const sql = `
      SELECT s.staff_id AS id, s.username, s.password
      FROM ?? s
      WHERE s.username = ?
      LIMIT 1
    `;
    pool.query(sql, [TABLE, username], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  },

  /**
   * Create a staff row
   * Expects an object with allowed fields; password will be hashed if present
   */
  create(data, callback) {
    const toInsert = pickAllowedFields(data);

    const doInsert = () => {
      const sql = `INSERT INTO ?? SET ?`;
      pool.query(sql, [TABLE, toInsert], (err, result) => {
        if (err) return callback(err);
        this.findById(result.insertId, callback);
      });
    };

    if (toInsert.password) {
      bcrypt
        .hash(String(toInsert.password), 12)
        .then((hash) => {
          toInsert.password = hash;
          doInsert();
        })
        .catch(callback);
    } else {
      doInsert();
    }
  },

  /**
   * Update a staff row by id (PUT or PATCH semantics decided by caller)
   * Pass only fields you want to update; password will be hashed if present.
   * Returns updated public row or null if not found.
   */
  update(id, data, callback) {
    const toUpdate = pickAllowedFields(data);
    if (!toUpdate || Object.keys(toUpdate).length === 0) {
      const err = new Error("Nothing to update");
      err.status = 400;
      return callback(err);
    }

    const doUpdate = () => {
      const sql = `UPDATE ?? SET ? WHERE staff_id = ?`;
      pool.query(sql, [TABLE, toUpdate, id], (err, result) => {
        if (err) return callback(err);
        if (!result.affectedRows) return callback(null, null); // not found
        this.findById(id, callback);
      });
    };

    if (toUpdate.password) {
      bcrypt
        .hash(String(toUpdate.password), 12)
        .then((hash) => {
          toUpdate.password = hash;
          doUpdate();
        })
        .catch(callback);
    } else {
      doUpdate();
    }
  },

  /**
   * Delete a staff row by id.
   * Returns { affectedRows }.
   */
  remove(id, callback) {
    const sql = `DELETE FROM ?? WHERE staff_id = ?`;
    pool.query(sql, [TABLE, id], (err, result) => {
      if (err) return callback(err);
      callback(null, { affectedRows: result.affectedRows });
    });
  },
};

module.exports = StaffDao;
  