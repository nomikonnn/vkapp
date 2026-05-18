const { Order, OrderItem } = require('../models');

function getVk() {
  try {
    const { vk } = require('../bot');
    return vk;
  } catch { return null; }
}

async function sendVkMessage(vkId, message) {
  if (!vkId || !process.env.VK_TOKEN) return;
  const vk = getVk();
  if (!vk) return;
  try {
    await vk.api.messages.send({
      user_id: Number(vkId), message, random_id: Math.floor(Math.random() * 1e9),
    });
  } catch (err) { console.error('VK send error:', err.message); }
}

async function getFullOrder(id) {
  return Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString('ru-RU') : '—'; }
function fmtPrice(v) { return Number(v).toLocaleString('ru-RU') + ' ₽'; }
function fmtDelivery(t) { return { courier:'Курьер', post:'Почта', pickup:'Самовывоз' }[t] || t; }
function fmtStatus(s) {
  return { pending:'Ожидает', confirmed:'Подтверждён', paid:'Оплачен',
    shipped:'В пути', delivered:'Доставлен', cancelled:'Отменён' }[s] || s;
}

function buildMsg(emoji, title, o) {
  const items = (o.items||[]).map(i =>
    `  • ${i.product_name} × ${i.quantity} = ${fmtPrice(Number(i.price)*i.quantity)}`).join('\n');
  const lines = [`${emoji} ${title}`, '', `📦 Заказ #${o.id}`, `📅 ${fmtDate(o.created_at)}`,
    `📊 ${fmtStatus(o.status)}`, '', items||'  —', '', `💰 Итого: ${fmtPrice(o.total_amount)}`,
    `🚚 ${fmtDelivery(o.delivery_type)}`];
  if (o.delivery_address) lines.push(`📍 ${o.delivery_address}`);
  if (o.delivery_date) lines.push(`📆 Доставка: ${fmtDate(o.delivery_date)}`);
  return lines.join('\n');
}

exports.notifyNewOrder       = async (u, id) => { if(!u?.vk_id)return; const o=await getFullOrder(id); if(o) await sendVkMessage(u.vk_id, buildMsg('🎉','Заказ оформлен!',o)); };
exports.notifyOrderConfirmed = async (u, id) => { if(!u?.vk_id)return; const o=await getFullOrder(id); if(o) await sendVkMessage(u.vk_id, buildMsg('✅','Заказ подтверждён!',o)); };
exports.notifyOrderPaid      = async (u, id) => { if(!u?.vk_id)return; const o=await getFullOrder(id); if(o) await sendVkMessage(u.vk_id, buildMsg('💳','Оплата получена!',o)); };
exports.notifyOrderShipped   = async (u, id) => { if(!u?.vk_id)return; const o=await getFullOrder(id); if(o) await sendVkMessage(u.vk_id, buildMsg('🚚','Заказ отправлен!',o)); };
exports.notifyOrderDelivered = async (u, id) => { if(!u?.vk_id)return; const o=await getFullOrder(id); if(o) await sendVkMessage(u.vk_id, buildMsg('📦','Заказ доставлен!',o)); };
exports.notifyOrderCancelled = async (u, id) => { if(!u?.vk_id)return; const o=await getFullOrder(id); if(o) await sendVkMessage(u.vk_id, buildMsg('❌','Заказ отменён.',o)); };