const VN_TZ = 'Asia/Ho_Chi_Minh';

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function formatDate(isoDateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDateStr));
}

export function getTodayVNDateString(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: VN_TZ }).format(new Date());
}

export function formatTime(isoDateStr: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VN_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoDateStr));
}

export function formatDateFull(isoDateStr: string): string {
  const date = new Date(isoDateStr);
  const day = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, weekday: 'long' }).format(date);
  const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
  const datePart = formatDate(isoDateStr);
  return `${dayCapitalized}, ${datePart}`;
}
