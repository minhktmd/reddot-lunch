import { z } from 'zod';

export const appConfigResponseSchema = z.object({
  bankCode: z.string().nullable(),
  bankAccount: z.string().nullable(),
  bankAccountName: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type AppConfigResponse = z.infer<typeof appConfigResponseSchema>;

export const saveBankConfigSchema = z.object({
  bankCode: z.string().min(1, 'Vui lòng chọn ngân hàng'),
  bankAccount: z.string().min(1, 'Vui lòng nhập số tài khoản'),
  bankAccountName: z.string().min(1, 'Vui lòng nhập tên chủ tài khoản'),
});

export type SaveBankConfigInput = z.infer<typeof saveBankConfigSchema>;

export type BankItem = {
  bin: string;
  shortName: string;
  name: string;
};
