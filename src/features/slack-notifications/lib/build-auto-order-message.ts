export function buildAutoOrderMessage(dishName: string, price: number, appUrl: string): string {
  return `🍱 Hôm nay hệ thống tự đặt cho bạn: ${dishName} x1 — ${price.toLocaleString('vi-VN')}đ.\nMuốn đổi hoặc hủy, vào đây trước khi admin chốt sổ: ${appUrl}`;
}
