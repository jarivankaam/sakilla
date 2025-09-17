/**
 * Unit tests for StaffController
 * - Mocks StaffService
 * - Uses a minimal res mock for status/render/redirect
 */

// If under src/controllers & src/services:
const StaffController = require("../../src/controllers/staff.controller");
jest.mock("../../src/services/staff.service");
const StaffService = require("../../src/services/staff.service");

// // If files are at project root (as uploaded names):
// const StaffController = require("../../src/controllers/staff.controller");
// jest.mock("../../staff.service");
// const StaffService = require("../../src/services/staff.service");

function makeRes() {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn(function (code) {
    this.statusCode = code;
    return this;
  });
  res.render = jest.fn();
  res.redirect = jest.fn();
  return res;
}

describe("StaffController.get", () => {
  afterEach(() => jest.clearAllMocks());

  test("renders list when no id", () => {
    const req = { params: {} };
    const res = makeRes();

    StaffService.get.mockImplementation((id, cb) => {
      if (id === null) cb(null, [{ id: 1 }]);
    });

    StaffController.get(req, res);

    expect(StaffService.get).toHaveBeenCalledWith(null, expect.any(Function));
    expect(res.render).toHaveBeenCalledWith("staff", {
      staff: [{ id: 1 }],
      selected: null,
    });
  });

  test("renders error when list fetch fails", () => {
    const req = { params: {} };
    const res = makeRes();

    const err = Object.assign(new Error("boom"), { status: 500 });
    StaffService.get.mockImplementation((id, cb) => cb(err));

    StaffController.get(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("staff", {
      staff: [],
      error: "boom",
    });
  });

  test("detail view: renders selected with list", () => {
    const req = { params: { id: "5" } };
    const res = makeRes();

    StaffService.get
      .mockImplementationOnce((id, cb) => cb(null, [{ id: 1 }, { id: 5 }])) // list
      .mockImplementationOnce((id, cb) => cb(null, { id: 5 })); // selected

    StaffController.get(req, res);

    expect(StaffService.get).toHaveBeenNthCalledWith(
      1,
      null,
      expect.any(Function)
    );
    expect(StaffService.get).toHaveBeenNthCalledWith(
      2,
      "5",
      expect.any(Function)
    );
    expect(res.render).toHaveBeenCalledWith("staff", {
      staff: [{ id: 1 }, { id: 5 }],
      selected: { id: 5 },
    });
  });

  test("detail view: renders error when selected fetch fails", () => {
    const req = { params: { id: "5" } };
    const res = makeRes();

    StaffService.get
      .mockImplementationOnce((id, cb) => cb(null, [{ id: 1 }])) // list ok
      .mockImplementationOnce((id, cb) =>
        cb(Object.assign(new Error("nope"), { status: 404 }))
      );

    StaffController.get(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith("staff", {
      staff: [{ id: 1 }],
      error: "nope",
    });
  });
});

describe("StaffController.create", () => {
  afterEach(() => jest.clearAllMocks());

  test("redirects to new entity when created", () => {
    const req = { body: { first_name: "A", active: true } };
    const res = makeRes();

    StaffService.create.mockImplementation((payload, cb) =>
      cb(null, { id: 10 })
    );

    StaffController.create(req, res);

    expect(StaffService.create).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: "A", active: 1 }),
      expect.any(Function)
    );
    expect(res.redirect).toHaveBeenCalledWith(303, "/staff/10");
  });

  test("re-renders with error and selected payload", () => {
    const req = { body: { first_name: "A", active: false } };
    const res = makeRes();
    const err = Object.assign(new Error("Missing fields"), { status: 400 });

    StaffService.create.mockImplementation((payload, cb) => cb(err));
    StaffService.get.mockImplementation((id, cb) => cb(null, [{ id: 1 }]));

    StaffController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith("staff", {
      staff: [{ id: 1 }],
      selected: expect.objectContaining({ first_name: "A", active: 0 }),
      error: "Missing fields",
    });
  });
});

describe("StaffController.update", () => {
  afterEach(() => jest.clearAllMocks());

  test("redirects on success", () => {
    const req = { params: { id: "2" }, body: { email: "x@y.z" } };
    const res = makeRes();
    StaffService.update.mockImplementation((id, data, cb) =>
      cb(null, { id: 2 })
    );

    StaffController.update(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/staff/2");
  });

  test("renders error on failure", () => {
    const req = { params: { id: "2" }, body: {} };
    const res = makeRes();
    const err = Object.assign(new Error("Nothing to update"), { status: 400 });

    StaffService.update.mockImplementation((id, data, cb) => cb(err));

    StaffController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith("staff", {
      error: "Nothing to update",
    });
  });
});

describe("StaffController.remove", () => {
  afterEach(() => jest.clearAllMocks());

  test("redirects to list on success", () => {
    const req = { params: { id: "3" } };
    const res = makeRes();

    StaffService.remove.mockImplementation((id, cb) => cb(null, { ok: true }));

    StaffController.remove(req, res);

    expect(res.redirect).toHaveBeenCalledWith(303, "/staff");
  });

  test("re-renders list with error on failure", () => {
    const req = { params: { id: "3" } };
    const res = makeRes();
    const err = Object.assign(new Error("Staff not found"), { status: 404 });

    StaffService.remove.mockImplementation((id, cb) => cb(err));
    StaffService.get.mockImplementation((id, cb) => cb(null, [{ id: 1 }]));

    StaffController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith("staff", {
      staff: [{ id: 1 }],
      selected: null,
      error: "Staff not found",
    });
  });
});
