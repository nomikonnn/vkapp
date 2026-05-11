const { User } = require('../models');
const jwt = require('jsonwebtoken');

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
      { expiresIn: process.env.JWT_EXPIRES_IN }
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
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  const user = req.user;
  res.json({
    id: user.id, vk_id: user.vk_id, first_name: user.first_name,
    last_name: user.last_name, email: user.email, phone: user.phone,
    role: user.role, avatar_url: user.avatar_url, address: user.address,
  });
};