var express = require('express');
var router = express.Router();
const userController = require('../controllers/users.controller');



// :id? → optional parameter
router.get('/:id?', userController.get);

module.exports = router;