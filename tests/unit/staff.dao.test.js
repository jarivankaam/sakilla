/**
 * Unit tests for StaffDao
 * - Mocks SQL pool and bcrypt
 */

// If under src/dao:
jest.mock("../../src/db/sql/db.pool", () => ({ query: jest.fn() }));
const pool = require("../../src/db/sql/db.pool");
const StaffDao = require("../../src/dao/staff.dao");

// If at project root (as uploaded names):
// jest.mock("../../db/sql/db.pool", () => ({ query: jest.fn() }), {
//   virtual: true,
// });
// const pool = require("../../db/sql/db.pool");
// const StaffDao = require("../../staff.dao");

jest.mock("bcrypt", () => ({ hash: jest.fn(() => Promise.resolve("HASHED")) }));
const bcrypt = require("bcrypt");

describe("StaffDao.findById", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns first row or null", (done) => {
    pool.query.mockImplementation((sql, params, cb) =>
      cb(null, [{ id: 1 }, { id: 2 }])
    );
    StaffDao.findById(1, (err, row) => {
      expect(err).toBeNull();
      expect(row).toEqual({ id: 1 });
      done();
    });
  });

  test("propagates db error", (done) => {
    pool.query.mockImplementation((sql, params, cb) => cb(new Error("db")));
    StaffDao.findById(1, (err, row) => {
      expect(row).toBeUndefined();
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });
});

describe("StaffDao.findAll", () => {
  afterEach(() => jest.clearAllMocks());

  test("supports callback-only signature", (done) => {
    const rows = [{ id: 1 }];
    pool.query.mockImplementation((sql, params, cb) => {
      expect(params[1]).toBe(10); // default limit
      expect(params[2]).toBe(0); // default offset
      cb(null, rows);
    });
    StaffDao.findAll((err, result) => {
      expect(err).toBeNull();
      expect(result).toEqual(rows);
      done();
    });
  });

  test("returns rows with explicit limit/offset", (done) => {
    const rows = [{ id: 1 }, { id: 2 }];
    pool.query.mockImplementation((sql, params, cb) => {
      expect(params[1]).toBe(5);
      expect(params[2]).toBe(10);
      cb(null, rows);
    });
    StaffDao.findAll(5, 10, (err, result) => {
      expect(result).toEqual(rows);
      done();
    });
  });
});

describe("StaffDao.create", () => {
  afterEach(() => jest.clearAllMocks());

  test("inserts without password", (done) => {
    const payload = {
      first_name: "A",
      last_name: "B",
      email: "e",
      username: "u",
    };

    // first query: INSERT; second query: SELECT by id
    pool.query
      .mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 42 }))
      .mockImplementationOnce((sql, params, cb) =>
        cb(null, [{ id: 42, fullName: "A B" }])
      );

    StaffDao.create(payload, (err, created) => {
      expect(err).toBeNull();
      expect(created).toEqual({ id: 42, fullName: "A B" });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      done();
    });
  });

  test("hashes password if provided", (done) => {
    const payload = {
      first_name: "A",
      last_name: "B",
      email: "e",
      username: "u",
      password: "secret",
    };

    pool.query
      .mockImplementationOnce((sql, params, cb) => {
        const toInsert = params[1];
        expect(toInsert.password).toBe("HASHED");
        cb(null, { insertId: 77 });
      })
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ id: 77 }]));

    StaffDao.create(payload, (err, created) => {
      expect(err).toBeNull();
      expect(created).toEqual({ id: 77 });
      expect(bcrypt.hash).toHaveBeenCalledWith("secret", 12);
      done();
    });
  });
});

describe("StaffDao.update", () => {
  afterEach(() => jest.clearAllMocks());

  test("errors on empty update payload", (done) => {
    StaffDao.update(1, {}, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Nothing to update");
      done();
    });
  });

  test("updates and returns public row", (done) => {
    pool.query
      .mockImplementationOnce((sql, params, cb) =>
        cb(null, { affectedRows: 1 })
      ) // UPDATE
      .mockImplementationOnce((sql, params, cb) =>
        cb(null, [{ id: 1, fullName: "X" }])
      ); // SELECT

    StaffDao.update(1, { email: "x@y.z" }, (err, updated) => {
      expect(err).toBeNull();
      expect(updated).toEqual({ id: 1, fullName: "X" });
      done();
    });
  });

  test("returns null when no rows affected", (done) => {
    pool.query.mockImplementationOnce((sql, params, cb) =>
      cb(null, { affectedRows: 0 })
    ); // UPDATE

    StaffDao.update(1, { email: "x@y.z" }, (err, updated) => {
      expect(err).toBeNull();
      expect(updated).toBeNull();
      done();
    });
  });

  test("hashes password on update if present", (done) => {
    pool.query
      .mockImplementationOnce((sql, params, cb) =>
        cb(null, { affectedRows: 1 })
      ) // UPDATE
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ id: 2 }])); // SELECT

    StaffDao.update(2, { password: "newpass" }, (err, updated) => {
      expect(err).toBeNull();
      expect(updated).toEqual({ id: 2 });
      expect(bcrypt.hash).toHaveBeenCalledWith("newpass", 12);
      done();
    });
  });
});

describe("StaffDao.remove", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns affectedRows", (done) => {
    pool.query.mockImplementation((sql, params, cb) =>
      cb(null, { affectedRows: 1 })
    );
    StaffDao.remove(3, (err, res) => {
      expect(err).toBeNull();
      expect(res).toEqual({ affectedRows: 1 });
      done();
    });
  });
});
