// ---------------------------------------------------------------
// Builds an order invoice (as plain text for WhatsApp/email, and as
// an HTML card for the on-page checkout summary / admin order view)
// from a Velmora order object — same shape cart.html saves to
// Firestore's `orders` collection.
// ---------------------------------------------------------------

const ZONE_LABELS = { dhaka: 'Inside Dhaka', suburban: 'Suburban Areas', outside: 'Outside Dhaka' };

export function formatTakaInvoice(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN');
}

function invoiceDate(order) {
  if (order.createdAt && order.createdAt.seconds) return new Date(order.createdAt.seconds * 1000);
  if (order.createdAt) return new Date(order.createdAt);
  return new Date();
}

function escInvoice(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Plain-text version — used for WhatsApp messages and email bodies.
export function buildInvoiceText(order, orderId) {
  const d = invoiceDate(order);
  const lines = [];
  lines.push('VELMORA — Order Invoice');
  lines.push(`Order #${orderId || '—'}`);
  lines.push(`Date: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  lines.push('');
  lines.push(`Customer: ${order.name || ''}`);
  lines.push(`Phone: ${order.phone || ''}`);
  if (order.email) lines.push(`Email: ${order.email}`);
  lines.push(`Address: ${order.address || ''}${order.city ? ', ' + order.city : ''}`);
  lines.push(`Delivery: ${ZONE_LABELS[order.zone] || order.zone || ''}`);
  lines.push('');
  lines.push('Items:');
  (order.items || []).forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name} x${item.qty} — ${formatTakaInvoice(item.price * item.qty)}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${formatTakaInvoice(order.subtotal)}`);
  if (order.discount) lines.push(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}: −${formatTakaInvoice(order.discount)}`);
  lines.push(`Delivery Fee: ${formatTakaInvoice(order.deliveryFee)}`);
  lines.push(`Total: ${formatTakaInvoice(order.total)}`);
  lines.push('');
  lines.push('Payment: Cash on Delivery');
  if (order.status) lines.push(`Status: ${order.status}`);
  if (order.note) { lines.push(''); lines.push(`Note: ${order.note}`); }
  lines.push('');
  lines.push('Thank you for shopping with Velmora!');
  return lines.join('\n');
}

// HTML card version — used for the on-page invoice shown to the
// customer right after checkout, and reusable in the admin order modal.
export function buildInvoiceHtml(order, orderId) {
  const d = invoiceDate(order);
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid rgba(20,20,20,0.1);">${escInvoice(item.name)} × ${item.qty}</td>
      <td style="padding:8px 0; border-bottom:1px solid rgba(20,20,20,0.1); text-align:right;">${formatTakaInvoice(item.price * item.qty)}</td>
    </tr>`).join('');

  return `
    <div class="invoice-card">
      <div class="invoice-head">
        <div>
          <div class="invoice-brand">VEL<span>MORA</span></div>
          <div class="invoice-sub">Order Invoice</div>
        </div>
        <div class="invoice-meta">
          <div>Order #${escInvoice(orderId || '—')}</div>
          <div>${d.toLocaleDateString()}</div>
        </div>
      </div>
      <div class="invoice-block">
        <strong>${escInvoice(order.name)}</strong><br>
        ${escInvoice(order.phone)}${order.email ? `<br>${escInvoice(order.email)}` : ''}<br>
        ${escInvoice(order.address)}${order.city ? ', ' + escInvoice(order.city) : ''}<br>
        ${escInvoice(ZONE_LABELS[order.zone] || order.zone || '')}
      </div>
      <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:0.9rem;">
        ${itemRows}
      </table>
      <div class="invoice-totals">
        <div class="summary-row"><span>Subtotal</span><span>${formatTakaInvoice(order.subtotal)}</span></div>
        ${order.discount ? `<div class="summary-row" style="color:#155724;"><span>Discount${order.couponCode ? ` (${escInvoice(order.couponCode)})` : ''}</span><span>−${formatTakaInvoice(order.discount)}</span></div>` : ''}
        <div class="summary-row"><span>Delivery</span><span>${formatTakaInvoice(order.deliveryFee)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatTakaInvoice(order.total)}</span></div>
      </div>
      <p style="font-size:0.82rem; color:#6b4a4e; margin-top:14px;">Payment: Cash on Delivery${order.status ? ` · Status: ${escInvoice(order.status)}` : ''}</p>
      ${order.note ? `<p style="font-size:0.82rem; color:#6b4a4e; margin-top:6px;">Note: ${escInvoice(order.note)}</p>` : ''}
    </div>`;
}

// Bangladeshi numbers as typed at checkout (e.g. 01707082002) need to become
// international format (8801707082002) for a wa.me link to open correctly.
export function normalizeBDPhone(phone) {
  let p = String(phone || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('880')) return p;
  if (p.startsWith('0')) return '880' + p.slice(1);
  return p;
}

export function whatsappInvoiceLink(order, orderId) {
  const phone = normalizeBDPhone(order.phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildInvoiceText(order, orderId))}`;
}

export function emailInvoiceLink(order, orderId) {
  const subject = `Your Velmora Order Invoice #${orderId || ''}`;
  return `mailto:${encodeURIComponent(order.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildInvoiceText(order, orderId))}`;
}
