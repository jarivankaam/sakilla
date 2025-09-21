/**
 * Integration tests for /staff routes
 * - Mounts your router on an Express app
 * - Mocks StaffService (so no DB), verifies route wiring + controller behavior
 * - Replaces res.render with res.json for testability (no templates needed)
 */

const request = require("supertest");
const express = require("express");

// If you use src/** structure, switch to these and delete the others:
jest.mock("../../src/services/staff.service");
jest.mock("../../src/middleware/auth", () => ({
    requireAuth: (req, res, next) => next(),
}));
const staffRoutes = require("../../src/routes/staff");
const StaffService = require("../../src/services/staff.service");

// For the uploaded file names at project root:
// jest.mock("../../staff.service");
// const staffRoutes = require("../../staff");
// const StaffService = require("../../staff.service");

function makeApp() {
  const app = express();
  app.use(express.json());

  // Replace res.render to avoid needing actual templates during tests
  app.use((req, res, next) => {
    const originalRender = res.render.bind(res);
    res.render = (view, locals = {}) => {
      // expose view name and locals as JSON for assertions
      return res.status(res.statusCode || 200).json({ view, ...locals });
    };
    res._originalRender = originalRender;
    next();
  });

  app.use("/staff", staffRoutes);
  return app;
}

describe("Integration: /staff routes", () => {
  let app;

  beforeEach(() => {
    app = makeApp();
    jest.clearAllMocks();
  });

  describe("GET /staff (list)", () => {
    test("renders list when service resolves", async () => {
      StaffService.get.mockImplementation((id, cb) =>
        cb(null, [{ id: 1 }, { id: 2 }])
      );

      const res = await request(app).get("/staff");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("staff");
      expect(res.body.staff).toEqual([{ id: 1 }, { id: 2 }]);
      expect(res.body.selected).toBeNull();
      expect(StaffService.get).toHaveBeenCalledWith(null, expect.any(Function));
    });

    test("renders error when service fails", async () => {
      const err = Object.assign(new Error("boom"), { status: 500 });
      StaffService.get.mockImplementation((id, cb) => cb(err));

      const res = await request(app).get("/staff");
      expect(res.status).toBe(500);
      expect(res.body.view).toBe("staff");
      expect(res.body.staff).toEqual([]);
      expect(res.body.error).toBe("boom");
    });
  });

  describe("GET /staff/:id (detail)", () => {
    test("renders list + selected when both succeed", async () => {
      // first call: list, second: selected
      StaffService.get
        .mockImplementationOnce((id, cb) => cb(null, [{ id: 1 }, { id: 5 }]))
        .mockImplementationOnce((id, cb) =>
          cb(null, { id: 5, fullName: "Jane" })
        );

      const res = await request(app).get("/staff/5");
      expect(res.status).toBe(200);
      expect(res.body.view).toBe("staff");
      expect(res.body.staff).toEqual([{ id: 1 }, { id: 5 }]);
      expect(res.body.selected).toEqual({ id: 5, fullName: "Jane" });

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
    });

    test("renders error when selected fetch fails", async () => {
      StaffService.get
        .mockImplementationOnce((id, cb) => cb(null, [{ id: 1 }])) // list ok
        .mockImplementationOnce((id, cb) =>
          cb(Object.assign(new Error("not found"), { status: 404 }))
        );

      const res = await request(app).get("/staff/99");
      expect(res.status).toBe(404);
      expect(res.body.view).toBe("staff");
      expect(res.body.staff).toEqual([{ id: 1 }]);
      expect(res.body.error).toBe("not found");
    });
  });

  describe("POST /staff (create)", () => {
    test("redirects to /staff/:id on success", async () => {
      StaffService.create.mockImplementation((payload, cb) =>
        cb(null, { id: 123 })
      );

      const res = await request(app).post("/staff").send({
        first_name: "A",
        last_name: "B",
        email: "a@b.com",
        username: "ab",
        active: true,
      });

      // Express redirect sends 303 with Location header
      expect(res.status).toBe(303);
      expect(res.headers.location).toBe("/staff/123");
      expect(StaffService.create).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: "A", active: 1 }), // coerced by controller
        expect.any(Function)
      );
    });

    test("re-renders form with error + selected payload", async () => {
      const err = Object.assign(
        new Error("Missing fields: last_name, email, username"),
        { status: 400 }
      );
      StaffService.create.mockImplementation((payload, cb) => cb(err));
      StaffService.get.mockImplementation((id, cb) => cb(null, [{ id: 1 }]));

      const res = await request(app)
        .post("/staff")
        .send({ first_name: "Only", active: false });

      expect(res.status).toBe(400);
      expect(res.body.view).toBe("staff");
      expect(res.body.staff).toEqual([{ id: 1 }]);
      expect(res.body.error).toMatch(/Missing fields/);
      expect(res.body.selected).toEqual(
        expect.objectContaining({ first_name: "Only", active: 0 })
      );
    });
  });

  describe("POST /staff/:id/update", () => {
    test("redirects to /staff/:id on success", async () => {
      StaffService.update.mockImplementation((id, payload, cb) =>
        cb(null, { id: 7 })
      );

      const res = await request(app)
        .post("/staff/7/update")
        .send({ email: "x@y.z" });

      expect(res.status).toBe(302); // default redirect status when not 303 in controller
      expect(res.headers.location).toBe("/staff/7");
    });

    test("re-renders with error when service fails", async () => {
      const err = Object.assign(new Error("Nothing to update"), {
        status: 400,
      });
      StaffService.update.mockImplementation((id, payload, cb) => cb(err));

      const res = await request(app).post("/staff/7/update").send({});

      expect(res.status).toBe(400);
      expect(res.body.view).toBe("staff");
      expect(res.body.error).toBe("Nothing to update");
    });
  });

  describe("POST /staff/:id/delete", () => {
    test("redirects to /staff on success", async () => {
      StaffService.remove.mockImplementation((id, cb) =>
        cb(null, { ok: true })
      );

      const res = await request(app).post("/staff/9/delete");

      expect(res.status).toBe(303);
      expect(res.headers.location).toBe("/staff");
    });

    test("re-renders list with error when service fails", async () => {
      const err = Object.assign(new Error("Staff not found"), { status: 404 });
      StaffService.remove.mockImplementation((id, cb) => cb(err));
      StaffService.get.mockImplementation((id, cb) => cb(null, [{ id: 1 }]));

      const res = await request(app).post("/staff/9/delete");

      expect(res.status).toBe(404);
      expect(res.body.view).toBe("staff");
      expect(res.body.staff).toEqual([{ id: 1 }]);
      expect(res.body.selected).toBeNull();
      expect(res.body.error).toBe("Staff not found");
    });
  });
});
