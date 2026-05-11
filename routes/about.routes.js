const express = require('express');
const router = express.Router();
const { AboutPage } = require('../models');

router.get('/', async (req, res, next) => {
  try {
    const about = await AboutPage.findOne(); // предполагаем одну запись
    res.json(about);
  } catch (err) {
    next(err);
  }
});

module.exports = router;