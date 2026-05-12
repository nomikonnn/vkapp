const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.vkLogin = async (req, res, next) => {
  try {
    const { vk_id, first_name, last_name, avatar_url } = req.body;

    if (!vk_id) {
      return res.status(400).json({ error: 'Не передан vk_id' });
    }

    let user = await User.findOne({ where: { vk_id } });

    if (!user) {
      user = await User.create({
        vk_id,
        first_name,
        last_name,
        avatar_url,
        role: 'user',
      });
    } else {
      user.first_name = first_name || user.first_name;
      user.last_name = last_name || user.last_name;
      user.avatar_url = avatar_url || user.avatar_url;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user.id, vk_id: user.vk_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        vk_id: user.vk_id,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
        role: user.role,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      vk_id: user.vk_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url,
      address: user.address,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { email, phone, address, first_name, last_name } = req.body;

    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.first_name = first_name || user.first_name;
    user.last_name = last_name || user.last_name;
    await user.save();

    res.json({
      success: true,
      user: {
        id: user.id,
        vk_id: user.vk_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
        address: user.address,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.loginWithPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав администратора' });
    }

    const token = jwt.sign(
      { userId: user.id, vk_id: user.vk_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};