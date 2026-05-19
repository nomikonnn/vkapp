const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { body } = require('express-validator');

router.use(authMiddleware);

const createOrderValidation = [
  body('delivery_type').isIn(['courier', 'post', 'pickup']).withMessage('Тип доставки: courier, post или pickup'),
  body('delivery_address').custom((value, { req }) => {
    // Адрес обязателен только для курьера и почты
    if (req.body.delivery_type !== 'pickup' && (!value || !value.trim())) {
      throw new Error('Адрес доставки обязателен');
    }
    return true;
  }),
  body('delivery_date').optional({ nullable: true }).isDate().withMessage('Некорректная дата доставки'),
  body('payment_method').isIn(['cash', 'card_online']).withMessage('Способ оплаты: cash или card_online'),
  body('promo_code').optional().trim(),
  body('note').optional().trim(),
];

router.post('/', createOrderValidation, orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;