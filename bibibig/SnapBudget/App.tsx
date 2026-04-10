import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {BottomTabBar} from './src/components/BottomTabBar';
import {Header} from './src/components/Header';
import {MoreDrawer} from './src/components/MoreDrawer';
import {StartupSplashGate} from './src/components/StartupSplashGate';
import {BENCHMARKS, INSTITUTION_SEEDS, INVESTMENT_INSTITUTION_SEEDS, VARIABLE_CATEGORIES} from './src/constants/app';
import {isSupabaseConfigured, supabase} from './src/lib/supabase';
import {AddScreen} from './src/screens/AddScreen';
import {BudgetManagementScreen} from './src/screens/BudgetManagementScreen';
import {CategoryManagementScreen} from './src/screens/CategoryManagementScreen';
import {DataBackupScreen} from './src/screens/DataBackupScreen';
import {ExcelExportScreen} from './src/screens/ExcelExportScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {InstitutionManagementScreen} from './src/screens/InstitutionManagementScreen';
import {InsightsScreen} from './src/screens/InsightsScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {SubscriptionScreen} from './src/screens/SubscriptionScreen';
import {styles} from './src/styles/appStyles';
import {
  AddTab,
  Asset,
  AssetType,
  FixedExpenseTemplate,
  IncomeMethod,
  Institution,
  InstitutionType,
  Tab,
  Transaction,
  VariableDraft,
  VariableMethod,
} from './src/types/app';
import {firstDayOfMonth, monthDays, monthKeyFromDate, parseCaptureRows, parseCsvRows} from './src/utils/app';

function parseDateFromYmd(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractNoteAmount(note: string | undefined, label: 'Gross' | 'Tax' | 'Deduction') {
  if (!note) {
    return 0;
  }
  const match = new RegExp(`${label}:(-?\\d+(?:\\.\\d+)?)`, 'i').exec(note);
  return match ? Number(match[1]) : 0;
}

function extractDeductionItems(note?: string): Array<{label: string; amount: number}> {
  if (!note) {
    return [];
  }
  const match = /DeductionItems:([^,]+)/i.exec(note);
  if (!match?.[1]) {
    return [];
  }
  return match[1]
    .split(';')
    .map(chunk => {
      const [rawLabel = '', rawAmount = '0'] = chunk.split('=');
      const label = decodeURIComponent(rawLabel || '').trim();
      const amount = Number(decodeURIComponent(rawAmount || '0'));
      return {label, amount: Number.isFinite(amount) ? amount : 0};
    })
    .filter(item => item.label.length > 0 && item.amount > 0);
}

function classifyUpcomingLabel(tx: Transaction) {
  const text = `${tx.category} ${tx.note ?? ''}`.toLowerCase();
  if (tx.type === 'income') {
    return 'Payroll 예정';
  }
  if (text.includes('rent') || text.includes('mortgage')) {
    return 'Rent due';
  }
  if (text.includes('loan')) {
    return 'Loan payment';
  }
  if (text.includes('subscription') || text.includes('netflix') || text.includes('internet') || text.includes('phone')) {
    return 'Subscription due';
  }
  return 'Expense due';
}

function monthDayFromYmd(value?: string) {
  if (!value) {
    return undefined;
  }
  const dayOnly = /^(\d{1,2})$/.exec(value.trim());
  if (dayOnly) {
    const day = Number(dayOnly[1]);
    if (Number.isFinite(day) && day >= 1 && day <= 31) {
      return `01-${String(day).padStart(2, '0')}`;
    }
  }
  const monthDay = /^(\d{2})-(\d{2})$/.exec(value.trim());
  if (monthDay) {
    return `${monthDay[1]}-${monthDay[2]}`;
  }
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}-${match[2]}` : undefined;
}

function dayFromMonthDay(value?: string) {
  if (!value) {
    return null;
  }
  const match = /^(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const day = Number(match[2]);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
}

function dayFromPaymentValue(value: string | undefined, currentMonthDays: number) {
  if (!value) {
    return null;
  }
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  const monthDay = dayFromMonthDay(raw);
  if (monthDay) {
    return monthDay;
  }
  const ymd = /^\d{4}-\d{2}-(\d{2})$/.exec(raw);
  if (ymd) {
    const day = Number(ymd[1]);
    return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
  }
  const ordinal = /^(\d{1,2})(?:st|nd|rd|th)?(?:\s*day)?$/i.exec(raw);
  if (ordinal) {
    const day = Number(ordinal[1]);
    return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
  }
  if (/^end of month$/i.test(raw)) {
    return currentMonthDays;
  }
  return null;
}

function recurringDateForMonth(year: number, month: number, day: number) {
  const max = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, max));
}

function nextRecurringFromDay(day: number, from: Date) {
  const base = new Date(from);
  base.setHours(0, 0, 0, 0);
  let candidate = recurringDateForMonth(base.getFullYear(), base.getMonth(), day);
  if (candidate < base) {
    candidate = recurringDateForMonth(base.getFullYear(), base.getMonth() + 1, day);
  }
  return candidate;
}

function resolveFixedPaymentDate(selection: string, month: Date) {
  const base = firstDayOfMonth(month);
  if (selection === 'End of Month') {
    const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    return `${base.getFullYear()}-${`${base.getMonth() + 1}`.padStart(2, '0')}-${`${lastDay}`.padStart(2, '0')}`;
  }
  const day =
    selection === '1st Day'
      ? 1
      : Number(selection);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return '';
  }
  const maxDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, maxDay);
  return `${base.getFullYear()}-${`${base.getMonth() + 1}`.padStart(2, '0')}-${`${safeDay}`.padStart(2, '0')}`;
}

type EditableBudget = {
  cashOnHand: string;
  food: string;
  gas: string;
  fun: string;
  shopping: string;
  healthcare: string;
  rentMortgage: string;
  utilities: string;
  insurance: string;
  subscriptions: string;
  loanPayments: string;
};

type BudgetCustomItem = {
  id: string;
  section: 'cash' | 'variable' | 'fixed';
  category: string;
  amount: number;
  memo?: string;
};

type AppLanguage = 'English' | 'Korean';
type AppCurrency = 'USD' | 'KRW' | 'EUR';
type TmpUploadTarget = {bucket: string; path: string};

function buildInitialInstitutions(): Institution[] {
  return (Object.keys(INSTITUTION_SEEDS) as InstitutionType[]).flatMap(type =>
    INSTITUTION_SEEDS[type].map(name => ({
      id: `seed-${type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      type,
      name,
      isCustom: false,
      isActive: true,
    })),
  );
}

