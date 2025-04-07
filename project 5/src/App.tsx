import React, { useState, useEffect } from 'react';
import { Upload, FileText, PlusCircle, Download, Calendar, AlertCircle, Check, ArrowUpCircle, ArrowDownCircle, Lock, Trash2, Plus, X } from 'lucide-react';
import { format, parse, isWithinInterval, startOfMonth, endOfMonth, isValid, eachDayOfInterval } from 'date-fns';

import {
  Expense,
  FixedExpense,
  CashJournalEntry,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNT_TITLES,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_DESCRIPTIONS
} from './types';

const ACCESS_CODE = 'kakskd';
const STORAGE_KEY = 'receipt-management-state';

interface DailySales {
  id: string;
  date: string;
  amount: number;
}

interface AppState {
  expenses: Expense[];
  dailySales: DailySales[];
  fixedExpenses: FixedExpense[];
  previousBalance: number;
  currentMonth: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    {
      id: '1',
      name: '家賃',
      amount: 80000,
      category: '家賃',
      dueDay: 27,
      accountTitle: '販売費及び一般管理費',
      isActive: true
    },
    {
      id: '2',
      name: 'インターネット',
      amount: 4500,
      category: '通信費',
      dueDay: 15,
      accountTitle: '販売費及び一般管理費',
      isActive: true
    }
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showFixedExpenses, setShowFixedExpenses] = useState(false);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [customAccountTitle, setCustomAccountTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load state from localStorage on initial mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState: AppState = JSON.parse(savedState);
        setExpenses(parsedState.expenses);
        setDailySales(parsedState.dailySales);
        setFixedExpenses(parsedState.fixedExpenses);
        setPreviousBalance(parsedState.previousBalance);
        setCurrentMonth(parsedState.currentMonth);
      } catch (error) {
        console.error('Failed to parse saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state: AppState = {
      expenses,
      dailySales,
      fixedExpenses,
      previousBalance,
      currentMonth
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [expenses, dailySales, fixedExpenses, previousBalance, currentMonth]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === ACCESS_CODE) {
      setIsAuthenticated(true);
      setAccessError(false);
      localStorage.setItem('isAuthenticated', 'true');
    } else {
      setAccessError(true);
    }
  };

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('サポートされている画像形式: JPG, PNG, GIF, BMP, WebP');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('画像サイズは10MB以下にしてください');
      return false;
    }
    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      return;
    }

    try {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: 0,
        category: '',
        description: '',
        notes: '',
        isFixed: false,
        receiptUrl: URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
        accountTitle: '',
        paymentMethod: '現金',
        isIncome: false
      };

      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('画像のアップロードに失敗しました:', error);
      setUploadError('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  };

  const handleManualEntry = () => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: 0,
      category: '',
      description: '',
      notes: '',
      isFixed: false,
      createdAt: new Date().toISOString(),
      accountTitle: '',
      paymentMethod: '現金',
      isIncome: false
    };

    setExpenses(prev => [...prev, newExpense]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const handleAddCustomAccountTitle = () => {
    if (customAccountTitle && !DEFAULT_ACCOUNT_TITLES.includes(customAccountTitle)) {
      DEFAULT_ACCOUNT_TITLES.push(customAccountTitle);
      setCustomAccountTitle('');
    }
  };

  const handleAddCustomDescription = () => {
    if (customDescription && !DEFAULT_DESCRIPTIONS.includes(customDescription)) {
      DEFAULT_DESCRIPTIONS.push(customDescription);
      setCustomDescription('');
    }
  };

  const handleAddDailySales = (date: string) => {
    const newSale: DailySales = {
      id: crypto.randomUUID(),
      date,
      amount: 0
    };
    setDailySales(prev => [...prev, newSale]);
  };

  const handleDeleteDailySales = (id: string) => {
    setDailySales(prev => prev.filter(sale => sale.id !== id));
  };

  const calculateCashJournal = (): CashJournalEntry[] => {
    const currentDate = parse(currentMonth, 'yyyy-MM', new Date());
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const allTransactions = [
      ...expenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        isIncome: expense.isIncome || false,
        amount: expense.amount,
        accountTitle: expense.accountTitle || '',
        description: expense.description
      })),
      ...dailySales.map(sale => ({
        id: sale.id,
        date: sale.date,
        isIncome: true,
        amount: sale.amount,
        accountTitle: '売上高',
        description: '現金売上'
      }))
    ];

    const relevantTransactions = allTransactions.filter(transaction => {
      const transactionDate = parse(transaction.date, 'yyyy-MM-dd', new Date());
      return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
    });

    let runningBalance = previousBalance;
    return relevantTransactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(transaction => {
        const income = transaction.isIncome ? transaction.amount : 0;
        const expense = transaction.isIncome ? 0 : transaction.amount;
        runningBalance = runningBalance + income - expense;

        return {
          id: transaction.id,
          date: transaction.date,
          accountTitle: transaction.accountTitle,
          description: transaction.description,
          income,
          expense,
          balance: runningBalance
        };
      });
  };

  const getMissingFixedExpenses = () => {
    const currentDate = parse(currentMonth, 'yyyy-MM', new Date());
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    return fixedExpenses.filter(fixed => {
      const hasExpense = expenses.some(expense => 
        expense.isFixed &&
        expense.description === fixed.name &&
        isWithinInterval(parse(expense.date, 'yyyy-MM-dd', new Date()), {
          start: monthStart,
          end: monthEnd
        })
      );
      return fixed.isActive && !hasExpense;
    });
  };

  const exportToCSV = () => {
    const headers = [
      '日付',
      '勘定科目',
      '摘要',
      '収入金額',
      '支払金額',
      '差引残高'
    ];

    const cashJournal = calculateCashJournal();
    const csvContent = [
      headers.join(','),
      `${format(startOfMonth(parse(currentMonth, 'yyyy-MM', new Date())), 'yyyy-MM-dd')},前月繰越,,,${previousBalance}`,
      ...cashJournal.map(entry => [
        entry.date,
        entry.accountTitle,
        `"${entry.description}"`,
        entry.income,
        entry.expense,
        entry.balance
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cash_journal_${currentMonth}.csv`;
    link.click();
  };

  const getDaysInMonth = () => {
    const currentDate = parse(currentMonth, 'yyyy-MM', new Date());
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    });
  };

  const missingFixedExpenses = getMissingFixedExpenses();
  const cashJournal = calculateCashJournal();
  const daysInMonth = getDaysInMonth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-indigo-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">アクセス制限</h2>
            <p className="mt-2 text-sm text-gray-600">
              続行するにはアクセスコードを入力してください
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAccessCodeSubmit}>
            <div>
              <label htmlFor="accessCode" className="sr-only">
                アクセスコード
              </label>
              <input
                id="accessCode"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  accessError ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="アクセスコードを入力"
              />
              {accessError && (
                <p className="mt-2 text-sm text-red-600">
                  アクセスコードが正しくありません
                </p>
              )}
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                続行
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">経費管理システム</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">レシートアップロード</h2>
              <label className="block w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">クリックまたはドラッグ＆ドロップでアップロード</p>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </div>
              </label>
              {isProcessing && (
                <p className="mt-2 text-sm text-gray-600 text-center">処理中...</p>
              )}
              {uploadError && (
                <p className="mt-2 text-sm text-red-600 text-center">{uploadError}</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">アクション</h2>
              <div className="space-y-4">
                <button
                  onClick={handleManualEntry}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  手動入力
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-5 w-5" />
                  CSVエクスポート
                </button>
              </div>
            </div>

            {/* Fixed Expenses Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">固定費チェック</h2>
                <button
                  onClick={() => setShowFixedExpenses(!showFixedExpenses)}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {showFixedExpenses ? '非表示' : '表示'}
                </button>
              </div>
              
              {showFixedExpenses && (
                <div className="space-y-4">
                  {missingFixedExpenses.length > 0 ? (
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            未記帳の固定費があります
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc pl-5 space-y-1">
                              {missingFixedExpenses.map(expense => (
                                <li key={expense.id}>
                                  {expense.name} (¥{expense.amount.toLocaleString()})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-md">
                      <div className="flex">
                        <Check className="h-5 w-5 text-green-400" />
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            すべての固定費が記帳されています
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cash Journal Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">現預金出納帳</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="month"
                      value={currentMonth}
                      onChange={(e) => setCurrentMonth(e.target.value)}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  前月繰越残高
                </label>
                <input
                  type="number"
                  value={previousBalance}
                  onChange={(e) => setPreviousBalance(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">勘定科目</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">摘要</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">収入金額</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">支払金額</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">差引残高</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(startOfMonth(parse(currentMonth, 'yyyy-MM', new Date())), 'yyyy-MM-dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">前月繰越</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right"></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right"></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        ¥{previousBalance.toLocaleString()}
                      </td>
                    </tr>
                    {cashJournal.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.accountTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {entry.income > 0 ? `¥${entry.income.toLocaleString()}` : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {entry.expense > 0 ? `¥${entry.expense.toLocaleString()}` : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ¥{entry.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Expense List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">経費一覧</h2>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="month"
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Custom Account Title Input */}
              <div className="mb-4 flex space-x-2">
                <input
                  type="text"
                  value={customAccountTitle}
                  onChange={(e) => setCustomAccountTitle(e.target.value)}
                  placeholder="新しい勘定科目を追加"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={handleAddCustomAccountTitle}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  追加
                </button>
              </div>

              {/* Custom Description Input */}
              <div className="mb-4 flex space-x-2">
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="新しい摘要を追加"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={handleAddCustomDescription}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  追加
                </button>
              </div>

              <div className="space-y-4">
                {expenses.map(expense => (
                  <div key={expense.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{expense.description}</p>
                        <input
                          type="date"
                          value={expense.date}
                          onChange={(e) => {
                            const updatedExpenses = expenses.map(exp =>
                              exp.id === expense.id ? { ...exp, date: e.target.value } : exp
                            );
                            setExpenses(updatedExpenses);
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        <input
                          type="number"
                          value={expense.amount}
                          onChange={(e) => {
                            const updatedExpenses = expenses.map(exp =>
                              exp.id === expense.id ? { ...exp, amount: Number(e.target.value) } : exp
                            );
                            setExpenses(updatedExpenses);
                          }}
                          className="w-32 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="削除"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {expense.receiptUrl && (
                      <img
                        src={expense.receiptUrl}
                        alt="Receipt"
                        className="mt-2 h-20 object-cover rounded"
                      />
                    )}
                    <div className="mt-4 space-y-2">
                      <select
                        value={expense.accountTitle}
                        onChange={(e) => {
                          const updatedExpenses = expenses.map(exp =>
                            exp.id === expense.id ? { ...exp, accountTitle: e.target.value } : exp
                          );
                          setExpenses(updatedExpenses);
                        }}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">勘定科目を選択</option>
                        {DEFAULT_ACCOUNT_TITLES.map(title => (
                          <option key={title} value={title}>
                            {title}
                          </option>
                        ))}
                      </select>

                      <div className="space-y-2">
                        <select
                          value={expense.description}
                          onChange={(e) => {
                            const updatedExpenses = expenses.map(exp =>
                              exp.id === expense.id ? { ...exp, description: e.target.value } : exp
                            );
                            setExpenses(updatedExpenses);
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">摘要を選択</option>
                          {DEFAULT_DESCRIPTIONS.map(desc => (
                            <option key={desc} value={desc}>
                              {desc}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="摘要を直接入力"
                          value={expense.description}
                          onChange={(e) => {
                            const updatedExpenses = expenses.map(exp =>
                              exp.id === expense.id ? { ...exp, description: e.target.value } : exp
                            );
                            setExpenses(updatedExpenses);
                          }}
                          className="block w-full border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />

                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={expense.isFixed}
                              onChange={(e) => {
                                const updatedExpenses = expenses.map(exp =>
                                  exp.id === expense.id ? { ...exp, isFixed: e.target.checked } : exp
                                );
                                setExpenses(updatedExpenses);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">固定費として登録</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Sales Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">日次売上入力</h2>
              <div className="space-y-4">
                {daysInMonth.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const existingSale = dailySales.find(sale => sale.date === dateStr);

                  return (
                    <div key={dateStr} className="flex items-center space-x-2">
                      <span className="w-24 text-sm text-gray-600">{format(day, 'MM/dd')}</span>
                      {existingSale ? (
                        <>
                          <input
                            type="number"
                            value={existingSale.amount}
                            onChange={(e) => {
                              const updatedSales = dailySales.map(sale =>
                                sale.id === existingSale.id
                                  ? { ...sale, amount: Number(e.target.value) }
                                  : sale
                              );
                              setDailySales(updatedSales);
                            }}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="売上金額"
                          />
                          <button
                            onClick={() => handleDeleteDailySales(existingSale.id)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddDailySales(dateStr)}
                          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          売上を追加
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;