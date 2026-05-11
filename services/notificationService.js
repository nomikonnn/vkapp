const axios = require('axios');

const VK_API_URL = 'https://api.vk.com/method/';
const VK_API_VERSION = '5.199';

/**
 * Отправляет сообщение пользователю ВКонтакте от имени сообщества.
 * @param {number} vkUserId - ID пользователя ВКонтакте (не путать с внутренним id)
 * @param {string} message - Текст сообщения
 * @param {string|null} appId - ID приложения для формирования ссылки на ЛК
 * @returns {Promise<void>}
 */
async function sendMessage(vkUserId, message, appId = null) {
  try {
    const params = {
      user_id: vkUserId,
      message: message,
      random_id: Math.floor(Math.random() * 1000000),
      access_token: process.env.VK_COMMUNITY_TOKEN,
      v: VK_API_VERSION,
    };

    // Если передан appId, добавляем клавиатуру с кнопкой «Личный кабинет»
    if (appId) {
      const keyboard = {
        inline: true,
        buttons: [
          [
            {
              action: {
                type: 'open_app',
                app_id: Number(appId),
                label: 'Перейти в личный кабинет',
                hash: 'profile',   // можно указать hash для навигации внутри Mini App
              },
            },
          ],
        ],
      };
      params.keyboard = JSON.stringify(keyboard);
    }

    await axios.post(`${VK_API_URL}messages.send`, null, { params });
    console.log(`Уведомление отправлено пользователю ${vkUserId}`);
  } catch (error) {
    console.error(`Ошибка отправки уведомления пользователю ${vkUserId}:`, error.response?.data || error.message);
  }
}

/**
 * Отправляет уведомление о новом заказе.
 * @param {object} user - объект пользователя (свойство vk_id обязательно)
 * @param {number} orderId - ID заказа
 */
exports.notifyNewOrder = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `✅ Ваш заказ №${orderId} оформлен и ожидает подтверждения.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Отправляет уведомление о подтверждении заказа.
 * @param {object} user - пользователь
 * @param {number} orderId - ID заказа
 */
exports.notifyOrderConfirmed = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `✅ Ваш заказ №${orderId} подтверждён! Мы начали его сборку.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Отправляет уведомление об оплате.
 * @param {object} user
 * @param {number} orderId
 */
exports.notifyOrderPaid = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `💰 Заказ №${orderId} оплачен. Готовим к отправке.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Отправляет уведомление о передаче в доставку.
 * @param {object} user
 * @param {number} orderId
 */
exports.notifyOrderShipped = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `🚚 Заказ №${orderId} передан в доставку. Ожидайте.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Отправляет уведомление о доставке.
 * @param {object} user
 * @param {number} orderId
 */
exports.notifyOrderDelivered = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `📦 Заказ №${orderId} доставлен! Спасибо за покупку.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Отправляет уведомление об отмене.
 * @param {object} user
 * @param {number} orderId
 */
exports.notifyOrderCancelled = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `❌ Заказ №${orderId} отменён.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};