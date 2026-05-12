const axios = require('axios');

const VK_API_URL = 'https://api.vk.com/method/';
const VK_API_VERSION = '5.199';

/**
 * Отправляет сообщение пользователю ВКонтакте от имени сообщества.
 * @param {number} vkUserId - ID пользователя ВКонтакте
 * @param {string} message - Текст сообщения
 * @param {string|null} appId - ID приложения для кнопки «Личный кабинет»
 */
async function sendMessage(vkUserId, message, appId = null) {
  // Проверка наличия токена сообщества
  if (!process.env.VK_COMMUNITY_TOKEN) {
    console.error('VK_COMMUNITY_TOKEN не задан — уведомление не отправлено');
    return;
  }

  try {
    const params = {
      user_id: vkUserId,
      message: message,
      random_id: Math.floor(Math.random() * 1000000),
      access_token: process.env.VK_COMMUNITY_TOKEN,
      v: VK_API_VERSION,
    };

    // Добавляем клавиатуру с кнопкой «Перейти в личный кабинет», если передан appId
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
                hash: 'profile',   // хеш для навигации внутри Mini App
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
    console.error(
      `Ошибка отправки уведомления пользователю ${vkUserId}:`,
      error.response?.data || error.message
    );
  }
}

/**
 * Уведомление о новом заказе.
 */
exports.notifyNewOrder = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `✅ Ваш заказ №${orderId} оформлен и ожидает подтверждения.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Уведомление о подтверждении заказа.
 */
exports.notifyOrderConfirmed = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `✅ Ваш заказ №${orderId} подтверждён! Мы начали его сборку.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Уведомление об оплате.
 */
exports.notifyOrderPaid = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `💰 Заказ №${orderId} оплачен. Готовим к отправке.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Уведомление о передаче в доставку.
 */
exports.notifyOrderShipped = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `🚚 Заказ №${orderId} передан в доставку. Ожидайте.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Уведомление о доставке.
 */
exports.notifyOrderDelivered = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `📦 Заказ №${orderId} доставлен! Спасибо за покупку.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};

/**
 * Уведомление об отмене.
 */
exports.notifyOrderCancelled = async (user, orderId) => {
  if (!user.vk_id) return;
  const message = `❌ Заказ №${orderId} отменён.`;
  await sendMessage(user.vk_id, message, process.env.VK_APP_ID);
};