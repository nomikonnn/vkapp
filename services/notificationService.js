const { Order, OrderItem } = require('../models');

// Ленивый импорт VK-клиента: если токена нет — не падаем
function getVkApi() {
  if (!process.env.VK_TOKEN) return null;
  try {
    return require('../bot/vkClient');
  } catch {
    return null;
  }
}

async function sendVkMessage(vkId, message) {
  if (!vkId) return;
  const vk = getVkApi();
  if (!vk) return;
  try {
    await vk.api.messages.send({
      user_id:   Number(vkId),
      message,
      random_id: Math.floor(Math.random() * 1e9),
    });
  } catch (err) {
    console.error('VK sendMessage error:', err.message);
  }
}

async function getFullOrder(orderId) {
  return Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'items' }],
  });
}

// ─── Форматирование ─────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU');
}

function formatPrice(v) {
  return Number(v).toLocaleString('ru-RU') + ' ₽';
}

function formatDelivery(type) {
  return { courier: 'Курьер', post: 'Почта', pickup: 'Самовывоз' }[type] || type;
}

function formatStatus(status) {
  const map = {
    pending:   'Ожидает подтверждения',
    confirmed: 'Подтверждён',
    paid:      'Оплачен',
    shipped:   'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  };
  return map[status] || status;
}

function buildOrderMessage(emoji, title, order) {
  const items = (order.items || [])
    .map(i => `  • ${i.product_name} × ${i.quantity} = ${formatPrice(Number(i.price) * i.quantity)}`)
    .join('\n');

  const lines = [
    `${emoji} ${title}`,
    '',
    `📦 Заказ #${order.id}`,
    `📅 Дата оформления: ${formatDate(order.created_at)}`,
    `📊 Статус: ${formatStatus(order.status)}`,
    '',
    'Состав заказа:',
    items || '  —',
    '',
    `💰 Итого: ${formatPrice(order.total_amount)}`,
    `🚚 Доставка: ${formatDelivery(order.delivery_type)}`,
  ];

  if (order.delivery_address) lines.push(`📍 Адрес: ${order.delivery_address}`);
  if (order.delivery_date)    lines.push(`📆 Дата доставки: ${formatDate(order.delivery_date)}`);

  return lines.join('\n');
}

// ─── Экспортируемые функции ─────────────────────────────────────────────────

exports.notifyNewOrder = async (user, orderId) => {
  if (!user?.vk_id) return;
  const order = await getFullOrder(orderId);
  if (!order) return;
  await sendVkMessage(user.vk_id, buildOrderMessage('🎉', 'Ваш заказ успешно оформлен!', order));
};

exports.notifyOrderConfirmed = async (user, orderId) => {
  if (!user?.vk_id) return;
  const order = await getFullOrder(orderId);
  if (!order) return;
  await sendVkMessage(user.vk_id, buildOrderMessage('✅', 'Заказ подтверждён!', order));
};

exports.notifyOrderPaid = async (user, orderId) => {
  if (!user?.vk_id) return;
  const order = await getFullOrder(orderId);
  if (!order) return;
  await sendVkMessage(user.vk_id, buildOrderMessage('💳', 'Оплата получена, заказ обрабатывается!', order));
};

exports.notifyOrderShipped = async (user, orderId) => {
  if (!user?.vk_id) return;
  const order = await getFullOrder(orderId);
  if (!order) return;
  await sendVkMessage(user.vk_id, buildOrderMessage('🚚', 'Заказ отправлен и уже в пути!', order));
};

exports.notifyOrderDelivered = async (user, orderId) => {
  if (!user?.vk_id) return;
  const order = await getFullOrder(orderId);
  if (!order) return;
  await sendVkMessage(user.vk_id, buildOrderMessage('📦', 'Заказ доставлен! Спасибо за покупку 🎸', order));
};

exports.notifyOrderCancelled = async (user, orderId) => {
  if (!user?.vk_id) return;
  const order = await getFullOrder(orderId);
  if (!order) return;
  await sendVkMessage(user.vk_id, buildOrderMessage('❌', 'Заказ отменён.', order));
};