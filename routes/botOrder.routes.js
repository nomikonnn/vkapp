const express = require('express');
const router = express.Router();
const botOrderController = require('../controllers/botOrderController');

router.get('/orders', botOrderController.getBotOrders);

module.exports = router;