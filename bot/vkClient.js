//  отдельный VK-клиент только для API (отправка сообщений)
const { VK } = require('vk-io');

// Этот экземпляр используется только для vk.api (без поллинга)
const vk = new VK({
  token: process.env.VK_TOKEN || '',
});

module.exports = vk;