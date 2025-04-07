export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  notes?: string;
  isFixed: boolean;
  receiptUrl?: string;
  createdAt: string;
  accountTitle?: string;
  paymentMethod?: string;
  isIncome?: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  accountTitle: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CashJournalEntry {
  id: string;
  date: string;
  accountTitle: string;
  description: string;
  income: number;
  expense: number;
  balance: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: '交通費', description: '交通機関の利用料金' },
  { id: '2', name: '食費', description: '食事、食材の購入' },
  { id: '3', name: '通信費', description: '携帯電話、インターネット' },
  { id: '4', name: '家賃', description: '賃貸料金' },
  { id: '5', name: '水道光熱費', description: '電気、ガス、水道' },
  { id: '6', name: '保険料', description: '生命保険、健康保険' },
  { id: '7', name: '消耗品費', description: '文具、日用品' },
  { id: '8', name: 'その他', description: 'その他の支出' }
];

export const DEFAULT_ACCOUNT_TITLES = [
  '仕入高',
  '包装資材費',
  '消耗品費',
  '福利厚生費',
  '交通費',
  '雑費',
  '当座預金',
  '給与手当',
  '医療費',
  '販売促進費',
  '広告宣伝費',
  '租税公課'
];

export const DEFAULT_DESCRIPTIONS = [
  '卵代',
  'フルーツ代',
  '材料',
  'クリーニング代',
  '両替手数料',
  '食事代',
  'Kibareハンドメイド',
  '給料',
  '薬代'
];

export const DEFAULT_PAYMENT_METHODS = [
  '現金',
  'クレジットカード',
  '銀行振込',
  '電子マネー',
  'その他'
];