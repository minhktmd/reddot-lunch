export type VietQRParams = {
  bankCode: string;
  bankAccount: string;
  bankAccountName: string;
  amount: number;
  addInfo: string;
};

export function buildVietQRUrl(params: VietQRParams): string {
  const { bankCode, bankAccount, bankAccountName, amount, addInfo } = params;
  const base = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png`;
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: bankAccountName,
  });
  return `${base}?${query.toString()}`;
}
