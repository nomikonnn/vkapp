const express = require('express');
const router = express.Router();
const { Faq } = require('../models');

router.get('/', async (req, res, next) => {
  try {
    const faqs = await Faq.findAll({ order: [['sort_order', 'ASC']] });
    res.json(faqs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;