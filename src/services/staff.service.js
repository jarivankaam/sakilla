// src/staff/staff.service.js
const StaffDao = require("../dao/staff.dao");

const isValidId = (v) => Number.isInteger(v) && v > 0;

const StaffService = {
  get(staffId, callback) {
    if (!staffId) {
      return StaffDao.findAll((err, rows) => callback(err, rows));
    }
    const id = Number(staffId);
    if (!isValidId(id)) {
      const err = new Error("Invalid staff id");
      err.status = 400;
      return callback(err, null);
    }
    StaffDao.findById(id, (err, staff) => {
      if (err) return callback(err, null);
      if (!staff) {
        const notFound = new Error("Staff not found");
        notFound.status = 404;
        return callback(notFound, null);
      }
      callback(null, staff);
    });
  },

  create(payload, callback) {
    // minimale sanity checks; breid uit met joi/zod indien gewenst
    const required = ["first_name", "last_name", "email", "username"];
    const missing = required.filter((k) => payload[k] == null);
    if (missing.length) {
      const err = new Error(`Missing fields: ${missing.join(", ")}`);
      err.status = 400;
      return callback(err);
    }
    StaffDao.create(payload, (err, created) => callback(err, created));
  },

  update(idParam, payload, callback) {
    const id = Number(idParam);
    if (!isValidId(id)) {
      const err = new Error("Invalid staff id");
      err.status = 400;
      return callback(err);
    }
    if (!payload || Object.keys(payload).length === 0) {
      const err = new Error("Nothing to update");
      err.status = 400;
      return callback(err);
    }
    // Tip: bij PUT kun je hier vereiste velden afdwingen, bij PATCH niet
    StaffDao.update(id, payload, (err, updated) => {
      if (err) return callback(err);
      if (!updated) {
        const nf = new Error("Staff not found");
        nf.status = 404;
        return callback(nf);
      }
      callback(null, updated);
    });
  },

  remove(idParam, callback) {
    const id = Number(idParam);
    if (!isValidId(id)) {
      const err = new Error("Invalid staff id");
      err.status = 400;
      return callback(err);
    }
    StaffDao.remove(id, (err, result) => {
      if (err) return callback(err);
      if (!result || !result.affectedRows) {
        const nf = new Error("Staff not found");
        nf.status = 404;
        return callback(nf);
      }
      callback(null, { ok: true });
    });
  },
};

module.exports = StaffService;
