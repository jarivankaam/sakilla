// routes/staff.routes.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.controller"); // let op pad!


// GET /staff/:id?
router.get("/:id?", staffController.get);

// POST /staff       -> create
router.post("/", staffController.create);

// POST /staff/:id/update  -> update (ipv PUT/PATCH)
router.post("/:id/update", staffController.update);

// POST /staff/:id/delete  -> delete (ipv DELETE)
router.post("/:id/delete", staffController.remove);


module.exports = router;
