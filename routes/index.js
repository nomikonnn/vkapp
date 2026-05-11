const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const favoriteRoutes = require('./favorite.routes');
const orderRoutes = require('./order.routes');
const reviewRoutes = require('./review.routes');
const questionRoutes = require('./question.routes');
const adminRoutes = require('./admin.routes');
const faqRoutes = require('./faq.routes');         // подключаем
const aboutRoutes = require('./about.routes');     // подключаем
const categoriesRoutes = require('./categories.routes')

// Публичные справочные маршруты через отдельные роутеры
router.use('/faq', faqRoutes);
router.use('/about', aboutRoutes);

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/questions', questionRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', publicRoute);

module.exports = router;
