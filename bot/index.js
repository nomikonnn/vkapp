const { VK, Keyboard } = require('vk-io');
const { User, Order, OrderItem } = require('../models');

const APP_URL = `https://vk.com/app${process.env.VK_APP_ID}`;

// Добавлены appId, appSecret и pollingGroupId обратно в конструктор
const vk = new VK({
  token:          process.env.VK_TOKEN        || '',
  appId:          Number(process.env.VK_APP_ID),
  appSecret:      process.env.VK_APP_SECRET   || '',
  pollingGroupId: Number(process.env.VK_GROUP_ID),
});

// ─── Клавиатуры ─────────────────────────────────────────────────────────────

const mainKeyboard = Keyboard.builder()
  .textButton({ label: 'Каталог',        payload: { command: 'catalog' }, color: Keyboard.PRIMARY_COLOR })
  .textButton({ label: 'Личный кабинет', payload: { command: 'profile' }, color: Keyboard.PRIMARY_COLOR })
  .row()
  .textButton({ label: 'Заказы',         payload: { command: 'orders' },  color: Keyboard.SECONDARY_COLOR })
  .textButton({ label: 'Поддержка',      payload: { command: 'support' }, color: Keyboard.POSITIVE_COLOR });

const cancelKeyboard = Keyboard.builder()
  .textButton({ label: '« Назад', payload: { command: 'cancel' } });

// ─── Сессии FSM ──────────────────────────────────────────────────────────────

const sessions = new Map();

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function formatStatus(status) {
  const map = {
    pending:   '⏳ Ожидает подтверждения',
    confirmed: '✅ Подтверждён',
    paid:      '💳 Оплачен',
    shipped:   '🚚 В пути',
    delivered: '📦 Доставлен',
    cancelled: '❌ Отменён',
  };
  return map[status] || status;
}

function formatDelivery(type) {
  return { courier: 'Курьер', post: 'Почта', pickup: 'Самовывоз' }[type] || type;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU');
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
    `📅 Дата оформления: ${formatDate(order.created_at)}`,
    `📊 Статус: ${formatStatus(order.status)}`,
    '',
    'Состав:',
    items || '  —',
    '',
    `💰 Итого: ${formatPrice(order.total_amount)}`,
    `🚚 Доставка: ${formatDelivery(order.delivery_type)}`,
  ];

  if (order.delivery_address) lines.push(`📍 Адрес: ${order.delivery_address}`);
  if (order.delivery_date)    lines.push(`📆 Дата доставки: ${formatDate(order.delivery_date)}`);

  return lines.join('\n');
}

// ─── Обработчик сообщений ─────────────────────────────────────────────────────

vk.updates.on('message_new', async (context) => {
  const { text, messagePayload, senderId } = context;
  const session = sessions.get(senderId);

  // ── Активен FSM ──
  if (session) {
    const isCancel =
      messagePayload?.command === 'cancel' ||
      (text || '').toLowerCase() === 'назад';

    if (isCancel) {
      sessions.delete(senderId);
      await context.send({ message: '↩️ Главное меню:', keyboard: mainKeyboard });
      return;
    }

    if (session.scenario === 'support') {
      const question = (text || '').trim();
      if (!question) {
        await context.send('✏️ Напишите ваш вопрос текстом.');
        return;
      }

      // 6.4: уведомляем администратора
      const adminVkId = process.env.VK_ADMIN_VK_ID;
      if (adminVkId) {
        try {
          await vk.api.messages.send({
            user_id:   Number(adminVkId),
            message:   `🆘 Запрос в поддержку\n\nПользователь: vk.com/id${senderId}\n\nСообщение:\n"${question}"\n\nПерейти в диалог: https://vk.com/im?sel=${senderId}`,
            random_id: Date.now(),
          });
        } catch (e) {
          console.error('Ошибка уведомления админа:', e.message);
        }
      }

      sessions.delete(senderId);
      await context.send({
        message:  '✅ Ваш вопрос принят!\nАдминистратор ответит вам в этом диалоге в ближайшее время.',
        keyboard: mainKeyboard,
      });
      return;
    }

    sessions.delete(senderId);
    await context.send({ message: '↩️ Главное меню:', keyboard: mainKeyboard });
    return;
  }

  // ── Команды из кнопок ──
  const cmd = messagePayload?.command;
  if (cmd) {
    switch (cmd) {

      case 'catalog':
        await context.send({
          message:  '🎸 Откройте каталог товаров:',
          keyboard: Keyboard.builder()
            .urlButton({ label: '🛍 Перейти в каталог', url: `${APP_URL}#/catalog` })
            .inline(),
        });
        break;

      case 'profile':
        await context.send({
          message:  '👤 Перейти в личный кабинет:',
          keyboard: Keyboard.builder()
            .urlButton({ label: '👤 Личный кабинет', url: `${APP_URL}#/profile` })
            .inline(),
        });
        break;

      case 'orders': {
        const dbUser = await User.findOne({ where: { vk_id: senderId } });

        if (!dbUser) {
          await context.send({
            message:  '❗ Вы ещё не зарегистрированы в магазине.\nВойдите через мини-приложение, чтобы видеть заказы.',
            keyboard: Keyboard.builder()
              .urlButton({ label: '🔑 Открыть магазин', url: APP_URL })
              .inline(),
          });
          break;
        }

        const orders = await Order.findAll({
          where:   { user_id: dbUser.id, status: ['pending', 'confirmed', 'paid', 'shipped'] },
          include: [{ model: OrderItem, as: 'items' }],
          order:   [['created_at', 'DESC']],
          limit:   5,
        });

        if (orders.length === 0) {
          await context.send({
            message:  '📭 У вас нет активных заказов.',
            keyboard: mainKeyboard,
          });
          break;
        }

        await context.send({
          message:  `📋 Ваши активные заказы (${orders.length}):`,
          keyboard: mainKeyboard,
        });

        for (const order of orders) {
          await context.send({ message: buildOrderText(order) });
        }
        break;
      }

      case 'support':
        sessions.set(senderId, { scenario: 'support' });
        await context.send({
          message:  '💬 Опишите вашу проблему или вопрос.\nАдминистратор ответит в этом диалоге.',
          keyboard: cancelKeyboard,
        });
        break;

      default:
        await context.send({ message: 'Используйте кнопки меню.', keyboard: mainKeyboard });
    }
    return;
  }

  // ── Обычное текстовое сообщение ──
  const lower = (text || '').toLowerCase();
  const isGreeting = ['начать', 'привет', 'старт', '/start', 'start', 'hello'].some(w => lower.includes(w));

  await context.send({
    message:  isGreeting
      ? '👋 Добро пожаловать в магазин музыкального оборудования!\n\nВыберите действие:'
      : 'Используйте кнопки меню.',
    keyboard: mainKeyboard,
  });
});

vk.updates.on('error', err => console.error('Bot update error:', err));

// ─── Запуск ──────────────────────────────────────────────────────────────────

async function startBot() {
  if (!process.env.VK_TOKEN || !process.env.VK_GROUP_ID) {
    console.warn('⚠️  VK_TOKEN или VK_GROUP_ID не заданы — бот не запущен');
    return;
  }
  try {
    await vk.updates.start();
    console.log('🤖 VK Bot запущен (long polling)');
  } catch (err) {
    console.error('Ошибка запуска бота:', err.message);
  }
}

module.exports = { startBot, vk };