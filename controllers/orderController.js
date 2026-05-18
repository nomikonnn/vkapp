import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, deleteOrder } from '../api/adminApi';
import styles from './AdminTable.module.css';

// Все статусы совпадают с ENUM в базе
const STATUSES = [
  { value: 'pending',   label: 'Ожидает',       color: '#ffa000' },
  { value: 'confirmed', label: 'Подтверждён',   color: '#9c27b0' },
  { value: 'paid',      label: 'Оплачен',        color: '#2196f3' },
  { value: 'shipped',   label: 'Отправлен',      color: '#03a9f4' },
  { value: 'delivered', label: 'Доставлен',      color: '#4bb34b' },
  { value: 'cancelled', label: 'Отменён',        color: '#e64646' },
];

function statusLabel(s) {
  return STATUSES.find(x => x.value === s)?.label || s;
}
function statusColor(s) {
  return STATUSES.find(x => x.value === s)?.color || '#9ea2a8';
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatPrice(v) {
  const n = Number(v);
  if (isNaN(n)) return '—';
  return n.toLocaleString('ru-RU') + ' ₽';
}

// Получаем имя клиента из объекта заказа
function getUserName(order) {
  if (order.user) {
    const parts = [order.user.first_name, order.user.last_name].filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return '—';
}

function OrdersManager() {
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Обновляем локально без перезагрузки всего списка
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      // Обновляем модал если он открыт для этого заказа
      if (viewOrder?.id === orderId) {
        setViewOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить заказ?')) return;
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      if (viewOrder?.id === id) setModal(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const openDetails = (order) => {
    setViewOrder(order);
    setModal(true);
  };

  // Фильтрация
  let filtered = orders;
  if (filter !== 'all') {
    filtered = filtered.filter(o => o.status === filter);
  }
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(o =>
      String(o.id).includes(q) ||
      getUserName(o).toLowerCase().includes(q) ||
      (o.user?.phone || '').includes(q) ||
      (o.user?.email || '').toLowerCase().includes(q)
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 className={styles.title}>Заказы ({filtered.length})</h2>
          <select
            className={styles.select}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">Все статусы</option>
            {STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Поиск по ID, имени, телефону..."
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className={styles.refreshBtn} onClick={load} title="Обновить">
          🔄
        </button>
      </div>

      {error   && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Загрузка...</div>}

      {!loading && filtered.length === 0 && (
        <div className={styles.empty}>Заказов не найдено</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Дата</th>
                <th>Клиент</th>
                <th>Телефон</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{getUserName(order)}</td>
                  <td>{order.user?.phone || '—'}</td>
                  {/* total_amount — правильное поле из модели */}
                  <td className={styles.price}>{formatPrice(order.total_amount)}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: statusColor(order.status) }}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        title="Подробнее"
                        onClick={() => openDetails(order)}
                      >
                        👁
                      </button>
                      {/* Смена статуса — только валидные значения из ENUM */}
                      <select
                        className={styles.statusSelect}
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                      >
                        {STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        className={styles.iconBtn}
                        title="Удалить"
                        onClick={() => handleDelete(order.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно с деталями заказа */}
      {modal && viewOrder && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Заказ #{viewOrder.id}</h3>
              <button className={styles.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>Дата:</strong> {formatDate(viewOrder.created_at)}
              </div>
              <div className={styles.detailRow}>
                <strong>Статус:</strong>{' '}
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: statusColor(viewOrder.status) }}
                >
                  {statusLabel(viewOrder.status)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <strong>Клиент:</strong> {getUserName(viewOrder)}
              </div>
              <div className={styles.detailRow}>
                <strong>Email:</strong> {viewOrder.user?.email || '—'}
              </div>
              <div className={styles.detailRow}>
                <strong>Телефон:</strong> {viewOrder.user?.phone || '—'}
              </div>
              {/* delivery_address — правильное поле из модели */}
              <div className={styles.detailRow}>
                <strong>Адрес доставки:</strong> {viewOrder.delivery_address || '—'}
              </div>
              <div className={styles.detailRow}>
                <strong>Тип доставки:</strong>{' '}
                {viewOrder.delivery_type === 'courier' ? 'Курьер' :
                 viewOrder.delivery_type === 'post'    ? 'Почта' :
                 viewOrder.delivery_type === 'pickup'  ? 'Самовывоз' :
                 viewOrder.delivery_type || '—'}
              </div>
              <div className={styles.detailRow}>
                <strong>Дата доставки:</strong>{' '}
                {viewOrder.delivery_date
                  ? new Date(viewOrder.delivery_date).toLocaleDateString('ru-RU')
                  : '—'}
              </div>
              <div className={styles.detailRow}>
                <strong>Способ оплаты:</strong>{' '}
                {viewOrder.payment_method === 'cash'        ? 'Наличные' :
                 viewOrder.payment_method === 'card_online' ? 'Карта онлайн' :
                 viewOrder.payment_method || '—'}
              </div>
              {/* note — правильное поле из модели (не comment) */}
              <div className={styles.detailRow}>
                <strong>Комментарий:</strong> {viewOrder.note || '—'}
              </div>
              <div className={styles.detailRow}>
                <strong>Сумма товаров:</strong> {formatPrice(viewOrder.original_amount)}
              </div>
              {Number(viewOrder.discount_amount) > 0 && (
                <div className={styles.detailRow}>
                  <strong>Скидка:</strong> -{formatPrice(viewOrder.discount_amount)}
                </div>
              )}
              {Number(viewOrder.delivery_cost) > 0 && (
                <div className={styles.detailRow}>
                  <strong>Доставка:</strong> {formatPrice(viewOrder.delivery_cost)}
                </div>
              )}
              <div className={styles.detailRow}>
                <strong>Итого:</strong> {formatPrice(viewOrder.total_amount)}
              </div>

              <h4 style={{ marginTop: 20, marginBottom: 12 }}>Товары:</h4>
              {viewOrder.items && viewOrder.items.length > 0 ? (
                <div className={styles.orderItems}>
                  {viewOrder.items.map((item, idx) => (
                    <div key={item.id || idx} className={styles.orderItem}>
                      <div className={styles.itemName}>{item.product_name}</div>
                      <div className={styles.itemQty}>
                        {item.quantity} шт. × {formatPrice(item.price)}
                      </div>
                      <div className={styles.itemTotal}>
                        = {formatPrice(Number(item.quantity) * Number(item.price))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>Товары не указаны</div>
              )}

              {/* Быстрая смена статуса прямо в модале */}
              <div style={{ marginTop: 24 }}>
                <strong>Изменить статус:</strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {STATUSES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(viewOrder.id, s.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '2px solid',
                        borderColor: viewOrder.status === s.value ? s.color : '#ddd',
                        backgroundColor: viewOrder.status === s.value ? s.color : 'transparent',
                        color: viewOrder.status === s.value ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontWeight: viewOrder.status === s.value ? 600 : 400,
                        fontSize: 13,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersManager;