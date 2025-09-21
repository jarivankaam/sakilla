// routes/staff.routes.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.controller");
const { requireAuth } = require("../middleware/auth");

// GET /staff/:id?
router.get("/:id?", requireAuth, staffController.get);

// POST /staff -> create
router.post("/", requireAuth, staffController.create);

// POST /staff/:id/update -> update
router.post("/:id/update", requireAuth, staffController.update);

// POST /staff/:id/delete -> delete
router.post("/:id/delete", requireAuth, staffController.remove);

module.exports = router;