function mergeInstitutionSeeds(saved: Institution[]) {
  const seed = buildInitialInstitutions();
  const keyOf = (item: Institution) => `${item.type}::${item.name.toLowerCase()}`;
  const map = new Map<string, Institution>();
  seed.forEach(item => map.set(keyOf(item), item));
  saved.forEach(item => map.set(keyOf(item), item));
  return Array.from(map.values());
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const debtAssetTypes: AssetType[] = ['loan', 'student_loan', 'auto_loan', 'personal_loan', 'medical_debt', 'tax_liability'];
const investmentAssetTypes: AssetType[] = ['investment', 'retirement', 'brokerage', 'crypto', 'business_asset'];
const cashAssetTypes: AssetType[] = ['bank_account', 'hsa_fsa', 'cd_money_market'];
const ASSETS_STORAGE_KEY = '@snapbudget/assets/v1';
const ASSETS_MONTHLY_STORAGE_KEY = '@snapbudget/assets-by-month/v1';
const TRANSACTIONS_STORAGE_KEY = '@snapbudget/transactions/v1';
const FIXED_TEMPLATES_STORAGE_KEY = '@snapbudget/fixed-templates/v1';
const INSTITUTIONS_STORAGE_KEY = '@snapbudget/institutions/v1';
const BUDGET_PLAN_STORAGE_KEY = '@snapbudget/budget-plan/v1';
const BUDGET_CUSTOM_STORAGE_KEY = '@snapbudget/budget-custom/v1';
const APP_LANGUAGE_STORAGE_KEY = '@snapbudget/app-language/v1';
const APP_CURRENCY_STORAGE_KEY = '@snapbudget/app-currency/v1';
const AI_DEVICE_ID_STORAGE_KEY = '@snapbudget/ai-device-id/v1';
const AI_CONSENT_STORAGE_KEY = '@snapbudget/ai-consent/v1';
const MERCHANT_CATEGORY_MAP_STORAGE_KEY = '@snapbudget/merchant-category-map/v1';
const CUSTOM_VARIABLE_CATEGORIES_STORAGE_KEY = '@snapbudget/custom-variable-categories/v1';
const MERCHANT_CATEGORY_TABLE = 'merchant_category_map';
const VARIABLE_CATEGORY_TABLE = 'variable_category_catalog';
const AI_TMP_STORAGE_BUCKET = 'tmp';

function sanitizeStorageName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function normalizeMerchantKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&gt;|&lt;|&amp;/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUsableCategory(value?: string | null) {
  const normalized = (value || '').trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'other';
}

type IncomeLineItem = {label: string; amount: string};

function serializeIncomeLineItems(items: IncomeLineItem[]) {
  return items
    .filter(item => item.label.trim() && item.amount.trim())
    .map(item => `${encodeURIComponent(item.label.trim())}=${encodeURIComponent(item.amount.trim())}`)
    .join(';');
}

function formatAssetTypeLabel(type?: string) {
  if (!type) {
    return 'Asset';
  }
  return String(type)
    .split('_')
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function cloneAssets(assets: Asset[]) {
  return assets.map(item => ({...item}));
}

function areAssetsEqual(a: Asset[], b: Asset[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => {
    const other = b[index];
    if (!other) {
      return false;
    }
    return (
      item.id === other.id &&
      item.type === other.type &&
      item.institution === other.institution &&
      item.displayName === other.displayName &&
      item.subtype === other.subtype &&
      item.balance === other.balance &&
      item.limit === other.limit &&
      item.monthlyPayment === other.monthlyPayment &&
      item.dueMonthDay === other.dueMonthDay &&
      item.maturityDate === other.maturityDate
    );
  });
}

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [moreVisible, setMoreVisible] = useState(false);
  const [moreSection, setMoreSection] = useState<
    'settings' | 'backup' | 'excel' | 'budget' | 'institution' | 'category' | 'subscription'
  >('budget');
  const [addTab, setAddTab] = useState<AddTab>('income');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedTemplates, setFixedTemplates] = useState<FixedExpenseTemplate[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsByMonth, setAssetsByMonth] = useState<Record<string, Asset[]>>({});
  const [selectedMonth, setSelectedMonth] = useState(firstDayOfMonth(new Date()));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [overviewModalType, setOverviewModalType] = useState<'income' | 'expense' | null>(null);
  const [recordMode, setRecordMode] = useState(true);
  const [householdSize, setHouseholdSize] = useState(2);
  const [insightCountry, setInsightCountry] = useState('US');
  const [insightState, setInsightState] = useState('CA');
  const [supabaseStatus, setSupabaseStatus] = useState('Not checked');
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('English');
  const [appCurrency, setAppCurrency] = useState<AppCurrency>('USD');
  const [aiConsentAccepted, setAiConsentAccepted] = useState(false);
  const [aiConsentVisible, setAiConsentVisible] = useState(false);
  const [incomeStatus, setIncomeStatus] = useState('');
  const [fixedStatus, setFixedStatus] = useState('');
  const [variableStatus, setVariableStatus] = useState('');
  const [assetStatus, setAssetStatus] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const [incomeType, setIncomeType] = useState('Monthly Salary');
  const [incomeTypeCustom, setIncomeTypeCustom] = useState('');
  const [incomeAccount, setIncomeAccount] = useState('Bank Account');
  const [incomeMethod, setIncomeMethod] = useState<IncomeMethod>('attach');
  const [incomeDate, setIncomeDate] = useState('');
  const [incomeGross, setIncomeGross] = useState('');
  const [incomeNet, setIncomeNet] = useState('');
  const [incomeTax, setIncomeTax] = useState('');
  const [incomeDeduction, setIncomeDeduction] = useState('');
  const [incomeDeductionItems, setIncomeDeductionItems] = useState<IncomeLineItem[]>([]);
  const [incomeAttachment, setIncomeAttachment] = useState('');

  const [fixedCategory, setFixedCategory] = useState('Mortgage');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedDate, setFixedDate] = useState('1st Day');
  const [fixedAccount, setFixedAccount] = useState('Bank Account');
  const [fixedMemo, setFixedMemo] = useState('');

  const [variableMethod, setVariableMethod] = useState<VariableMethod>('manual');
  const [variableCaptureFromCamera, setVariableCaptureFromCamera] = useState(false);
  const [variableSpendMethod, setVariableSpendMethod] = useState('Card');
  const [variableProvider, setVariableProvider] = useState('');
  const [variableCategory, setVariableCategory] = useState('Food');
  const [variableDate, setVariableDate] = useState('');
  const [variableAmount, setVariableAmount] = useState('');
  const [variableMerchant, setVariableMerchant] = useState('');
  const [variableMemo, setVariableMemo] = useState('');
  const [captureInput, setCaptureInput] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [variableDrafts, setVariableDrafts] = useState<VariableDraft[]>([]);
  const [variableAttachment, setVariableAttachment] = useState('');
  const [merchantCategoryMap, setMerchantCategoryMap] = useState<Record<string, string>>({});
  const [customVariableCategories, setCustomVariableCategories] = useState<string[]>([]);

  const [assetType, setAssetType] = useState<AssetType>('bank_account');
  const [assetInstitution, setAssetInstitution] = useState('');
  const [assetSubAccount, setAssetSubAccount] = useState('');
  const [assetDisplayName, setAssetDisplayName] = useState('');
  const [assetBalance, setAssetBalance] = useState('');
  const [assetLimit, setAssetLimit] = useState('');
  const [assetDueDate, setAssetDueDate] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetRate, setAssetRate] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>(() => buildInitialInstitutions());
  const [budgetPlan, setBudgetPlan] = useState<EditableBudget>({
    cashOnHand: '',
    food: '',
    gas: '',
    fun: '',
    shopping: '',
    healthcare: '',
    rentMortgage: '',
    utilities: '',
    insurance: '',
    subscriptions: '',
    loanPayments: '',
  });
  const [budgetCustomItems, setBudgetCustomItems] = useState<BudgetCustomItem[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const aiConsentResolverRef = useRef<((accepted: boolean) => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    const hydrateStorage = async () => {
      const [
        assetsRaw,
        assetsByMonthRaw,
        txRaw,
        fixedTemplatesRaw,
        instRaw,
        budgetRaw,
        budgetCustomRaw,
        appLanguageRaw,
        appCurrencyRaw,
        aiConsentRaw,
        merchantCategoryMapRaw,
        customVariableCategoriesRaw,
      ] =
        await Promise.all([
        AsyncStorage.getItem(ASSETS_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(ASSETS_MONTHLY_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(FIXED_TEMPLATES_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(INSTITUTIONS_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(BUDGET_PLAN_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(BUDGET_CUSTOM_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(APP_CURRENCY_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(AI_CONSENT_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(MERCHANT_CATEGORY_MAP_STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(CUSTOM_VARIABLE_CATEGORIES_STORAGE_KEY).catch(() => null),
      ]);
      if (!mounted) {
        return;
      }
      const parsedAssets = safeParseJson<Array<Asset & {dueDate?: string}>>(assetsRaw);
      const normalizedAssets = Array.isArray(parsedAssets)
        ? parsedAssets.map(item => ({
            ...item,
            dueMonthDay: item.dueMonthDay ?? monthDayFromYmd(item.dueDate),
          }))
        : [];
      const parsedAssetsByMonth = safeParseJson<Record<string, Asset[]>>(assetsByMonthRaw);
      const normalizedAssetsByMonth: Record<string, Asset[]> = {};
      if (parsedAssetsByMonth && typeof parsedAssetsByMonth === 'object' && !Array.isArray(parsedAssetsByMonth)) {
        Object.entries(parsedAssetsByMonth).forEach(([monthKey, monthAssets]) => {
          if (!Array.isArray(monthAssets)) {
            return;
          }
          normalizedAssetsByMonth[monthKey] = monthAssets.map(item => ({
            ...item,
            dueMonthDay: item.dueMonthDay ?? monthDayFromYmd((item as Asset & {dueDate?: string}).dueDate),
          }));
        });
      }
      const initialMonthKey = monthKeyFromDate(selectedMonth);
      const monthAssets = normalizedAssetsByMonth[initialMonthKey];
      if (Array.isArray(monthAssets)) {
        setAssets(cloneAssets(monthAssets));
      } else {
        setAssets(cloneAssets(normalizedAssets));
        if (normalizedAssets.length) {
          normalizedAssetsByMonth[initialMonthKey] = cloneAssets(normalizedAssets);
        }
      }
      setAssetsByMonth(normalizedAssetsByMonth);
      const parsedTx = safeParseJson<Transaction[]>(txRaw);
      if (Array.isArray(parsedTx)) {
        setTransactions(parsedTx);
      }
      const parsedFixedTemplates = safeParseJson<FixedExpenseTemplate[]>(fixedTemplatesRaw);
      if (Array.isArray(parsedFixedTemplates)) {
        setFixedTemplates(parsedFixedTemplates);
      }
      const parsedInst = safeParseJson<Institution[]>(instRaw);
      if (Array.isArray(parsedInst)) {
        setInstitutions(mergeInstitutionSeeds(parsedInst));
      }
      const parsedBudget = safeParseJson<Partial<EditableBudget>>(budgetRaw);
      if (parsedBudget && typeof parsedBudget === 'object') {
        setBudgetPlan(prev => ({...prev, ...parsedBudget}));
      }
      const parsedCustom = safeParseJson<BudgetCustomItem[]>(budgetCustomRaw);
      if (Array.isArray(parsedCustom)) {
        setBudgetCustomItems(parsedCustom);
      }
      if (appLanguageRaw === 'English' || appLanguageRaw === 'Korean') {
        setAppLanguage(appLanguageRaw);
      }
      if (appCurrencyRaw === 'USD' || appCurrencyRaw === 'KRW' || appCurrencyRaw === 'EUR') {
        setAppCurrency(appCurrencyRaw);
      }
      if (aiConsentRaw === 'accepted') {
        setAiConsentAccepted(true);
      }
      const parsedMerchantMap = safeParseJson<Record<string, string>>(merchantCategoryMapRaw);
      if (parsedMerchantMap && typeof parsedMerchantMap === 'object' && !Array.isArray(parsedMerchantMap)) {
        const cleanedMap: Record<string, string> = {};
        Object.entries(parsedMerchantMap).forEach(([merchantKey, category]) => {
          const key = normalizeMerchantKey(merchantKey);
          if (!key || !isUsableCategory(category)) {
            return;
          }
          cleanedMap[key] = category;
        });
        setMerchantCategoryMap(cleanedMap);
      }
      const parsedCustomCategories = safeParseJson<string[]>(customVariableCategoriesRaw);
      if (Array.isArray(parsedCustomCategories)) {
        const normalized = Array.from(
          new Set(
            parsedCustomCategories
              .map(item => (typeof item === 'string' ? item.trim() : ''))
              .filter(Boolean),
          ),
        );
        setCustomVariableCategories(normalized);
      }
      if (mounted) {
        setStorageReady(true);
      }
    };
    hydrateStorage();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    const timer = setTimeout(() => setPersistenceReady(true), 0);
    return () => clearTimeout(timer);
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [assets, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(ASSETS_MONTHLY_STORAGE_KEY, JSON.stringify(assetsByMonth)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [assetsByMonth, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [persistenceReady, storageReady, transactions]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(FIXED_TEMPLATES_STORAGE_KEY, JSON.stringify(fixedTemplates)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [fixedTemplates, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(INSTITUTIONS_STORAGE_KEY, JSON.stringify(institutions)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [institutions, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(BUDGET_PLAN_STORAGE_KEY, JSON.stringify(budgetPlan)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [budgetPlan, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(BUDGET_CUSTOM_STORAGE_KEY, JSON.stringify(budgetCustomItems)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [budgetCustomItems, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [appLanguage, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(APP_CURRENCY_STORAGE_KEY, appCurrency).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [appCurrency, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(AI_CONSENT_STORAGE_KEY, aiConsentAccepted ? 'accepted' : 'pending').catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [aiConsentAccepted, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(MERCHANT_CATEGORY_MAP_STORAGE_KEY, JSON.stringify(merchantCategoryMap)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [merchantCategoryMap, persistenceReady, storageReady]);
  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    AsyncStorage.setItem(CUSTOM_VARIABLE_CATEGORIES_STORAGE_KEY, JSON.stringify(customVariableCategories)).catch(() => {
      // Ignore write errors; app still functions with in-memory state.
    });
  }, [customVariableCategories, persistenceReady, storageReady]);

  useEffect(() => {
    if (!storageReady || !isSupabaseConfigured) {
      return;
    }
    let cancelled = false;
    const hydrateSharedMerchantCategories = async () => {
      const {data, error} = await supabase
        .from(MERCHANT_CATEGORY_TABLE)
        .select('merchant_key, category');
      if (error || !data || cancelled) {
        return;
      }
      const sharedMap: Record<string, string> = {};
      data.forEach((row: {merchant_key?: string | null; category?: string | null}) => {
        const key = normalizeMerchantKey(row.merchant_key || '');
        const category = (row.category || '').trim();
        if (!key || !isUsableCategory(category)) {
          return;
        }
        sharedMap[key] = category;
      });
      if (!Object.keys(sharedMap).length || cancelled) {
        return;
      }
      setMerchantCategoryMap(prev => {
        const merged = {...sharedMap, ...prev};
        const mergedKeys = Object.keys(merged);
        if (mergedKeys.length !== Object.keys(prev).length) {
          return merged;
        }
        for (const key of mergedKeys) {
          if (merged[key] !== prev[key]) {
            return merged;
          }
        }
        return prev;
      });
    };
    void hydrateSharedMerchantCategories();
    return () => {
      cancelled = true;
    };
  }, [storageReady]);

  const selectedMonthKey = useMemo(() => monthKeyFromDate(selectedMonth), [selectedMonth]);
  useEffect(() => {
    if (!storageReady) {
      return;
    }
    const scopedAssets = assetsByMonth[selectedMonthKey] ?? [];
    setAssets(prev => (areAssetsEqual(prev, scopedAssets) ? prev : cloneAssets(scopedAssets)));
  }, [assetsByMonth, selectedMonthKey, storageReady]);

  useEffect(() => {
    if (!storageReady || !persistenceReady) {
      return;
    }
    setAssetsByMonth(prev => {
      const current = prev[selectedMonthKey] ?? [];
      if (areAssetsEqual(current, assets)) {
        return prev;
      }
      return {
        ...prev,
        [selectedMonthKey]: cloneAssets(assets),
      };
    });
  }, [assets, persistenceReady, selectedMonthKey, storageReady]);

  const monthlyTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(selectedMonthKey)),
    [transactions, selectedMonthKey],
  );
  const previousMonthKey = useMemo(() => {
    const prev = firstDayOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
    return monthKeyFromDate(prev);
  }, [selectedMonth]);
  const selectedYearPrefix = useMemo(() => `${selectedMonth.getFullYear()}-`, [selectedMonth]);
  const previousMonthlyTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(previousMonthKey)),
    [previousMonthKey, transactions],
  );
  const yearlyTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(selectedYearPrefix)),
    [transactions, selectedYearPrefix],
  );
  const totalIncome = useMemo(
    () => monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  );
  const totalFixed = useMemo(
    () => monthlyTransactions.filter(t => t.type === 'fixed_cost').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  );
  const totalVariable = useMemo(
    () =>
      monthlyTransactions
        .filter(t => t.type === 'variable_expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  );
  const net = totalIncome - totalFixed - totalVariable;
  const currentTotalExpense = totalFixed + totalVariable;

  const totalAssets = useMemo(() => {
    return assets.reduce((sum, asset) => {
      if (asset.type === 'card') {
        return sum - Number(asset.balance || 0);
      }
      if (debtAssetTypes.includes(asset.type)) {
        return sum - Number(asset.balance || 0);
      }
      return sum + Number(asset.balance || 0);
    }, 0);
  }, [assets]);
  const assetSummary = useMemo(() => {
    const cash = assets
      .filter(asset => cashAssetTypes.includes(asset.type))
      .reduce((sum, asset) => sum + Number(asset.balance || 0), 0);
    const investment = assets
      .filter(asset => investmentAssetTypes.includes(asset.type))
      .reduce((sum, asset) => sum + Number(asset.balance || 0), 0);
    const home = assets
      .filter(asset => asset.type === 'home' || asset.type === 'auto')
      .reduce((sum, asset) => sum + Number(asset.balance || 0), 0);
    const cardDebt = assets
      .filter(asset => asset.type === 'card')
      .reduce((sum, asset) => sum + Number(asset.balance || 0), 0);
    const loanDebt = assets
      .filter(asset => debtAssetTypes.includes(asset.type))
      .reduce((sum, asset) => sum + Number(asset.balance || 0), 0);
    const debt = cardDebt + loanDebt;
    return {
      cash,
      investment,
      home,
      debt,
      net: cash + investment + home - debt,
    };
  }, [assets]);

  const avgByHousehold = BENCHMARKS[householdSize] ?? BENCHMARKS[2];
  const calendarStartOffset = useMemo(() => firstDayOfMonth(selectedMonth).getDay(), [selectedMonth]);
  const currentMonthDays = useMemo(() => monthDays(selectedMonth), [selectedMonth]);
  const dayCells = useMemo(() => {
    const items: Array<number | null> = [];
    for (let i = 0; i < calendarStartOffset; i += 1) {
      items.push(null);
    }
    for (let day = 1; day <= currentMonthDays; day += 1) {
      items.push(day);
    }
    return items;
  }, [calendarStartOffset, currentMonthDays]);
  const dailySummary = useMemo(() => {
    const map: Record<number, {income: number; fixed: number; variable: number}> = {};
    monthlyTransactions.forEach(tx => {
      const day = Number((tx.date || '').slice(-2));
      if (!Number.isFinite(day) || day < 1 || day > 31) {
        return;
      }
      if (!map[day]) {
        map[day] = {income: 0, fixed: 0, variable: 0};
      }
      if (tx.type === 'income') {
        map[day].income += tx.amount;
      } else if (tx.type === 'fixed_cost') {
        map[day].fixed += tx.amount;
      } else {
        map[day].variable += tx.amount;
      }
    });
    return map;
  }, [monthlyTransactions]);
  const payrollSummary = useMemo(() => {
    return monthlyTransactions
      .filter(tx => tx.type === 'income')
      .reduce(
        (acc, tx) => {
          acc.gross += extractNoteAmount(tx.note, 'Gross');
          acc.taxes += extractNoteAmount(tx.note, 'Tax');
          acc.deductions += extractNoteAmount(tx.note, 'Deduction');
          acc.net += tx.amount;
          return acc;
        },
        {gross: 0, taxes: 0, deductions: 0, net: 0},
      );
  }, [monthlyTransactions]);
  const previousPayrollSummary = useMemo(() => {
    return previousMonthlyTransactions
      .filter(tx => tx.type === 'income')
      .reduce(
        (acc, tx) => {
          acc.gross += extractNoteAmount(tx.note, 'Gross');
          acc.taxes += extractNoteAmount(tx.note, 'Tax');
          acc.deductions += extractNoteAmount(tx.note, 'Deduction');
          acc.net += tx.amount;
          return acc;
        },
        {gross: 0, taxes: 0, deductions: 0, net: 0},
      );
  }, [previousMonthlyTransactions]);
  const incomeComparisonRows = useMemo(
    () => [
      {
        metric: 'Income',
        previousAmount: previousPayrollSummary.net,
        currentAmount: payrollSummary.net,
        difference: payrollSummary.net - previousPayrollSummary.net,
        positiveIsGood: true,
      },
      {
        metric: 'Gross',
        previousAmount: previousPayrollSummary.gross,
        currentAmount: payrollSummary.gross,
        difference: payrollSummary.gross - previousPayrollSummary.gross,
        positiveIsGood: true,
      },
      {
        metric: 'Tax',
        previousAmount: previousPayrollSummary.taxes,
        currentAmount: payrollSummary.taxes,
        difference: payrollSummary.taxes - previousPayrollSummary.taxes,
        positiveIsGood: false,
      },
      {
        metric: 'Deduction',
        previousAmount: previousPayrollSummary.deductions,
        currentAmount: payrollSummary.deductions,
        difference: payrollSummary.deductions - previousPayrollSummary.deductions,
        positiveIsGood: false,
      },
    ],
    [payrollSummary, previousPayrollSummary],
  );
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTransactions
      .filter(tx => tx.type !== 'income')
      .forEach(tx => {
        const key = (tx.category || 'Other').trim() || 'Other';
        map[key] = (map[key] ?? 0) + tx.amount;
      });
    return Object.entries(map)
      .map(([category, amount]) => ({category, amount}))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);
  const previousExpenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    previousMonthlyTransactions
      .filter(tx => tx.type !== 'income')
      .forEach(tx => {
        const key = (tx.category || 'Other').trim() || 'Other';
        map[key] = (map[key] ?? 0) + tx.amount;
      });
    return map;
  }, [previousMonthlyTransactions]);
  const expenseComparisonByCategory = useMemo(() => {
    const currentMap = expenseByCategory.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = item.amount;
      return acc;
    }, {});
    const keys = new Set([...Object.keys(previousExpenseByCategory), ...Object.keys(currentMap)]);
    return Array.from(keys)
      .map(category => {
        const previousAmount = previousExpenseByCategory[category] ?? 0;
        const currentAmount = currentMap[category] ?? 0;
        return {
          category,
          previousAmount,
          currentAmount,
          difference: currentAmount - previousAmount,
        };
      })
      .sort((a, b) => Math.max(b.currentAmount, b.previousAmount) - Math.max(a.currentAmount, a.previousAmount));
  }, [expenseByCategory, previousExpenseByCategory]);
  const spikeAlerts = useMemo(() => {
    return expenseComparisonByCategory
      .filter(item => item.difference > 0)
      .sort((a, b) => b.difference - a.difference)
      .slice(0, 2)
      .map(item => ({category: item.category, amount: item.difference}));
  }, [expenseComparisonByCategory]);
  const deductionByItem = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyTransactions
      .filter(tx => tx.type === 'income')
      .forEach(tx => {
        extractDeductionItems(tx.note).forEach(item => {
          map[item.label] = (map[item.label] ?? 0) + item.amount;
        });
      });
    return Object.entries(map)
      .map(([label, amount]) => ({label, amount}))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions]);
  const yearlyPayrollSummary = useMemo(() => {
    return yearlyTransactions
      .filter(tx => tx.type === 'income')
      .reduce(
        (acc, tx) => {
          acc.gross += extractNoteAmount(tx.note, 'Gross');
          acc.taxes += extractNoteAmount(tx.note, 'Tax');
          acc.deductions += extractNoteAmount(tx.note, 'Deduction');
          acc.net += tx.amount;
          return acc;
        },
        {gross: 0, taxes: 0, deductions: 0, net: 0},
      );
  }, [yearlyTransactions]);
  const dayEventLabels = useMemo(() => {
    const tagMap: Record<number, Set<string>> = {};
    monthlyTransactions.forEach(tx => {
      const day = Number((tx.date || '').slice(-2));
      if (!Number.isFinite(day) || day < 1 || day > 31) {
        return;
      }
      if (!tagMap[day]) {
        tagMap[day] = new Set<string>();
      }
      if (tx.type === 'income') {
        tagMap[day].add('Income');
        tagMap[day].add('Payroll');
      } else {
        tagMap[day].add('Expense');
      }
      const text = `${tx.category} ${tx.note ?? ''}`.toLowerCase();
      if (text.includes('rent') || text.includes('mortgage')) {
        tagMap[day].add('Rent');
      }
      if (text.includes('loan')) {
        tagMap[day].add('Loan');
      }
      if (text.includes('subscription') || text.includes('netflix') || text.includes('internet') || text.includes('phone')) {
        tagMap[day].add('Sub');
      }
    });
    assets.forEach(asset => {
      const dueDay = dayFromPaymentValue(asset.dueMonthDay, currentMonthDays);
      if (!dueDay || dueDay > currentMonthDays) {
        return;
      }
      if (!tagMap[dueDay]) {
        tagMap[dueDay] = new Set<string>();
      }
      tagMap[dueDay].add('Pay Due');
    });
    return Object.fromEntries(
      Object.entries(tagMap).map(([day, set]) => [Number(day), Array.from(set)]),
    ) as Record<number, string[]>;
  }, [assets, currentMonthDays, monthlyTransactions]);
  const paymentDueByDay = useMemo(() => {
    const map: Record<number, string[]> = {};
    assets.forEach(asset => {
      const isCardOrLoan = asset.type === 'card' || debtAssetTypes.includes(asset.type);
      if (!isCardOrLoan) {
        return;
      }
      const dueDay = dayFromPaymentValue(asset.dueMonthDay, currentMonthDays);
      if (!dueDay || dueDay > currentMonthDays) {
        return;
      }
      if (!map[dueDay]) {
        map[dueDay] = [];
      }
      map[dueDay].push(asset.displayName || asset.institution || 'Payment');
    });
    return map;
  }, [assets, currentMonthDays]);
  const upcomingItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    const rows = [...transactions]
      .map(tx => ({tx, parsed: parseDateFromYmd(tx.date)}))
      .filter(item => item.parsed && item.parsed >= today && item.parsed <= end)
      .sort((a, b) => {
        if (!a.parsed || !b.parsed) {
          return 0;
        }
        return a.parsed.getTime() - b.parsed.getTime();
      });
    const seen = new Set<string>();
    const items: string[] = [];
    rows.forEach(({tx, parsed}) => {
      if (!parsed) {
        return;
      }
      const label = classifyUpcomingLabel(tx);
      const key = `${parsed.toISOString().slice(0, 10)}-${label}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      items.push(`${parsed.toISOString().slice(5, 10)} · ${label}`);
    });
    const recurring = assets
      .map(asset => {
        const day = dayFromMonthDay(asset.dueMonthDay);
        if (!day) {
          return null;
        }
        const next = nextRecurringFromDay(day, today);
        if (next > end) {
          return null;
        }
        return {
          date: next,
          label: `${next.toISOString().slice(5, 10)} · ${asset.displayName} Payment Due`,
        };
      })
      .filter(Boolean) as Array<{date: Date; label: string}>;
    recurring
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(item => {
        if (!seen.has(item.label)) {
          items.push(item.label);
          seen.add(item.label);
        }
      });
    return items.slice(0, 7);
  }, [assets, transactions]);
  const budgetProgress = useMemo(() => {
    const budgets = [
      {label: 'Food', budget: Number(budgetPlan.food) || 0, aliases: ['food', 'dining']},
      {label: 'Gas', budget: Number(budgetPlan.gas) || 0, aliases: ['gas', 'transport']},
      {label: 'Fun', budget: Number(budgetPlan.fun) || 0, aliases: ['fun', 'entertainment']},
      {label: 'Shopping', budget: Number(budgetPlan.shopping) || 0, aliases: ['shopping']},
      {label: 'Healthcare', budget: Number(budgetPlan.healthcare) || 0, aliases: ['healthcare']},
    ];
    const variable = monthlyTransactions.filter(tx => tx.type === 'variable_expense');
    return budgets.slice(0, 5).map(item => {
      const spent = variable
        .filter(tx => item.aliases.some(alias => tx.category.toLowerCase().includes(alias)))
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        label: item.label,
        spent,
        budget: item.budget,
        ratio: item.budget ? spent / item.budget : 0,
      };
    });
  }, [monthlyTransactions, budgetPlan.food, budgetPlan.fun, budgetPlan.gas, budgetPlan.healthcare, budgetPlan.shopping]);
  const aiMonthlySpend = totalFixed + totalVariable;
  const aiDiff = aiMonthlySpend - avgByHousehold;
  const aiRecommendation =
    aiDiff > 500
      ? 'Your spending is above average. Reduce variable expenses and revisit fixed costs.'
      : aiDiff < -500
        ? 'You are below average spending. Keep this pace and increase savings/investment.'
        : 'You are near average. Optimize discretionary spending to improve net assets.';
  const insightStatus = useMemo<{level: 'Good' | 'Warning' | 'Risk'; message: string}>(() => {
    if (aiDiff > 500) {
      return {level: 'Risk', message: 'Spending is significantly above benchmark this month.'};
    }
    if (aiDiff > 0) {
      return {level: 'Warning', message: 'Spending is slightly above benchmark. Review variable expenses.'};
    }
    return {level: 'Good', message: 'Spending is at or below benchmark. Keep this trend.'};
  }, [aiDiff]);
  const categoryTrend = useMemo(() => {
    const toMap = (rows: Transaction[]) => {
      const map: Record<string, number> = {};
      rows
        .filter(tx => tx.type === 'variable_expense')
        .forEach(tx => {
          const key = tx.category.trim();
          map[key] = (map[key] ?? 0) + tx.amount;
        });
      return map;
    };
    const currentMap = toMap(monthlyTransactions);
    const previousMap = toMap(previousMonthlyTransactions);
    const keys = Array.from(new Set([...Object.keys(currentMap), ...Object.keys(previousMap)]));
    return keys
      .map(key => {
        const current = currentMap[key] ?? 0;
        const previous = previousMap[key] ?? 0;
        const diff = current - previous;
        const ratio = previous > 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;
        return {category: key, current, previous, diff, ratio};
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 5);
  }, [monthlyTransactions, previousMonthlyTransactions]);
  const budgetAlerts = useMemo(() => {
    return budgetProgress
      .filter(item => item.budget > 0 && item.ratio >= 0.8)
      .map(item => ({
        label: item.label,
        ratio: item.ratio,
        spent: item.spent,
        budget: item.budget,
      }));
  }, [budgetProgress]);
  const currencySymbol = useMemo(() => {
    if (appCurrency === 'KRW') {
      return '₩';
    }
    if (appCurrency === 'EUR') {
      return '€';
    }
    return '$';
  }, [appCurrency]);
  const recentActivity = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(tx => {
        const merchant = tx.note?.split(' / ')[0]?.trim();
        const title = tx.type === 'variable_expense' ? merchant || tx.category : tx.category;
        return {
          id: tx.id,
          title,
          amountLabel: `${tx.type === 'income' ? '+' : '-'}${currencySymbol}${tx.amount.toFixed(2)}`,
          isIncome: tx.type === 'income',
        };
      });
  }, [currencySymbol, transactions]);
  const fixedBudgetSettings = [
    {label: 'Rent / Mortgage', amount: Number(budgetPlan.rentMortgage) || 0},
    {label: 'Utilities', amount: Number(budgetPlan.utilities) || 0},
    {label: 'Insurance', amount: Number(budgetPlan.insurance) || 0},
    {label: 'Subscriptions', amount: Number(budgetPlan.subscriptions) || 0},
    {label: 'Loan Payments', amount: Number(budgetPlan.loanPayments) || 0},
  ].filter(item => item.amount > 0);
  const selectedDayTransactions = (Array.isArray(monthlyTransactions) ? monthlyTransactions : []).filter(
    tx => Number((tx?.date || '').slice(-2)) === selectedDay,
  );
  const incomingTransactions = selectedDayTransactions.filter(tx => tx?.type === 'income');
  const outgoingTransactions = selectedDayTransactions.filter(tx => tx?.type !== 'income');
  const dailyIncomingTotal = incomingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const dailyOutgoingTotal = outgoingTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const selectedDayDebtAssets = (Array.isArray(assets) ? assets : []).filter(asset => {
    if (!asset) {
      return false;
    }
    const isCardOrLoan = asset.type === 'card' || debtAssetTypes.includes(asset.type);
    if (!isCardOrLoan) {
      return false;
    }
    const dueDay = dayFromPaymentValue(asset.dueMonthDay, currentMonthDays);
    return Boolean(selectedDay && dueDay === selectedDay);
  });
  const selectedDayDebtDueItems = selectedDayDebtAssets.map(asset => {
    if (!asset) {
      return '';
    }
    const typeLabel = formatAssetTypeLabel(asset.type);
    const name = asset.displayName || asset.institution || 'Payment';
    const balance = Number(asset.balance || 0);
    const hasLimit = asset.limit !== undefined && asset.limit !== null && String(asset.limit).trim() !== '';
    const limit = Number(asset.limit || 0);
    const parts = [typeLabel, name];
    parts.push(`${currencySymbol}${Math.abs(balance).toLocaleString()}`);
    if (hasLimit) {
      parts.push(`${currencySymbol}${Math.abs(limit).toLocaleString()}`);
    }
    return parts.join(' / ');
  }).filter(Boolean);

  const institutionOptionsByType = useMemo(() => {
    const list = Array.isArray(institutions) ? institutions : [];
    return {
      bank: list.filter(i => i.type === 'bank' && i.isActive !== false).map(i => i.name),
      card: list.filter(i => i.type === 'card' && i.isActive !== false).map(i => i.name),
      loan: list.filter(i => i.type === 'loan' && i.isActive !== false).map(i => i.name),
      insurance: list.filter(i => i.type === 'insurance' && i.isActive !== false).map(i => i.name),
    };
  }, [institutions]);
  const variableInstitutionOptions = useMemo(() => {
    if (variableSpendMethod === 'Card') {
      return institutionOptionsByType.card;
    }
    if (variableSpendMethod === 'Bank Transfer' || variableSpendMethod === 'Check') {
      return institutionOptionsByType.bank;
    }
    return [...institutionOptionsByType.card, ...institutionOptionsByType.bank];
  }, [institutionOptionsByType, variableSpendMethod]);
  const assetInstitutionOptions = useMemo(() => {
    if (assetType === 'card') {
      return institutionOptionsByType.card;
    }
    if (debtAssetTypes.includes(assetType)) {
      return institutionOptionsByType.loan;
    }
    if (assetType === 'investment') {
      return Array.from(new Set([...INVESTMENT_INSTITUTION_SEEDS, ...institutionOptionsByType.bank]));
    }
    if (assetType === 'home' || assetType === 'auto') {
      return institutionOptionsByType.insurance;
    }
    return institutionOptionsByType.bank;
  }, [assetType, institutionOptionsByType]);
  const variableCategories = useMemo(() => {
    const base = Array.isArray(VARIABLE_CATEGORIES) ? VARIABLE_CATEGORIES : [];
    const custom = Array.isArray(customVariableCategories) ? customVariableCategories : [];
    const merged = [...base, ...custom];
    return Array.from(new Set(merged.map(item => item.trim()).filter(Boolean)));
  }, [customVariableCategories]);
  const filteredRecords = useMemo(() => {
    return (
      addTab === 'income'
        ? monthlyTransactions.filter(t => t.type === 'income')
        : addTab === 'fixed'
          ? monthlyTransactions.filter(t => t.type === 'fixed_cost')
          : addTab === 'variable'
            ? monthlyTransactions.filter(t => t.type === 'variable_expense')
            : []
    );
  }, [addTab, monthlyTransactions]);

  const moveMonth = (direction: -1 | 1) => {
    setSelectedMonth(prev => firstDayOfMonth(new Date(prev.getFullYear(), prev.getMonth() + direction, 1)));
    setSelectedDay(null);
  };
  const openDayDetails = (day: number) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };
  const openIncomeOverviewDetails = () => setOverviewModalType('income');
  const openExpenseOverviewDetails = () => setOverviewModalType('expense');
  const closeOverviewDetails = () => setOverviewModalType(null);

  const addIncome = () => {
    const netValue = Number(incomeNet);
    if (!netValue || !incomeDate) {
      setIncomeStatus('Income requires date and net amount.');
      return false;
    }
    const incomeCategory = incomeType === 'Other' ? incomeTypeCustom || 'Other Income' : incomeType;
    const nextTx: Transaction = {
      id: editingTransactionId ?? `income-${Date.now()}`,
      type: 'income',
      category: incomeCategory,
      amount: netValue,
      date: incomeDate,
      account: incomeAccount,
      note: `Gross:${incomeGross || '0'}, Tax:${incomeTax || '0'}, Deduction:${incomeDeduction || '0'}, DeductionItems:${serializeIncomeLineItems(
        incomeDeductionItems,
      )}`,
    };
    setTransactions(prev =>
      editingTransactionId ? prev.map(tx => (tx.id === editingTransactionId ? nextTx : tx)) : [nextTx, ...prev],
    );
    setEditingTransactionId(null);
    setIncomeStatus('');
    return true;
  };
  const addFixed = () => {
    const amount = Number(fixedAmount);
    const resolvedFixedDate = resolveFixedPaymentDate(fixedDate || '1st Day', selectedMonth);
    if (!amount || !resolvedFixedDate) {
      setFixedStatus('Fixed expense requires amount and payment day.');
      return false;
    }
    const nextTx: Transaction = {
      id: editingTransactionId ?? `fixed-${Date.now()}`,
      type: 'fixed_cost',
      category: fixedCategory,
      amount,
      date: resolvedFixedDate,
      account: fixedAccount,
      note: fixedMemo,
    };
    setTransactions(prev =>
      editingTransactionId ? prev.map(tx => (tx.id === editingTransactionId ? nextTx : tx)) : [nextTx, ...prev],
    );
    setEditingTransactionId(null);
    setFixedStatus('');
    return true;
  };
  const addVariableManual = () => {
    const amount = Number(variableAmount);
    if (!amount || !variableDate) {
      setVariableStatus('Variable expense requires amount and date.');
      return false;
    }
    const nextTx: Transaction = {
      id: editingTransactionId ?? `var-${Date.now()}`,
      type: 'variable_expense',
      category: variableCategory,
      amount,
      date: variableDate,
      account: variableProvider,
      note: `${variableMerchant}${variableMemo ? ` / ${variableMemo}` : ''}`,
    };
    setTransactions(prev =>
      editingTransactionId ? prev.map(tx => (tx.id === editingTransactionId ? nextTx : tx)) : [nextTx, ...prev],
    );
    setEditingTransactionId(null);
    setVariableStatus('Variable expense registered.');
    return true;
  };
  const upsertFixedTemplate = (payload: Omit<FixedExpenseTemplate, 'id'> & {id?: string}) => {
    const nextTemplate: FixedExpenseTemplate = {
      id: payload.id ?? `fixed-template-${Date.now()}`,
      category: payload.category,
      amount: payload.amount,
      paymentDay: payload.paymentDay || '1st Day',
      account: payload.account,
      memo: payload.memo,
    };
    setFixedTemplates(prev =>
      payload.id ? prev.map(item => (item.id === payload.id ? nextTemplate : item)) : [nextTemplate, ...prev],
    );
  };
  const deleteFixedTemplate = (id: string) => {
    setFixedTemplates(prev => prev.filter(item => item.id !== id));
  };
  const importFixedTemplatesToCurrentMonth = () => {
    if (!fixedTemplates.length) {
      setFixedStatus('No fixed expense templates to import.');
      return;
    }
    const mapped = fixedTemplates
      .map(template => {
        const amount = Number(template.amount);
        const date = resolveFixedPaymentDate(template.paymentDay || '1st Day', selectedMonth);
        if (!amount || !date) {
          return null;
        }
        return {
          id: `fixed-${Date.now()}-${template.id}`,
          type: 'fixed_cost' as const,
          category: template.category,
          amount,
          date,
          account: template.account,
          note: template.memo || '',
        };
      })
      .filter(Boolean) as Transaction[];
    if (!mapped.length) {
      setFixedStatus('No valid templates to import.');
      return;
    }
    setTransactions(prev => {
      const existingKeys = new Set(prev.map(item => `${item.type}|${item.category}|${item.date}|${item.account}|${item.amount}`));
      const toAdd = mapped.filter(item => !existingKeys.has(`${item.type}|${item.category}|${item.date}|${item.account}|${item.amount}`));
      setFixedStatus(toAdd.length ? `${toAdd.length} fixed expenses imported.` : 'No new fixed expenses to import.');
      return toAdd.length ? [...toAdd, ...prev] : prev;
    });
  };
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    if (editingTransactionId === id) {
      setEditingTransactionId(null);
    }
  };
  const getOrCreateAiDeviceId = async () => {
    const saved = await AsyncStorage.getItem(AI_DEVICE_ID_STORAGE_KEY).catch(() => null);
    if (saved) {
      return saved;
    }
    const next = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(AI_DEVICE_ID_STORAGE_KEY, next).catch(() => {
      // Ignore write errors and still return generated id.
    });
    return next;
  };
  const ensureAiConsent = async () => {
    if (aiConsentAccepted) {
      return true;
    }
    setAiConsentVisible(true);
    return new Promise<boolean>(resolve => {
      aiConsentResolverRef.current = resolve;
    });
  };
  const getReadableErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('network request timed out') || lower.includes('timed out') || lower.includes('abort')) {
        return 'AI request timed out. Try a smaller PDF or retry with stable network.';
      }
    }
    if (error && typeof error === 'object') {
      const maybeError = error as {name?: string; message?: string; context?: {status?: number; statusText?: string}};
      if (maybeError.message?.includes('non-2xx') || maybeError.name === 'FunctionsHttpError') {
        const status = maybeError.context?.status;
        const statusText = maybeError.context?.statusText;
        return status
          ? `AI backend returned HTTP ${status}${statusText ? ` (${statusText})` : ''}. Check Supabase Edge Function logs/env.`
          : 'AI backend returned a non-2xx response. Check Supabase Edge Function logs/env.';
      }
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return 'Unknown error';
  };
  const uploadToAiTmpStorage = async (params: {
    uri?: string;
    fileName: string;
    contentType?: string;
    deviceId: string;
  }): Promise<TmpUploadTarget> => {
    if (!params.uri) {
      throw new Error('Selected file URI is missing.');
    }
    const response = await fetch(params.uri);
    if (!response.ok) {
      throw new Error(`Failed to read selected file (HTTP ${response.status}).`);
    }
    const buffer = await response.arrayBuffer();
    const safeName = sanitizeStorageName(params.fileName || 'upload.bin');
    const path = `${params.deviceId}/${Date.now()}-${safeName}`;
    const {error} = await supabase.storage.from(AI_TMP_STORAGE_BUCKET).upload(path, buffer, {
      contentType: params.contentType || 'application/octet-stream',
      upsert: false,
    });
    if (error) {
      throw new Error(`Temporary upload failed: ${error.message}`);
    }
    return {bucket: AI_TMP_STORAGE_BUCKET, path};
  };
  const removeAiTmpStorageObject = async (target?: TmpUploadTarget | null) => {
    if (!target) {
      return;
    }
    await supabase.storage.from(target.bucket).remove([target.path]).catch(() => {
      // Best-effort cleanup. Function also tries to delete this path.
    });
  };
  const invokeAiRead = async (params: {
    flow: 'income' | 'variable';
    source: 'camera' | 'attach' | 'pdf';
    fileName: string;
    uri?: string;
    storageBucket?: string;
    storagePath?: string;
  }) => {
    if (!isSupabaseConfigured) {
      throw new Error('AI backend is not configured. Check Settings > Supabase.');
    }
    const deviceId = await getOrCreateAiDeviceId();
    const {data, error} = await supabase.functions.invoke('snapbudget-ai-read', {
      body: {
        flow: params.flow,
        source: params.source,
        fileName: params.fileName,
        uri: params.uri,
        storageBucket: params.storageBucket,
        storagePath: params.storagePath,
        deviceId,
        consent: true,
        consentVersion: 'v1',
      },
    });
    if (error) {
      throw error;
    }
    return data as
      | {
          income?: {
            gross?: string;
            net?: string;
            tax?: string;
            deduction?: string;
            date?: string;
            deductionItems?: Array<{label?: string; amount?: string}>;
          };
          rows?: Array<{category?: string; amount?: string; date?: string; merchant?: string}>;
          meta?: {mode?: 'parsed_from_text' | 'no_text_payload'; fileName?: string; source?: 'camera' | 'attach' | 'pdf'};
        }
      | null;
  };
  const applyIncomeAnalysisResult = (
    income?: {
      gross?: string;
      net?: string;
      tax?: string;
      deduction?: string;
      date?: string;
      deductionItems?: Array<{label?: string; amount?: string}>;
    },
  ) => {
    const parseMoney = (value: string) => {
      const normalized = value.replace(/,/g, '').trim();
      if (!normalized) {
        return null;
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const asText = (value: number | null) => (value === null ? '' : String(value));

    let gross = (income?.gross ?? '').trim();
    const netValue = (income?.net ?? '').trim();
    let tax = (income?.tax ?? '').trim();
    let deduction = (income?.deduction ?? '').trim();
    const date = (income?.date ?? '').trim();
    const deductionItems = (income?.deductionItems ?? [])
      .map(item => ({label: (item.label || '').trim(), amount: (item.amount || '').trim()}))
      .filter(item => item.label && item.amount);

    const grossNum = parseMoney(gross);
    const netNum = parseMoney(netValue);
    const taxNum = parseMoney(tax);
    const deductionNum = parseMoney(deduction);

    // Fill missing totals when enough components exist.
    if (!gross && netNum !== null && taxNum !== null && deductionNum !== null) {
      gross = asText(netNum + taxNum + deductionNum);
    }
    if (!deduction && grossNum !== null && netNum !== null && taxNum !== null) {
      const estimatedDeduction = grossNum - netNum - taxNum;
      if (estimatedDeduction >= 0) {
        deduction = asText(estimatedDeduction);
      }
    }

    // Guard against OCR misread where tax is accidentally equal to gross.
    if (grossNum !== null && netNum !== null && taxNum !== null && taxNum >= grossNum) {
      const diff = grossNum - netNum;
      if (diff >= 0) {
        tax = asText(diff);
      }
    }

    setIncomeGross(gross);
    setIncomeNet(netValue);
    setIncomeTax(tax);
    setIncomeDeduction(deduction);
    setIncomeDate(date);
    setIncomeDeductionItems(deductionItems);

    const amountFieldCount = [gross, netValue, tax, deduction].filter(Boolean).length;
    if (amountFieldCount >= 2) {
      setIncomeStatus('AI analysis complete. Review Income Detail Input before save.');
      return;
    }
    if (amountFieldCount === 1 || date) {
      setIncomeStatus('AI partially parsed data. Check Income Detail Input and fill missing amount fields.');
      return;
    }
    setIncomeStatus('AI connected, but no readable income fields were mapped. You can enter manually.');
  };
  const mapVariableRowsToDrafts = (rows: Array<{category?: string; amount?: string; date?: string; merchant?: string}>) => {
    return rows.map((row, index) => {
      const merchant = row.merchant || '';
      const learnedRaw = merchantCategoryMap[normalizeMerchantKey(merchant)];
      const learned = isUsableCategory(learnedRaw) ? learnedRaw : '';
      return {
        id: `ai-${Date.now()}-${index}`,
        category: learned || row.category || 'Other',
        amount: row.amount || '',
        date: row.date || '',
        merchant,
      };
    });
  };
  const syncMerchantCategoriesToSupabase = async (
    entries: Array<{merchantKey: string; category: string; merchant: string}>,
  ) => {
    if (!isSupabaseConfigured || !entries.length) {
      return;
    }
    const dedupedByKey: Record<
      string,
      {merchant_key: string; category: string; merchant_label: string; updated_at: string}
    > = {};
    entries.forEach(entry => {
      if (!entry.merchantKey || !isUsableCategory(entry.category)) {
        return;
      }
      dedupedByKey[entry.merchantKey] = {
        merchant_key: entry.merchantKey,
        category: entry.category.trim(),
        merchant_label: entry.merchant.trim(),
        updated_at: new Date().toISOString(),
      };
    });
    const payload = Object.values(dedupedByKey);
    if (!payload.length) {
      return;
    }
    const {error} = await supabase.from(MERCHANT_CATEGORY_TABLE).upsert(payload, {onConflict: 'merchant_key'});
    if (error) {
      // Local learning remains active even when shared sync fails.
      console.warn('merchant_category_map upsert failed', error.message);
    }
  };
  const syncVariableCategoriesToSupabase = async (categories: string[]) => {
    if (!isSupabaseConfigured || !categories.length) {
      return;
    }
    const payload = Array.from(
      new Set(
        categories
          .map(category => category.trim())
          .filter(Boolean),
      ),
    ).map(category => ({
      category,
      updated_at: new Date().toISOString(),
    }));
    if (!payload.length) {
      return;
    }
    const {error} = await supabase.from(VARIABLE_CATEGORY_TABLE).upsert(payload, {onConflict: 'category'});
    if (error) {
      console.warn('variable_category_catalog upsert failed', error.message);
    }
  };

  const bulkRegisterVariable = () => {
    if (!variableDrafts.length) {
      setVariableStatus('No parsed rows to register.');
      return;
    }
    const mapped = variableDrafts
      .filter(d => Number(d.amount) > 0 && d.date)
      .map(d => ({
        id: `bulk-${Date.now()}-${d.id}`,
        type: 'variable_expense' as const,
        category: d.category,
        amount: Number(d.amount),
        date: d.date,
        account: variableProvider,
        note: d.merchant,
      }));
    if (!mapped.length) {
      setVariableStatus('No valid rows to register. Check date/amount fields in parsed list.');
      return;
    }
    const learnedEntries = variableDrafts
      .map(draft => ({
        merchantKey: normalizeMerchantKey(draft.merchant || ''),
        category: (draft.category || '').trim(),
        merchant: draft.merchant || '',
      }))
      .filter(entry => entry.merchantKey && isUsableCategory(entry.category));

    setMerchantCategoryMap(prev => {
      const next = {...prev};
      let changed = false;
      learnedEntries.forEach(entry => {
        if (next[entry.merchantKey] === entry.category) {
          return;
        }
        next[entry.merchantKey] = entry.category;
        changed = true;
      });
      return changed ? next : prev;
    });
    void syncMerchantCategoriesToSupabase(learnedEntries);
    let insertedCount = 0;
    setTransactions(prev => {
      const existingKeys = new Set(prev.map(item => `${item.type}|${item.category}|${item.date}|${item.account}|${item.amount}|${item.note || ''}`));
      const toAdd = mapped.filter(
        item => !existingKeys.has(`${item.type}|${item.category}|${item.date}|${item.account}|${item.amount}|${item.note || ''}`),
      );
      insertedCount = toAdd.length;
      return toAdd.length ? [...toAdd, ...prev] : prev;
    });
    const hasCurrentMonthRow = mapped.some(item => item.date.startsWith(selectedMonthKey));
    if (!hasCurrentMonthRow) {
      const firstDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(mapped[0].date);
      if (firstDate) {
        setSelectedMonth(firstDayOfMonth(new Date(Number(firstDate[1]), Number(firstDate[2]) - 1, 1)));
      }
      const skipped = mapped.length - insertedCount;
      setVariableStatus(
        `${insertedCount} variable expenses added${skipped > 0 ? `, ${skipped} skipped as duplicates` : ''}. Moved to the transaction month.`,
      );
      return;
    }
    const skipped = mapped.length - insertedCount;
    setVariableStatus(
      `${insertedCount} variable expenses added${skipped > 0 ? `, ${skipped} skipped as duplicates` : ''}. You can adjust and apply again.`,
    );
  };
  const pickCapture = async (fromCamera: boolean) => {
    type PickedAsset = {fileName: string; uri?: string; type?: string};
    const result = fromCamera
      ? await launchCamera({mediaType: 'photo', saveToPhotos: false})
      : await launchImageLibrary({
          mediaType: 'photo',
          // iOS multi-select is most reliable with 0 (unlimited).
          selectionLimit: addTab === 'variable' ? 0 : 1,
        });
    if (result.didCancel) {
      return;
    }
    const pickedAssets: PickedAsset[] = (result.assets ?? []).map(file => ({
      fileName: file.fileName ?? 'capture_image',
      uri: file.uri,
      type: file.type || 'image/jpeg',
    }));
    if (!pickedAssets.length) {
      return;
    }
    const first = pickedAssets[0];
    const file = first.fileName;
    const fileUri = first.uri;
    const fileType = first.type || 'image/jpeg';
    const consented = await ensureAiConsent();
    if (!consented) {
      if (addTab === 'income') {
        setIncomeStatus('AI consent is required for remote analysis. You can still enter manually.');
      } else {
        setVariableStatus('AI consent is required for remote analysis. You can still enter manually.');
      }
      return;
    }
    if (addTab === 'income') {
      setIncomeAttachment(file);
      setIncomeStatus('Capture selected. Uploading temporary file...');
      const deviceId = await getOrCreateAiDeviceId();
      let tmpTarget: TmpUploadTarget | null = null;
      try {
        tmpTarget = await uploadToAiTmpStorage({
          uri: fileUri,
          fileName: file,
          contentType: fileType,
          deviceId,
        });
      } catch (uploadError) {
        setIncomeStatus(`Failed to upload capture temporarily: ${getReadableErrorMessage(uploadError)}.`);
        return;
      }
      setIncomeStatus('Capture uploaded temporarily. Running AI analysis...');
      try {
        const data = await invokeAiRead({
          flow: 'income',
          source: fromCamera ? 'camera' : 'attach',
          fileName: file,
          storageBucket: tmpTarget.bucket,
          storagePath: tmpTarget.path,
        });
        if (data?.meta?.mode === 'no_text_payload') {
          setIncomeStatus('No readable text was extracted from image. Check OCR provider settings and retry.');
        } else {
          applyIncomeAnalysisResult(data?.income);
        }
      } catch (error) {
        setIncomeStatus(`Capture attached. AI analysis failed: ${getReadableErrorMessage(error)}.`);
      }
      await removeAiTmpStorageObject(tmpTarget);
    } else {
      setVariableCaptureFromCamera(fromCamera);
      const targetAssets = fromCamera ? [pickedAssets[0]] : pickedAssets;
      setVariableAttachment(
        targetAssets.length === 1
          ? targetAssets[0]?.fileName || file
          : `${targetAssets.length} images selected`,
      );
      setVariableStatus(
        targetAssets.length === 1
          ? 'Capture selected. Uploading temporary file...'
          : `${targetAssets.length} images selected. Uploading and analyzing...`,
      );
      const deviceId = await getOrCreateAiDeviceId();
      const aggregatedRows: Array<{category?: string; amount?: string; date?: string; merchant?: string}> = [];
      let processed = 0;
      let failed = 0;
      for (const asset of targetAssets) {
        const assetName = asset?.fileName || `capture_image_${processed + 1}`;
        const assetUri = asset?.uri;
        const assetType = asset?.type || fileType;
        let tmpTarget: TmpUploadTarget | null = null;
        try {
          tmpTarget = await uploadToAiTmpStorage({
            uri: assetUri,
            fileName: assetName,
            contentType: assetType,
            deviceId,
          });
          const data = await invokeAiRead({
            flow: 'variable',
            source: fromCamera ? 'camera' : 'attach',
            fileName: assetName,
            storageBucket: tmpTarget.bucket,
            storagePath: tmpTarget.path,
          });
          aggregatedRows.push(...(data?.rows ?? []));
          processed += 1;
        } catch {
          failed += 1;
        } finally {
          await removeAiTmpStorageObject(tmpTarget);
        }
      }
      if (aggregatedRows.length) {
        const nextDrafts = mapVariableRowsToDrafts(aggregatedRows);
        setVariableDrafts(prev => {
          const seen = new Set(prev.map(item => `${item.date}|${item.amount}|${item.merchant.toLowerCase()}`));
          const appended = nextDrafts.filter(item => {
            const key = `${item.date}|${item.amount}|${item.merchant.toLowerCase()}`;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
          return [...prev, ...appended];
        });
        setVariableMethod('capture');
        setVariableStatus(
          `AI analysis complete (${aggregatedRows.length} rows from ${processed}/${targetAssets.length} files${failed > 0 ? `, ${failed} files failed` : ''}). Review parsed list, then apply to list.`,
        );
      } else if (processed > 0) {
        setVariableStatus('Analysis finished, but no rows were detected. Please parse/edit manually.');
      } else {
        setVariableStatus('All selected image uploads/analyses failed. Please retry.');
      }
    }
  };
  const pickCsv = async () => {
    try {
      const file = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.csv, DocumentPicker.types.plainText],
        copyTo: 'cachesDirectory',
      });
      setVariableAttachment(file.name ?? 'selected.csv');
      setVariableStatus('CSV selected. Paste/read content then parse rows.');
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        setVariableStatus('Failed to select CSV.');
      }
    }
  };
  const pickPdf = async () => {
    try {
      const allFilesType = (DocumentPicker.types as unknown as {allFiles?: string}).allFiles;
      const pdfType = DocumentPicker.types.pdf || allFilesType || 'public.item';
      const file = await DocumentPicker.pickSingle({
        type: [pdfType],
        copyTo: 'cachesDirectory',
      });
      const consented = await ensureAiConsent();
      if (!consented) {
        if (addTab === 'income') {
          setIncomeStatus('AI consent is required for remote analysis. You can still enter manually.');
        } else {
          setVariableStatus('AI consent is required for remote analysis. You can still enter manually.');
        }
        return;
      }
      const fileUri = file.fileCopyUri ?? file.uri;
      const fileName = file.name ?? 'selected.pdf';
      if (addTab === 'income') {
        setIncomeStatus('PDF selected. Uploading temporary file...');
      } else {
        setVariableStatus('PDF selected. Uploading temporary file...');
      }
      const deviceId = await getOrCreateAiDeviceId();
      let tmpTarget: TmpUploadTarget | null = null;
      try {
        tmpTarget = await uploadToAiTmpStorage({
          uri: fileUri,
          fileName,
          contentType: file.type || 'application/pdf',
          deviceId,
        });
      } catch (uploadError) {
        if (addTab === 'income') {
          setIncomeStatus(`Failed to upload PDF temporarily: ${getReadableErrorMessage(uploadError)}.`);
        } else {
          setVariableStatus(`Failed to upload PDF temporarily: ${getReadableErrorMessage(uploadError)}.`);
        }
        return;
      }

      if (addTab === 'income') {
        setIncomeAttachment(file.name ?? 'selected.pdf');
        setIncomeStatus('PDF uploaded temporarily. Running AI analysis...');
        try {
          const data = await invokeAiRead({
            flow: 'income',
            source: 'pdf',
            fileName,
            storageBucket: tmpTarget.bucket,
            storagePath: tmpTarget.path,
          });
          if (data?.meta?.mode === 'no_text_payload') {
            setIncomeStatus('PDF uploaded, but no readable text was extracted. Check OCR/parser settings in Edge Function.');
          } else {
            applyIncomeAnalysisResult(data?.income);
          }
        } catch (error) {
          setIncomeStatus(`PDF attached. AI analysis failed: ${getReadableErrorMessage(error)}.`);
        }
      } else {
        setVariableAttachment(file.name ?? 'selected.pdf');
        setVariableStatus('PDF uploaded temporarily. Running AI analysis...');
        try {
          const data = await invokeAiRead({
            flow: 'variable',
            source: 'pdf',
            fileName,
            storageBucket: tmpTarget.bucket,
            storagePath: tmpTarget.path,
          });
          const rows = data?.rows ?? [];
          if (rows.length) {
            setVariableDrafts(mapVariableRowsToDrafts(rows));
            setVariableMethod('csv');
            setVariableStatus(`AI analysis complete (${rows.length} rows). Review parsed list, then bulk register.`);
          } else if (data?.meta?.mode === 'no_text_payload') {
            setVariableStatus('PDF uploaded, but no readable text was extracted. Check OCR/parser settings in Edge Function.');
          } else {
            setVariableStatus('AI response received. No rows detected, please parse manually.');
          }
        } catch (error) {
          setVariableStatus(`PDF attached. AI analysis failed: ${getReadableErrorMessage(error)}.`);
        }
      }
      await removeAiTmpStorageObject(tmpTarget);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        if (addTab === 'income') {
          setIncomeStatus('PDF selection canceled.');
        } else {
          setVariableStatus('PDF selection canceled.');
        }
        return;
      }
      if (addTab === 'income') {
        setIncomeStatus(`Failed to select PDF: ${getReadableErrorMessage(error)}.`);
      } else {
        setVariableStatus(`Failed to select PDF: ${getReadableErrorMessage(error)}.`);
      }
    }
  };
  const addAsset = (id?: string) => {
    if (!assetInstitution) {
      setAssetStatus('Asset requires institution.');
      return false;
    }
    const isDebtType = debtAssetTypes.includes(assetType) || assetType === 'card';
    const isInvestmentLike = investmentAssetTypes.includes(assetType);
    const computedDisplayName =
      assetDisplayName.trim() ||
      assetInstitution.trim() ||
      formatAssetTypeLabel(assetType);
    const normalizedBalance =
      assetType === 'card' || debtAssetTypes.includes(assetType) || isInvestmentLike
        ? assetAmount
        : assetBalance;
    const normalizedLimit = isDebtType ? assetLimit : undefined;
    const monthlyPayment = debtAssetTypes.includes(assetType) ? assetBalance : undefined;
    const dueMonthDay =
      assetType === 'card' || investmentAssetTypes.includes(assetType) || debtAssetTypes.includes(assetType)
        ? monthDayFromYmd(assetDueDate)
        : undefined;
    const maturityDate = debtAssetTypes.includes(assetType) ? assetRate || undefined : undefined;
    if (id) {
      setAssets(prev =>
        prev.map(item =>
          item.id === id
            ? {
                ...item,
                type: assetType,
                institution: assetInstitution,
                displayName: computedDisplayName,
                subtype: assetSubAccount || undefined,
                balance: normalizedBalance,
                limit: normalizedLimit,
                monthlyPayment,
                dueMonthDay,
                maturityDate,
              }
            : item,
        ),
      );
      return true;
    }
    const nextId = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setAssets(prev => [
      {
        id: nextId,
        type: assetType,
        institution: assetInstitution,
        displayName: computedDisplayName,
        subtype: assetSubAccount || undefined,
        balance: normalizedBalance,
        limit: normalizedLimit,
        monthlyPayment,
        dueMonthDay,
        maturityDate,
      },
      ...prev,
    ]);
    return true;
  };
  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(item => item.id !== id));
  };
  const copyPreviousMonthAssets = () => {
    const previousAssets = assetsByMonth[previousMonthKey] ?? [];
    if (!previousAssets.length) {
      setAssetStatus('No previous month asset data to copy.');
      return false;
    }
    const now = Date.now();
    const cloned = previousAssets.map((item, index) => ({
      ...item,
      id: `asset-${now}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setAssets(cloned);
    setAssetStatus(`Copied ${cloned.length} assets from previous month.`);
    return true;
  };
  const checkSupabaseConnection = async () => {
    if (!isSupabaseConfigured) {
      setSupabaseStatus('Missing URL or key');
      return;
    }
    try {
      const {error} = await supabase.from('public_benchmark_monthly').select('id').limit(1);
      setSupabaseStatus(error ? `Connected, query error: ${error.message}` : 'Connected');
    } catch {
      setSupabaseStatus('Network error');
    }
  };
  const resetStatuses = () => {
    setIncomeStatus('');
    setFixedStatus('');
    setVariableStatus('');
    setAssetStatus('');
  };
  const upsertInstitution = (type: InstitutionType, name: string, id?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setInstitutions(prev => {
      const exists = prev.some(
        inst =>
          inst.id !== id &&
          inst.type === type &&
          inst.name.toLowerCase() === trimmed.toLowerCase() &&
          inst.isActive !== false,
      );
      if (exists) {
        return prev;
      }
      if (id) {
        return prev.map(inst =>
          inst.id === id
            ? {
                ...inst,
                type,
                name: trimmed,
                isCustom: true,
                isActive: true,
              }
            : inst,
        );
      }
      return [
        ...prev,
        {
          id: `custom-${type}-${Date.now()}`,
          type,
          name: trimmed,
          isCustom: true,
          isActive: true,
        },
      ];
    });
  };
  const deleteInstitution = (id: string) => {
    setInstitutions(prev => prev.map(inst => (inst.id === id ? {...inst, isActive: false} : inst)));
  };
  const upsertMerchantCategory = (merchantInput: string, categoryInput: string) => {
    const merchantKey = normalizeMerchantKey(merchantInput);
    const category = categoryInput.trim();
    if (!merchantKey) {
      return {ok: false, message: 'Enter a merchant name first.'};
    }
    if (!isUsableCategory(category)) {
      return {ok: false, message: 'Choose a valid category (not Other).'};
    }
    setMerchantCategoryMap(prev => {
      if (prev[merchantKey] === category) {
        return prev;
      }
      return {...prev, [merchantKey]: category};
    });
    void syncMerchantCategoriesToSupabase([{merchantKey, category, merchant: merchantInput.trim() || merchantKey}]);
    return {ok: true, message: `Saved: ${merchantKey} -> ${category}`};
  };
  const deleteMerchantCategory = (merchantInput: string) => {
    const merchantKey = normalizeMerchantKey(merchantInput);
    if (!merchantKey) {
      return;
    }
    setMerchantCategoryMap(prev => {
      if (!Object.prototype.hasOwnProperty.call(prev, merchantKey)) {
        return prev;
      }
      const next = {...prev};
      delete next[merchantKey];
      return next;
    });
  };
  const addCustomVariableCategory = (categoryInput: string) => {
    const category = categoryInput.trim();
    if (!category) {
      return {ok: false, message: 'Enter a category name first.'};
    }
    const exists = [...VARIABLE_CATEGORIES, ...customVariableCategories].some(
      item => item.trim().toLowerCase() === category.toLowerCase(),
    );
    if (exists) {
      return {ok: false, message: `Category already exists: ${category}`};
    }
    setCustomVariableCategories(prev => [...prev, category]);
    void syncVariableCategoriesToSupabase([category]);
    return {ok: true, message: `Category added: ${category}`};
  };
  const deleteCustomVariableCategory = (categoryInput: string) => {
    const category = categoryInput.trim().toLowerCase();
    if (!category) {
      return;
    }
    setCustomVariableCategories(prev => prev.filter(item => item.trim().toLowerCase() !== category));
  };
  const addBudgetItem = (section: 'cash' | 'variable' | 'fixed', category: string, amount: number, memo?: string) => {
    const normalized = category.trim().toLowerCase();
    const variableMap: Record<string, keyof EditableBudget> = {
      food: 'food',
      'gas / transport': 'gas',
      gas: 'gas',
      'fun / entertainment': 'fun',
      fun: 'fun',
      shopping: 'shopping',
      healthcare: 'healthcare',
    };
    const fixedMap: Record<string, keyof EditableBudget> = {
      'rent / mortgage': 'rentMortgage',
      rent: 'rentMortgage',
      mortgage: 'rentMortgage',
      utilities: 'utilities',
      insurance: 'insurance',
      subscriptions: 'subscriptions',
      'loan payments': 'loanPayments',
    };

    if (section === 'cash') {
      setBudgetPlan(prev => {
        const current = Number(prev.cashOnHand) || 0;
        return {...prev, cashOnHand: String(current + amount)};
      });
      if (!['cash on hand', 'cash', 'wallet cash', 'petty cash', 'change'].includes(normalized)) {
        setBudgetCustomItems(prev => {
          const idx = prev.findIndex(item => item.section === 'cash' && item.category.toLowerCase() === normalized);
          if (idx === -1) {
            return [...prev, {id: `budget-cash-${Date.now()}`, section: 'cash', category, amount}];
          }
          return prev.map((item, i) => (i === idx ? {...item, amount: item.amount + amount} : item));
        });
      }
      return;
    }

    if (section === 'variable' && variableMap[normalized]) {
      const key = variableMap[normalized];
      setBudgetPlan(prev => {
        const current = Number(prev[key]) || 0;
        return {...prev, [key]: String(current + amount)};
      });
      setBudgetCustomItems(prev => {
        const idx = prev.findIndex(item => item.section === section && item.category.toLowerCase() === normalized);
        if (idx === -1) {
          return [...prev, {id: `budget-${section}-${Date.now()}`, section, category, amount, memo}];
        }
        return prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                amount: item.amount + amount,
                memo: memo ?? item.memo,
              }
            : item,
        );
      });
      return;
    }

    if (section === 'fixed' && fixedMap[normalized]) {
      const key = fixedMap[normalized];
      setBudgetPlan(prev => {
        const current = Number(prev[key]) || 0;
        return {...prev, [key]: String(current + amount)};
      });
      setBudgetCustomItems(prev => {
        const idx = prev.findIndex(item => item.section === section && item.category.toLowerCase() === normalized);
        if (idx === -1) {
          return [...prev, {id: `budget-${section}-${Date.now()}`, section, category, amount, memo}];
        }
        return prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                amount: item.amount + amount,
                memo: memo ?? item.memo,
              }
            : item,
        );
      });
      return;
    }

    setBudgetCustomItems(prev => {
      const idx = prev.findIndex(item => item.section === section && item.category.toLowerCase() === normalized);
      if (idx === -1) {
        return [...prev, {id: `budget-${section}-${Date.now()}`, section, category, amount, memo}];
      }
      return prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              amount: item.amount + amount,
              memo: memo ?? item.memo,
            }
          : item,
      );
    });
  };
  const updateVariableBudgetItem = (
    target: {id: string; type: 'builtin'; key: 'food' | 'gas' | 'fun' | 'shopping' | 'healthcare'} | {id: string; type: 'custom'},
    category: string,
    amount: number,
    memo?: string,
  ) => {
    if (target.type === 'builtin') {
      setBudgetPlan(prev => ({...prev, [target.key]: String(amount)}));
      const categoryByKey: Record<'food' | 'gas' | 'fun' | 'shopping' | 'healthcare', string> = {
        food: 'Food',
        gas: 'Gas / Transport',
        fun: 'Fun / Entertainment',
        shopping: 'Shopping',
        healthcare: 'Healthcare',
      };
      const builtinCategory = categoryByKey[target.key];
      const normalized = builtinCategory.toLowerCase();
      setBudgetCustomItems(prev => {
        const idx = prev.findIndex(item => item.section === 'variable' && item.category.toLowerCase() === normalized);
        if (idx === -1) {
          if (!memo) {
            return prev;
          }
          return [...prev, {id: `budget-variable-${Date.now()}`, section: 'variable', category: builtinCategory, amount, memo}];
        }
        return prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                amount,
                memo: memo ?? item.memo,
              }
            : item,
        );
      });
      return;
    }
    setBudgetCustomItems(prev => {
      const idx = prev.findIndex(item => item.section === 'variable' && item.id === target.id);
      if (idx === -1) {
        return prev;
      }
      return prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              category: category || item.category,
              amount,
              memo: memo ?? item.memo,
            }
          : item,
      );
    });
  };
  const resetVariableBudgetField = (key: 'food' | 'gas' | 'fun' | 'shopping' | 'healthcare') => {
    setBudgetPlan(prev => ({...prev, [key]: ''}));
  };
  const deleteVariableCustomBudgetItem = (id: string) => {
    setBudgetCustomItems(prev => prev.filter(item => !(item.section === 'variable' && item.id === id)));
  };
  const exportBackupJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        assets,
        transactions,
        fixedTemplates,
        institutions,
        budgetPlan,
        budgetCustomItems,
      },
    };
    return JSON.stringify(payload, null, 2);
  };
  const restoreBackupJson = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return 'Paste backup JSON first.';
    }
    try {
      const parsed = JSON.parse(trimmed) as {
        data?: {
          assets?: Array<Asset & {dueDate?: string}>;
          transactions?: Transaction[];
          fixedTemplates?: FixedExpenseTemplate[];
          institutions?: Institution[];
          budgetPlan?: Partial<EditableBudget>;
          budgetCustomItems?: BudgetCustomItem[];
        };
        assets?: Array<Asset & {dueDate?: string}>;
        transactions?: Transaction[];
        fixedTemplates?: FixedExpenseTemplate[];
        institutions?: Institution[];
        budgetPlan?: Partial<EditableBudget>;
        budgetCustomItems?: BudgetCustomItem[];
      };
      const snapshot = parsed.data ?? parsed;
      if (
        !snapshot ||
        !Array.isArray(snapshot.assets) ||
        !Array.isArray(snapshot.transactions) ||
        (snapshot.fixedTemplates !== undefined && !Array.isArray(snapshot.fixedTemplates)) ||
        !Array.isArray(snapshot.institutions) ||
        !snapshot.budgetPlan ||
        !Array.isArray(snapshot.budgetCustomItems)
      ) {
        return 'Invalid backup format.';
      }
      setAssets(
        snapshot.assets.map(item => ({
          ...item,
          dueMonthDay: item.dueMonthDay ?? monthDayFromYmd(item.dueDate),
        })),
      );
      setTransactions(snapshot.transactions);
      setFixedTemplates(snapshot.fixedTemplates ?? []);
      setInstitutions(mergeInstitutionSeeds(snapshot.institutions));
      setBudgetPlan(prev => ({...prev, ...snapshot.budgetPlan}));
      setBudgetCustomItems(snapshot.budgetCustomItems);
      return 'Backup restored successfully.';
    } catch {
      return 'Invalid JSON format.';
    }
  };
  const buildWorkbookXml = () => {
    const safeNumber = (value: unknown) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      const normalized = String(value ?? '').replace(/,/g, '').trim();
      if (!normalized) {
        return 0;
      }
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const escapeXml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const row = (cells: Array<string | number>) =>
      `<Row>${cells
        .map(cell => {
          const isNumber = typeof cell === 'number';
          const normalizedNumber = isNumber ? safeNumber(cell) : 0;
          const type = isNumber ? 'Number' : 'String';
          const payload = isNumber ? String(normalizedNumber) : String(cell);
          return `<Cell><Data ss:Type="${type}">${escapeXml(payload)}</Data></Cell>`;
        })
        .join('')}</Row>`;
    const worksheet = (name: string, rows: Array<Array<string | number>>) =>
      `<Worksheet ss:Name="${escapeXml(name)}"><Table>${rows.map(r => row(r)).join('')}</Table></Worksheet>`;

    const summaryRows: Array<Array<string | number>> = [
      ['Metric', 'Value'],
      ['Selected Month', selectedMonthKey],
      ['Previous Month', previousMonthKey],
      ['Language', appLanguage],
      ['Currency', appCurrency],
      ['Total Income', totalIncome],
      ['Total Fixed', totalFixed],
      ['Total Variable', totalVariable],
      ['Current Net', net],
      ['Total Assets', totalAssets],
      ['Asset Net (Summary)', assetSummary.net],
      ['Asset Cash', assetSummary.cash],
      ['Asset Investment', assetSummary.investment],
      ['Asset Home/Auto', assetSummary.home],
      ['Asset Debt', assetSummary.debt],
      ['Savings Rate (%)', totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0],
      ['Expense Ratio (%)', totalIncome > 0 ? Math.round(((totalFixed + totalVariable) / totalIncome) * 100) : 0],
    ];

    const txRowsAll: Array<Array<string | number>> = [
      ['Id', 'Type', 'Category', 'Amount', 'Date', 'Account', 'Note'],
      ...transactions.map(tx => [tx.id, tx.type, tx.category, tx.amount, tx.date, tx.account, tx.note ?? '']),
    ];
    const txRowsCurrentMonth: Array<Array<string | number>> = [
      ['Id', 'Type', 'Category', 'Amount', 'Date', 'Account', 'Note'],
      ...monthlyTransactions.map(tx => [tx.id, tx.type, tx.category, tx.amount, tx.date, tx.account, tx.note ?? '']),
    ];
    const txRowsPreviousMonth: Array<Array<string | number>> = [
      ['Id', 'Type', 'Category', 'Amount', 'Date', 'Account', 'Note'],
      ...previousMonthlyTransactions.map(tx => [tx.id, tx.type, tx.category, tx.amount, tx.date, tx.account, tx.note ?? '']),
    ];

    const assetRowsCurrent: Array<Array<string | number>> = [
      ['Id', 'Type', 'Institution', 'Display Name', 'Subtype', 'Balance', 'Limit', 'Monthly Payment', 'Due (MM-DD)', 'Maturity Date'],
      ...assets.map(a => [
        a.id,
        a.type,
        a.institution,
        a.displayName,
        a.subtype ?? '',
        safeNumber(a.balance || 0),
        safeNumber(a.limit || 0),
        safeNumber(a.monthlyPayment || 0),
        a.dueMonthDay ?? '',
        a.maturityDate ?? '',
      ]),
    ];
    const assetRowsByMonth: Array<Array<string | number>> = [
      ['Month', 'Id', 'Type', 'Institution', 'Display Name', 'Subtype', 'Balance', 'Limit', 'Monthly Payment', 'Due (MM-DD)', 'Maturity Date'],
      ...Object.entries(assetsByMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .flatMap(([month, monthAssets]) =>
          monthAssets.map(a => [
            month,
            a.id,
            a.type,
            a.institution,
            a.displayName,
            a.subtype ?? '',
            safeNumber(a.balance || 0),
            safeNumber(a.limit || 0),
            safeNumber(a.monthlyPayment || 0),
            a.dueMonthDay ?? '',
            a.maturityDate ?? '',
          ]),
        ),
    ];

    const institutionsRows: Array<Array<string | number>> = [
      ['Id', 'Type', 'Name', 'Is Custom', 'Is Active'],
      ...institutions.map(inst => [
        inst.id,
        inst.type,
        inst.name,
        inst.isCustom ? 'true' : 'false',
        inst.isActive === false ? 'false' : 'true',
      ]),
    ];

    const fixedTemplateRows: Array<Array<string | number>> = [
      ['Id', 'Category', 'Amount', 'Payment Day', 'Account', 'Memo'],
      ...fixedTemplates.map(item => [
        item.id,
        item.category,
        safeNumber(item.amount || 0),
        item.paymentDay,
        item.account,
        item.memo ?? '',
      ]),
    ];

    const budgetPlanRows: Array<Array<string | number>> = [
      ['Field', 'Amount'],
      ['cashOnHand', safeNumber(budgetPlan.cashOnHand || 0)],
      ['food', safeNumber(budgetPlan.food || 0)],
      ['gas', safeNumber(budgetPlan.gas || 0)],
      ['fun', safeNumber(budgetPlan.fun || 0)],
      ['shopping', safeNumber(budgetPlan.shopping || 0)],
      ['healthcare', safeNumber(budgetPlan.healthcare || 0)],
      ['rentMortgage', safeNumber(budgetPlan.rentMortgage || 0)],
      ['utilities', safeNumber(budgetPlan.utilities || 0)],
      ['insurance', safeNumber(budgetPlan.insurance || 0)],
      ['subscriptions', safeNumber(budgetPlan.subscriptions || 0)],
      ['loanPayments', safeNumber(budgetPlan.loanPayments || 0)],
    ];
    const budgetCustomRows: Array<Array<string | number>> = [
      ['Id', 'Section', 'Category', 'Amount', 'Memo'],
      ...budgetCustomItems.map(item => [item.id, item.section, item.category, item.amount, item.memo ?? '']),
    ];

    const categoryRows: Array<Array<string | number>> = [
      ['Kind', 'Key / Category', 'Mapped Category'],
      ...customVariableCategories.map(category => ['Custom Variable Category', category, '']),
      ...Object.entries(merchantCategoryMap).map(([merchantKey, category]) => ['Merchant Category Map', merchantKey, category]),
    ];

    const incomeComparisonRows: Array<Array<string | number>> = [
      ['Metric', 'Previous Month', 'This Month', 'Difference'],
      ['Net Income', previousPayrollSummary.net, payrollSummary.net, payrollSummary.net - previousPayrollSummary.net],
      ['Gross', previousPayrollSummary.gross, payrollSummary.gross, payrollSummary.gross - previousPayrollSummary.gross],
      ['Tax', previousPayrollSummary.taxes, payrollSummary.taxes, payrollSummary.taxes - previousPayrollSummary.taxes],
      [
        'Deduction',
        previousPayrollSummary.deductions,
        payrollSummary.deductions,
        payrollSummary.deductions - previousPayrollSummary.deductions,
      ],
    ];

    const expenseComparisonRows: Array<Array<string | number>> = [
      ['Category', 'Previous Month', 'This Month', 'Difference'],
      ...expenseComparisonByCategory.map(item => [item.category, item.previousAmount, item.currentAmount, item.difference]),
    ];

    const upcomingRows: Array<Array<string | number>> = [
      ['Index', 'Upcoming Item'],
      ...upcomingItems.map((item, idx) => [idx + 1, item]),
    ];

    const insightsRows: Array<Array<string | number>> = [
      ['Field', 'Value'],
      ['Country', insightCountry],
      ['State', insightState],
      ['Household Size', householdSize],
      ['Avg Benchmark', avgByHousehold],
      ['AI Monthly Spend', aiMonthlySpend],
      ['AI Diff', aiDiff],
      ['Insight Status', insightStatus.level],
      ['Insight Message', insightStatus.message],
      ['Recommendation', aiRecommendation],
    ];

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${worksheet('Summary', summaryRows)}
${worksheet('Transactions_All', txRowsAll)}
${worksheet('Transactions_Current', txRowsCurrentMonth)}
${worksheet('Transactions_Previous', txRowsPreviousMonth)}
${worksheet('Assets_Current', assetRowsCurrent)}
${worksheet('Assets_By_Month', assetRowsByMonth)}
${worksheet('Institutions', institutionsRows)}
${worksheet('Fixed_Templates', fixedTemplateRows)}
${worksheet('Budget_Plan', budgetPlanRows)}
${worksheet('Budget_Custom', budgetCustomRows)}
${worksheet('Categories', categoryRows)}
${worksheet('Income_Comparison', incomeComparisonRows)}
${worksheet('Expense_Comparison', expenseComparisonRows)}
${worksheet('Upcoming', upcomingRows)}
${worksheet('Insights', insightsRows)}
</Workbook>`;
  };
  const handleTabPress = (tab: Tab) => {
    if (tab === 'more') {
      setMoreVisible(true);
      return;
    }
    setMoreVisible(false);
    setActiveTab(tab);
  };
  const handleMoreSectionSelect = (
    section: 'settings' | 'backup' | 'excel' | 'budget' | 'institution' | 'category' | 'subscription',
  ) => {
    setMoreSection(section);
    setActiveTab('more');
  };
  const isManagementScreen = activeTab === 'more' && moreSection === 'budget';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StartupSplashGate>
          <StatusBar barStyle="dark-content" />
          <Header />
        {activeTab === 'add' ? (
          <View style={styles.addScreenHost}>
            <AddScreen
              addTab={addTab}
              setAddTab={setAddTab}
              recordMode={recordMode}
              setRecordMode={setRecordMode}
              selectedMonth={selectedMonth}
              showMonthPicker={showMonthPicker}
              setShowMonthPicker={setShowMonthPicker}
              setSelectedMonth={setSelectedMonth}
              firstDayOfMonth={firstDayOfMonth}
              moveMonth={moveMonth}
              assets={assets}
              filteredRecords={filteredRecords}
              resetStatuses={resetStatuses}
              incomeStatus={incomeStatus}
              setIncomeStatus={setIncomeStatus}
              fixedStatus={fixedStatus}
              variableStatus={variableStatus}
              assetStatus={assetStatus}
              incomeType={incomeType}
              setIncomeType={setIncomeType}
              incomeTypeCustom={incomeTypeCustom}
              setIncomeTypeCustom={setIncomeTypeCustom}
              incomeAccount={incomeAccount}
              setIncomeAccount={setIncomeAccount}
              incomeMethod={incomeMethod}
              setIncomeMethod={setIncomeMethod}
              incomeAttachment={incomeAttachment}
              setIncomeAttachment={setIncomeAttachment}
              incomeDate={incomeDate}
              setIncomeDate={setIncomeDate}
              incomeGross={incomeGross}
              setIncomeGross={setIncomeGross}
              incomeNet={incomeNet}
              setIncomeNet={setIncomeNet}
              incomeTax={incomeTax}
              setIncomeTax={setIncomeTax}
              incomeDeduction={incomeDeduction}
              setIncomeDeduction={setIncomeDeduction}
              incomeDeductionItems={incomeDeductionItems}
              setIncomeDeductionItems={setIncomeDeductionItems}
              addIncome={addIncome}
              fixedCategory={fixedCategory}
              setFixedCategory={setFixedCategory}
              fixedAmount={fixedAmount}
              setFixedAmount={setFixedAmount}
              fixedDate={fixedDate}
              setFixedDate={setFixedDate}
              fixedAccount={fixedAccount}
              setFixedAccount={setFixedAccount}
              fixedMemo={fixedMemo}
              setFixedMemo={setFixedMemo}
              addFixed={addFixed}
              importFixedTemplatesToCurrentMonth={importFixedTemplatesToCurrentMonth}
              editingTransactionId={editingTransactionId}
              setEditingTransactionId={setEditingTransactionId}
              deleteTransaction={deleteTransaction}
              variableMethod={variableMethod}
              setVariableMethod={setVariableMethod}
              variableCaptureFromCamera={variableCaptureFromCamera}
              setVariableCaptureFromCamera={setVariableCaptureFromCamera}
              variableSpendMethod={variableSpendMethod}
              setVariableSpendMethod={setVariableSpendMethod}
              variableInstitutionOptions={variableInstitutionOptions}
              variableProvider={variableProvider}
              setVariableProvider={setVariableProvider}
              variableCategory={variableCategory}
              setVariableCategory={setVariableCategory}
              variableCategories={variableCategories}
              variableDate={variableDate}
              setVariableDate={setVariableDate}
              variableAmount={variableAmount}
              setVariableAmount={setVariableAmount}
              variableMerchant={variableMerchant}
              setVariableMerchant={setVariableMerchant}
              variableMemo={variableMemo}
              setVariableMemo={setVariableMemo}
              addVariableManual={addVariableManual}
              captureInput={captureInput}
              setCaptureInput={setCaptureInput}
              csvInput={csvInput}
              setCsvInput={setCsvInput}
              variableDrafts={variableDrafts}
              setVariableDrafts={setVariableDrafts}
              bulkRegisterVariable={bulkRegisterVariable}
              parseCaptureRows={parseCaptureRows}
              parseCsvRows={parseCsvRows}
              variableAttachment={variableAttachment}
              setVariableAttachment={setVariableAttachment}
              assetType={assetType}
              setAssetType={setAssetType}
              assetInstitutionOptions={assetInstitutionOptions}
              assetInstitution={assetInstitution}
              setAssetInstitution={setAssetInstitution}
              assetSubAccount={assetSubAccount}
              setAssetSubAccount={setAssetSubAccount}
              assetDisplayName={assetDisplayName}
              setAssetDisplayName={setAssetDisplayName}
              assetBalance={assetBalance}
              setAssetBalance={setAssetBalance}
              assetLimit={assetLimit}
              setAssetLimit={setAssetLimit}
              assetDueDate={assetDueDate}
              setAssetDueDate={setAssetDueDate}
              assetMaturityDate={assetRate}
              setAssetMaturityDate={setAssetRate}
              assetAmount={assetAmount}
              setAssetAmount={setAssetAmount}
              assetRate={assetRate}
              setAssetRate={setAssetRate}
              addAsset={addAsset}
              deleteAsset={deleteAsset}
              copyPreviousMonthAssets={copyPreviousMonthAssets}
              pickCapture={pickCapture}
              pickPdf={pickPdf}
              pickCsv={pickCsv}
            />
          </View>
        ) : isManagementScreen ? (
          <View style={styles.managementHost}>
            <BudgetManagementScreen
              currencySymbol={currencySymbol}
              budget={budgetPlan}
              customItems={budgetCustomItems}
              onAddBudgetItem={addBudgetItem}
              onUpdateVariableBudgetItem={updateVariableBudgetItem}
              onResetVariableBudgetField={resetVariableBudgetField}
              onDeleteVariableCustomItem={deleteVariableCustomBudgetItem}
              fixedTemplates={fixedTemplates}
              onUpsertFixedTemplate={upsertFixedTemplate}
              onDeleteFixedTemplate={deleteFixedTemplate}
            />
          </View>
        ) : activeTab === 'dashboard' ? (
          <View style={styles.dashboardHost}>
            <HomeScreen
              language={appLanguage}
              currencySymbol={currencySymbol}
              selectedMonth={selectedMonth}
              showMonthPicker={showMonthPicker}
              setShowMonthPicker={setShowMonthPicker}
              setSelectedMonth={setSelectedMonth}
              moveMonth={moveMonth}
              firstDayOfMonth={firstDayOfMonth}
              totalAssets={totalAssets}
              assetSummary={assetSummary}
              totalIncome={totalIncome}
              totalFixed={totalFixed}
              totalVariable={totalVariable}
              net={net}
              dayCells={dayCells}
              dailySummary={dailySummary}
              paymentDueByDay={paymentDueByDay}
              selectedMonthKey={selectedMonthKey}
              openDayDetails={openDayDetails}
              upcomingItems={upcomingItems}
              spikeAlerts={spikeAlerts}
              onPressIncomeOverview={openIncomeOverviewDetails}
              onPressExpenseOverview={openExpenseOverviewDetails}
            />
          </View>
        ) : activeTab === 'more' && (moreSection === 'institution' || moreSection === 'category') ? (
          <View style={styles.managementHost}>
            {moreSection === 'institution' ? (
              <InstitutionManagementScreen
                institutions={institutions}
                onUpsertInstitution={upsertInstitution}
                onDeleteInstitution={deleteInstitution}
              />
            ) : (
              <CategoryManagementScreen
                merchantCategoryMap={merchantCategoryMap}
                onUpsertMerchantCategory={upsertMerchantCategory}
                onDeleteMerchantCategory={deleteMerchantCategory}
                categoryOptions={variableCategories}
                seedCategories={VARIABLE_CATEGORIES}
                customCategories={customVariableCategories}
                onAddCustomCategory={addCustomVariableCategory}
                onDeleteCustomCategory={deleteCustomVariableCategory}
              />
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'insights' && (
              <InsightsScreen
                currencySymbol={currencySymbol}
                aiMonthlySpend={aiMonthlySpend}
                totalIncome={totalIncome}
                aiDiff={aiDiff}
                insightCountry={insightCountry}
                setInsightCountry={setInsightCountry}
                insightState={insightState}
                setInsightState={setInsightState}
                householdSize={householdSize}
                setHouseholdSize={setHouseholdSize}
                totalFixed={totalFixed}
                totalVariable={totalVariable}
                avgByHousehold={avgByHousehold}
                aiRecommendation={aiRecommendation}
                insightStatus={insightStatus}
                categoryTrend={categoryTrend}
                budgetAlerts={budgetAlerts}
              />
            )}
            {activeTab === 'more' && moreSection === 'settings' && (
              <SettingsScreen
                appLanguage={appLanguage}
                appCurrency={appCurrency}
                onSelectLanguage={setAppLanguage}
                onSelectCurrency={setAppCurrency}
              />
            )}
            {activeTab === 'more' && moreSection === 'backup' && (
              <DataBackupScreen
                status=""
                onExportBackup={exportBackupJson}
                onRestoreBackup={restoreBackupJson}
              />
            )}
            {activeTab === 'more' && moreSection === 'excel' && <ExcelExportScreen onBuildWorkbookXml={buildWorkbookXml} />}
            {activeTab === 'more' && moreSection === 'subscription' && <SubscriptionScreen />}
          </ScrollView>
        )}

        <Modal visible={showDayModal} transparent animationType="fade" onRequestClose={() => setShowDayModal(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowDayModal(false)} />
            <View style={styles.modalCard}>
              <View
                style={[
                  styles.floatingFormHeader,
                  styles.addPanelHeaderTight,
                  styles.addPanelHeaderPrimary,
                  {marginTop: -14, marginHorizontal: -14, borderTopLeftRadius: 16, borderTopRightRadius: 16},
                ]}>
                <View style={styles.floatingFormHeaderSpacer} />
                <Text style={[styles.cardTitle, styles.floatingFormHeaderTitle, {color: '#FFFCEB'}]}>
                  {selectedMonthKey}-{`${selectedDay ?? ''}`.padStart(2, '0')} Details
                </Text>
                <Pressable
                  style={[styles.floatingFormCloseButton, {borderWidth: 0, backgroundColor: 'transparent'}]}
                  onPress={() => setShowDayModal(false)}>
                  <SimpleLineIcons name="close" color="#FFFCEB" size={24} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.cardTitleMuted}>Daily Summary</Text>
                <View style={styles.cardInner}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.cardHint}>Income</Text>
                    <Text style={[styles.summaryValue, styles.incomeText]}>
                      +{currencySymbol}
                      {dailyIncomingTotal.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.cardHint}>Expense</Text>
                    <Text style={[styles.summaryValue, styles.warnText]}>
                      -{currencySymbol}
                      {dailyOutgoingTotal.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.cardHint}>Card/Loan Due</Text>
                    <Text style={[styles.cardHint, {textAlign: 'right', marginTop: 0}]}>
                      {selectedDayDebtDueItems.length ? `${selectedDayDebtDueItems.length} scheduled` : 'No card/loan due'}
                    </Text>
                  </View>
                  {selectedDayDebtDueItems.length
                    ? selectedDayDebtDueItems.slice(0, 3).map((item, idx) => (
                        <Text key={`due-item-${idx}`} numberOfLines={1} style={[styles.cardHint, {marginTop: 2}]}>
                          • {item}
                        </Text>
                      ))
                    : null}
                  {selectedDayDebtDueItems.length > 3 ? (
                    <Text style={[styles.cardHint, {marginTop: 2}]}>+{selectedDayDebtDueItems.length - 3} more</Text>
                  ) : null}
                </View>
                <Text style={styles.cardTitleMuted}>Income</Text>
                {incomingTransactions.length ? (
                  incomingTransactions.map(tx => (
                    <View key={tx.id} style={styles.recordRow}>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryValue, {color: '#1558D1'}]}>
                          +{currencySymbol}
                          {tx.amount.toLocaleString()}
                        </Text>
                        <Text numberOfLines={1} style={[styles.cardHint, {fontSize: 12, textAlign: 'right', flex: 1, marginTop: 0}]}>
                          {tx.category} / {tx.account}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.cardHint}>No income records.</Text>
                )}
                <Text style={styles.cardTitleMuted}>Expense</Text>
                {outgoingTransactions.length ? (
                  outgoingTransactions.map(tx => (
                    <View key={tx.id} style={styles.recordRow}>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryValue, styles.warnText]}>
                          -{currencySymbol}
                          {tx.amount.toLocaleString()}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.cardHint,
                            {fontSize: 12, textAlign: 'right', width: '66%', marginTop: 0, flexShrink: 1},
                          ]}>
                          {tx.type === 'fixed_cost'
                            ? `${tx.category} / ${tx.account}${tx.note ? ` / ${tx.note}` : ''}`
                            : `${tx.account}${tx.note ? ` / ${tx.note}` : ''}`}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.cardHint}>No expense records.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <Modal visible={Boolean(overviewModalType)} transparent animationType="fade" onRequestClose={closeOverviewDetails}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={closeOverviewDetails} />
            <View style={styles.modalCard}>
              <View
                style={[
                  styles.floatingFormHeader,
                  styles.addPanelHeaderTight,
                  styles.addPanelHeaderPrimary,
                  {marginTop: -14, marginHorizontal: -14, borderTopLeftRadius: 16, borderTopRightRadius: 16},
                ]}>
                <View style={styles.floatingFormHeaderSpacer} />
                <Text style={[styles.cardTitle, styles.floatingFormHeaderTitle, {color: '#FFFCEB'}]}>
                  {overviewModalType === 'income' ? 'Income Details' : 'Expense Details'}
                </Text>
                <Pressable
                  style={[styles.floatingFormCloseButton, {borderWidth: 0, backgroundColor: 'transparent'}]}
                  onPress={closeOverviewDetails}>
                  <SimpleLineIcons name="close" color="#FFFCEB" size={24} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {overviewModalType === 'income' ? (
                  <>
                    <View style={styles.cardInner}>
                      <Text style={[styles.cardHint, styles.centerText, {marginTop: 0, fontSize: 12}]}>Total</Text>
                      <Text style={[styles.cardValue, styles.centerText, styles.incomeText]}>
                        +{currencySymbol}
                        {totalIncome.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.cardTitleMuted}>Income Details</Text>
                    <View style={styles.cardInner}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Gross Total</Text>
                        <Text style={[styles.summaryValue, styles.incomeText]}>+{currencySymbol}{payrollSummary.gross.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Tax Total</Text>
                        <Text style={[styles.summaryValue, styles.warnText]}>-{currencySymbol}{payrollSummary.taxes.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Deduction Total</Text>
                        <Text style={[styles.summaryValue, styles.warnText]}>-{currencySymbol}{payrollSummary.deductions.toLocaleString()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cardTitleMuted, {marginTop: 10}]}>Deduction Details</Text>
                    <View style={styles.cardInner}>
                      {deductionByItem.length ? (
                        deductionByItem.map(item => (
                          <View key={`deduction-item-${item.label}`} style={styles.summaryRow}>
                            <Text style={styles.cardHint}>{item.label}</Text>
                            <Text style={[styles.summaryValue, styles.warnText]}>-{currencySymbol}{item.amount.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.cardHint}>No deduction detail records.</Text>
                      )}
                    </View>
                    <Text style={[styles.cardTitleMuted, {marginTop: 10}]}>Month Comparison</Text>
                    <View style={styles.cardInner}>
                      <View style={styles.compareTableHeaderRow}>
                        <View style={[styles.compareTableCell, styles.compareTableHeaderCategoryCell]}>
                          <Text style={styles.compareTableHeaderText}>Metric</Text>
                        </View>
                        <View style={styles.compareTableCell}>
                          <Text style={styles.compareTableHeaderText}>Previous</Text>
                        </View>
                        <View style={styles.compareTableCell}>
                          <Text style={styles.compareTableHeaderText}>This Month</Text>
                        </View>
                        <View style={[styles.compareTableCell, styles.compareTableCellLast]}>
                          <Text style={styles.compareTableHeaderText}>Difference</Text>
                        </View>
                      </View>
                      {incomeComparisonRows.map((item, idx) => (
                        <View
                          key={`income-compare-${item.metric}`}
                          style={[styles.compareTableValueRow, idx === incomeComparisonRows.length - 1 ? styles.compareTableValueRowLast : null]}>
                          <View style={[styles.compareTableCell, styles.compareTableCellCategory]}>
                            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.compareTableCategoryText}>
                              {item.metric}
                            </Text>
                          </View>
                          <View style={[styles.compareTableCell, styles.compareTableAmountCell]}>
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[styles.compareTableAmountText, item.previousAmount === 0 ? {color: '#9ca3af'} : styles.incomeText]}>
                              {item.previousAmount === 0 ? '' : '+'}
                              {currencySymbol}
                              {item.previousAmount.toLocaleString()}
                            </Text>
                          </View>
                          <View style={[styles.compareTableCell, styles.compareTableAmountCell]}>
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[styles.compareTableAmountText, item.currentAmount === 0 ? {color: '#9ca3af'} : styles.incomeText]}>
                              {item.currentAmount === 0 ? '' : '+'}
                              {currencySymbol}
                              {item.currentAmount.toLocaleString()}
                            </Text>
                          </View>
                          <View style={[styles.compareTableCell, styles.compareTableCellLast, styles.compareTableAmountCell]}>
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.compareTableAmountText,
                                item.difference === 0
                                  ? {color: '#9ca3af'}
                                  : item.positiveIsGood
                                    ? item.difference > 0
                                      ? styles.incomeText
                                      : {color: '#dc2626'}
                                    : item.difference > 0
                                      ? {color: '#dc2626'}
                                      : styles.incomeText,
                              ]}>
                              {item.difference > 0 ? '+' : item.difference < 0 ? '-' : ''}
                              {currencySymbol}
                              {Math.abs(item.difference).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.cardTitleMuted, {marginTop: 10}]}>Year-to-Date ({selectedMonth.getFullYear()})</Text>
                    <View style={styles.cardInner}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Income Total</Text>
                        <Text style={[styles.summaryValue, styles.incomeText]}>+{currencySymbol}{yearlyPayrollSummary.net.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Gross Total</Text>
                        <Text style={[styles.summaryValue, styles.incomeText]}>+{currencySymbol}{yearlyPayrollSummary.gross.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Tax Total</Text>
                        <Text style={[styles.summaryValue, styles.warnText]}>-{currencySymbol}{yearlyPayrollSummary.taxes.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.cardHint}>Deduction Total</Text>
                        <Text style={[styles.summaryValue, styles.warnText]}>-{currencySymbol}{yearlyPayrollSummary.deductions.toLocaleString()}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.cardInner}>
                      <Text style={[styles.cardHint, styles.centerText, {marginTop: 0, fontSize: 12}]}>Total</Text>
                      <Text style={[styles.cardValue, styles.centerText, {color: '#dc2626'}]}>
                        -{currencySymbol}
                        {currentTotalExpense.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.cardTitleMuted}>Expense Details</Text>
                    <View style={styles.cardInner}>
                      {expenseByCategory.length ? (
                        expenseByCategory.map(item => (
                          <View key={`expense-summary-${item.category}`} style={styles.summaryRow}>
                            <Text style={styles.cardHint}>{item.category}</Text>
                            <Text style={[styles.summaryValue, styles.warnText]}>-{currencySymbol}{item.amount.toLocaleString()}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.cardHint}>No expense records this month.</Text>
                      )}
                    </View>
                    <Text style={styles.cardTitleMuted}>Month Comparison</Text>
                    <View style={styles.cardInner}>
                      <View style={styles.compareTableHeaderRow}>
                        <View style={[styles.compareTableCell, styles.compareTableHeaderCategoryCell]}>
                          <Text style={styles.compareTableHeaderText}>Category</Text>
                        </View>
                        <View style={styles.compareTableCell}>
                          <Text style={styles.compareTableHeaderText}>Previous</Text>
                        </View>
                        <View style={styles.compareTableCell}>
                          <Text style={styles.compareTableHeaderText}>This Month</Text>
                        </View>
                        <View style={[styles.compareTableCell, styles.compareTableCellLast]}>
                          <Text style={styles.compareTableHeaderText}>Difference</Text>
                        </View>
                      </View>
                      {expenseComparisonByCategory.length ? (
                        expenseComparisonByCategory.map((item, idx) => (
                          <View
                            key={`expense-compare-${item.category}`}
                            style={[
                              styles.compareTableValueRow,
                              idx === expenseComparisonByCategory.length - 1 ? styles.compareTableValueRowLast : null,
                            ]}>
                            <View style={[styles.compareTableCell, styles.compareTableCellCategory]}>
                              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.compareTableCategoryText}>
                                {item.category}
                              </Text>
                            </View>
                            <View style={[styles.compareTableCell, styles.compareTableAmountCell]}>
                              <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={[styles.compareTableAmountText, item.previousAmount === 0 ? {color: '#9ca3af'} : {color: '#dc2626'}]}>
                                {item.previousAmount === 0 ? '' : '-'}
                                {currencySymbol}
                                {item.previousAmount.toLocaleString()}
                              </Text>
                            </View>
                            <View style={[styles.compareTableCell, styles.compareTableAmountCell]}>
                              <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={[styles.compareTableAmountText, item.currentAmount === 0 ? {color: '#9ca3af'} : {color: '#dc2626'}]}>
                                {item.currentAmount === 0 ? '' : '-'}
                                {currencySymbol}
                                {item.currentAmount.toLocaleString()}
                              </Text>
                            </View>
                            <View style={[styles.compareTableCell, styles.compareTableCellLast, styles.compareTableAmountCell]}>
                              <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={[
                                  styles.compareTableAmountText,
                                  item.difference > 0
                                    ? {color: '#dc2626'}
                                    : item.difference < 0
                                      ? styles.incomeText
                                      : {color: '#9ca3af'},
                                ]}>
                                {item.difference > 0 ? '+' : item.difference < 0 ? '-' : ''}
                                {currencySymbol}
                                {Math.abs(item.difference).toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={[styles.compareTableValueRow, styles.compareTableValueRowLast]}>
                          <View style={[styles.compareTableCell, styles.compareTableCellLast]}>
                            <Text style={styles.cardHint}>No expense records to compare.</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <Modal visible={aiConsentVisible} transparent animationType="fade" onRequestClose={() => setAiConsentVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.cardTitle}>AI Remote Analysis Consent</Text>
              <Text style={styles.cardHint}>
                We can analyze uploaded payroll/card files using remote AI without account signup.
              </Text>
              <Text style={styles.cardHint}>
                - Uses anonymous device ID only{'\n'}- Sends selected file metadata/content for OCR{'\n'}- You can continue manual entry without consent
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.secondaryButtonCompact}
                  onPress={() => {
                    setAiConsentVisible(false);
                    const resolver = aiConsentResolverRef.current;
                    aiConsentResolverRef.current = null;
                    if (resolver) {
                      resolver(false);
                    }
                  }}>
                  <Text style={styles.secondaryButtonText}>Not Now</Text>
                </Pressable>
                <Pressable
                  style={styles.primaryButtonCompact}
                  onPress={() => {
                    setAiConsentAccepted(true);
                    setAiConsentVisible(false);
                    const resolver = aiConsentResolverRef.current;
                    aiConsentResolverRef.current = null;
                    if (resolver) {
                      resolver(true);
                    }
                  }}>
                  <Text style={styles.primaryButtonTextLight}>Agree</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <MoreDrawer
          visible={moreVisible}
          onClose={() => setMoreVisible(false)}
          onSelectSection={handleMoreSectionSelect}
        />
          <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
        </StartupSplashGate>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
