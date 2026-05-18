// Реэкспортируем vk-экземпляр из bot/index.js
// чтобы notificationService использовал тот же объект
const { vk } = require('./index');
module.exports = vk;