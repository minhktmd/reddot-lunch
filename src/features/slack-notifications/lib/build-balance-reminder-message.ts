export function buildBalanceReminderMessage(count: number, appUrl: string): string {
  return `💰 ${count} người đang có số dư âm. Vào đây để nạp tiền: ${appUrl}`;
}
