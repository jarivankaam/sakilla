/**
 * Unit tests for StaffService
 * - Mocks StaffDao
 */

// If your files live under src/services & src/dao:
const StaffService = require("../../src/services/staff.service");
jest.mock("../../src/dao/staff.dao");
const StaffDao = require("../../src/dao/staff.dao");

// If your files are next to tests or project root (as uploaded):
// const StaffService = require("../../staff.service");
// jest.mock("../../staff.dao");
// const StaffDao = require("../../staff.dao");

describe("StaffService.get", () => {
  afterEach(() => jest.clearAllMocks());

  test("returns list when no id", (done) => {
    const rows = [{ id: 1 }, { id: 2 }];
    StaffDao.findAll.mockImplementation((cb) => cb(null, rows));

    StaffService.get(null, (err, list) => {
      expect(err).toBeNull();
      expect(list).toEqual(rows);
      expect(StaffDao.findAll).toHaveBeenCalledWith(expect.any(Function));
      done();
    });
  });

  test("errors on invalid id", (done) => {
    StaffService.get("abc", (err, result) => {
      expect(result).toBeNull();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Invalid staff id");
      done();
    });
  });

  test("returns 404 when not found", (done) => {
    StaffDao.findById.mockImplementation((id, cb) => cb(null, null));
    StaffService.get(999, (err, result) => {
      expect(result).toBeNull();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Staff not found");
      expect(err.status).toBe(404);
      done();
    });
  });

  test("returns staff when found", (done) => {
    const staff = { id: 7, fullName: "Jane Doe" };
    StaffDao.findById.mockImplementation((id, cb) => cb(null, staff));
    StaffService.get(7, (err, result) => {
      expect(err).toBeNull();
      expect(result).toEqual(staff);
      done();
    });
  });
});

describe("StaffService.create", () => {
  afterEach(() => jest.clearAllMocks());

  test("fails if required fields are missing", (done) => {
    const payload = { first_name: "A" }; // missing last_name, email, username
    StaffService.create(payload, (err, created) => {
      expect(created).toBeUndefined();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/Missing fields:/);
      done();
    });
  });

  test("delegates to DAO when valid", (done) => {
    const payload = {
      first_name: "A",
      last_name: "B",
      email: "a@b.com",
      username: "ab",
    };
    const created = { id: 123, fullName: "A B" };
    StaffDao.create.mockImplementation((p, cb) => cb(null, created));

    StaffService.create(payload, (err, res) => {
      expect(err).toBeNull();
      expect(res).toEqual(created);
      expect(StaffDao.create).toHaveBeenCalledWith(
        payload,
        expect.any(Function)
      );
      done();
    });
  });
});

describe("StaffService.update", () => {
  afterEach(() => jest.clearAllMocks());

  test("errors on invalid id", (done) => {
    StaffService.update("nope", { any: 1 }, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Invalid staff id");
      done();
    });
  });

  test("errors on empty payload", (done) => {
    StaffService.update(1, {}, (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Nothing to update");
      done();
    });
  });

  test("404 when DAO returns null (not found)", (done) => {
    StaffDao.update.mockImplementation((id, data, cb) => cb(null, null));
    StaffService.update(1, { email: "x@y.z" }, (err, updated) => {
      expect(updated).toBeUndefined();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Staff not found");
      expect(err.status).toBe(404);
      done();
    });
  });

  test("returns updated entity", (done) => {
    const updated = { id: 1, email: "x@y.z" };
    StaffDao.update.mockImplementation((id, data, cb) => cb(null, updated));

    StaffService.update(1, { email: "x@y.z" }, (err, res) => {
      expect(err).toBeNull();
      expect(res).toEqual(updated);
      done();
    });
  });
});

describe("StaffService.remove", () => {
  afterEach(() => jest.clearAllMocks());

  test("errors on invalid id", (done) => {
    StaffService.remove("bad", (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Invalid staff id");
      done();
    });
  });

  test("404 when affectedRows is falsy", (done) => {
    StaffDao.remove.mockImplementation((id, cb) =>
      cb(null, { affectedRows: 0 })
    );
    StaffService.remove(1, (err, res) => {
      expect(res).toBeUndefined();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Staff not found");
      expect(err.status).toBe(404);
      done();
    });
  });

  test("returns ok:true on success", (done) => {
    StaffDao.remove.mockImplementation((id, cb) =>
      cb(null, { affectedRows: 1 })
    );
    StaffService.remove(1, (err, res) => {
      expect(err).toBeNull();
      expect(res).toEqual({ ok: true });
      done();
    });
  });
});
