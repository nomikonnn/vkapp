const { VK, Keyboard } = require('vk-io');
const { User, Order, OrderItem } = require('../models');

const APP_URL = `https://vk.com/app${process.env.VK_APP_ID}`;

// Минимальный конструктор — только token и pollingGroupId
const vk = new VK({
  token:          process.env.VK_TOKEN,
  pollingGroupId: Number(process.env.VK_GROUP_ID),
});

// ─── Клавиатуры ──────────────────────────────────────────────────────────────

const mainKeyboard = Keyboard.builder()
  .textButton({ label: 'Каталог',        payload: { command: 'catalog' }, color: Keyboard.PRIMARY_COLOR })
  .textButton({ label: 'Личный кабинет', payload: { command: 'profile' }, color: Keyboard.PRIMARY_COLOR })
  .row()
  .textButton({ label: 'Заказы',         payload: { command: 'orders' },  color: Keyboard.SECONDARY_COLOR })
  .textButton({ label: 'Поддержка',      payload: { command: 'support' }, color: Keyboard.POSITIVE_COLOR });

const cancelKeyboard = Keyboard.builder()
  .textButton({ label: '« Назад', payload: { command: 'cancel' } });

const sessions = new Map();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatStatus(s) {
  return { pending:'⏳ Ожидает', confirmed:'✅ Подтверждён', paid:'💳 Оплачен',
    shipped:'🚚 В пути', delivered:'📦 Доставлен', cancelled:'❌ Отменён' }[s] || s;
}
function formatDelivery(t) {
  return { courier:'Курьер', post:'Почта', pickup:'Самовывоз' }[t] || t;
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ru-RU') : '—';
}
function formatPrice(v) {
  return Number(v).toLocaleString('ru-RU') + ' ₽';
}
function buildOrderText(order) {
  const items = (order.items || [])
    .map(i => `  • ${i.product_name} × ${i.quantity} = ${formatPrice(Number(i.price) * i.quantity)}`)
    .join('\n');
  const lines = [
    `📦 Заказ #${order.id}`,
    `📅 ${formatDate(order.created_at)}`,
    `📊 ${formatStatus(order.status)}`,
    '', items || '  —', '',
    `💰 Итого: ${formatPrice(order.total_amount)}`,
    `🚚 ${formatDelivery(order.delivery_type)}`,
  ];
  if (order.delivery_address) lines.push(`📍 ${order.delivery_address}`);
  if (order.delivery_date)    lines.push(`📆 Доставка: ${formatDate(order.delivery_date)}`);
  return lines.join('\n');
}

// ─── Обработчик ──────────────────────────────────────────────────────────────

vk.updates.on('message_new', async (context) => {
  const { text, messagePayload, senderId } = context;
  const session = sessions.get(senderId);

  if (session) {
    if (messagePayload?.command === 'cancel' || (text||'').toLowerCase() === 'назад') {
      sessions.delete(senderId);
      return context.send({ message: '↩️ Главное меню:', keyboard: mainKeyboard });
    }
    if (session.scenario === 'support') {
      const q = (text||'').trim();
      if (!q) return context.send('✏️ Напишите вопрос текстом.');
      const adminId = process.env.VK_ADMIN_VK_ID;
      if (adminId) {
        try {
          await vk.api.messages.send({
            user_id: Number(adminId), random_id: Date.now(),
            message: `🆘 Поддержка\nОт: vk.com/id${senderId}\n\n"${q}"\n\nДиалог: https://vk.com/im?sel=${senderId}`,
          });
        } catch (e) { console.error('Admin notify err:', e.message); }
      }
      sessions.delete(senderId);
      return context.send({ message: '✅ Вопрос принят! Админ ответит в этом диалоге.', keyboard: mainKeyboard });
    }
    sessions.delete(senderId);
    return context.send({ message: '↩️ Меню:', keyboard: mainKeyboard });
  }

  const cmd = messagePayload?.command;
  if (cmd) {
    switch (cmd) {
      case 'catalog':
        return context.send({ message: '🎸 Каталог:', keyboard: Keyboard.builder()
          .urlButton({ label: '🛍 Открыть каталог', url: `${APP_URL}#/catalog` }).inline() });
      case 'profile':
        return context.send({ message: '👤 Кабинет:', keyboard: Keyboard.builder()
          .urlButton({ label: '👤 Личный кабинет', url: `${APP_URL}#/profile` }).inline() });
      case 'orders': {
        const u = await User.findOne({ where: { vk_id: senderId } });
        if (!u) return context.send({ message: '❗ Войдите через мини-приложение.', keyboard: Keyboard.builder()
          .urlButton({ label: '🔑 Войти', url: APP_URL }).inline() });
        const orders = await Order.findAll({
          where: { user_id: u.id, status: ['pending','confirmed','paid','shipped'] },
          include: [{ model: OrderItem, as: 'items' }],
          order: [['created_at','DESC']], limit: 5,
        });
        if (!orders.length) return context.send({ message: '📭 Активных заказов нет.', keyboard: mainKeyboard });
        await context.send({ message: `📋 Заказы (${orders.length}):`, keyboard: mainKeyboard });
        for (const o of orders) await context.send({ message: buildOrderText(o) });
        return;
      }
      case 'support':
        sessions.set(senderId, { scenario: 'support' });
        return context.send({ message: '💬 Опишите проблему:', keyboard: cancelKeyboard });
      default:
        return context.send({ message: 'Используйте кнопки.', keyboard: mainKeyboard });
    }
  }

  const lower = (text||'').toLowerCase();
  const hi = ['начать','привет','старт','/start'].some(w => lower.includes(w));
  return context.send({ message: hi ? '👋 Добро пожаловать!\n\nВыберите:' : 'Используйте кнопки.', keyboard: mainKeyboard });
});

// ─── Запуск с диагностикой ───────────────────────────────────────────────────

async function startBot() {
  const token   = process.env.VK_TOKEN;
  const groupId = Number(process.env.VK_GROUP_ID);

  console.log('🔍 Bot debug: token exists =', !!token);
  console.log('🔍 Bot debug: token starts with =', token?.substring(0, 10) + '...');
  console.log('🔍 Bot debug: groupId =', groupId, 'isNaN =', isNaN(groupId));

  if (!token || !groupId || isNaN(groupId)) {
    console.warn('⚠️  VK_TOKEN или VK_GROUP_ID не заданы — бот не запущен');
    return;
  }

  // Шаг 1: проверяем что токен вообще рабочий
  try {
    const [group] = await vk.api.groups.getById({ group_id: String(groupId) });
    console.log('✅ Токен валиден, группа:', group.name, '(id:', group.id, ')');
  } catch (err) {
    console.error('❌ Токен/группа невалидны:', err.code, err.message);
    console.error('   Полная ошибка:', JSON.stringify(err, null, 2));
    return;
  }

  // Шаг 2: проверяем Long Poll
  try {
    const lp = await vk.api.groups.getLongPollServer({ group_id: groupId });
    console.log('✅ Long Poll сервер получен:', lp.server?.substring(0, 40) + '...');
  } catch (err) {
    console.error('❌ Long Poll ошибка:', err.code, err.message);
    return;
  }

  // Шаг 3: запускаем поллинг
  try {
    await vk.updates.start();
    console.log('🤖 VK Bot запущен');
  } catch (err) {
    console.error('❌ Ошибка vk.updates.start():', err.code, err.message);
    console.error('   Stack:', err.stack);
  }
}

module.exports = { startBot, vk };