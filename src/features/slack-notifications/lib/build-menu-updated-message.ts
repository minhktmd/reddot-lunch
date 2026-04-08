const TZ = 'Asia/Ho_Chi_Minh';

export function buildMenuUpdatedMessage(
  date: Date,
  items: { name: string; price: number; sideDishes: string | null }[],
  appUrl: string
): string {
  const weekday = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, weekday: 'long' }).format(date);
  const dateStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  const itemLines = items
    .map((i) => {
      const sides = i.sideDishes ? ` (${i.sideDishes})` : '';
      return `• ${i.name} — ${i.price.toLocaleString('vi-VN')}đ${sides}`;
    })
    .join('\n');

  return `✏️ Admin vừa cập nhật thực đơn hôm nay (${weekday}, ${dateStr}):\n\n${itemLines}\n\n👉 Xem và đặt cơm tại đây: ${appUrl}`;
}
