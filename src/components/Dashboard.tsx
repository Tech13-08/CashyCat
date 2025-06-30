import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Settings,
  PiggyBank,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react";
import IncomeSetup from "./IncomeSetup";
import BudgetCard from "./BudgetCard";
import AddPurchaseModal from "./AddPurchaseModal";
import CreateBudgetModal from "./CreateBudgetModal";

interface UserProfile {
  monthly_income: number;
  tracking_start_day: number;
  display_name: string | null;
}

interface Budget {
  id: string;
  name: string;
  fixed_amount: number | null;
  percentage_amount: number | null;
  color: string;
}

interface Purchase {
  id: string;
  budget_id: string;
  amount: number;
  description: string;
  payment_method: "bank" | "credit" | "cash";
  purchase_date: string;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuthContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeSetup, setShowIncomeSetup] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showCreateBudget, setShowCreateBudget] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
      loadTheme();
    }
  }, [user]);

  const loadTheme = () => {
    const savedTheme = localStorage.getItem("cashcat-theme") || "default";
    applyTheme(savedTheme);
  };

  const applyTheme = (themeId: string) => {
    document.documentElement.setAttribute("data-theme", themeId);
    const root = document.documentElement;

    const themes: Record<string, any> = {
      default: { accent: "orange" },
      dark: { accent: "blue" },
      forest: { accent: "green" },
      ocean: { accent: "blue" },
      sunset: { accent: "purple" },
    };

    const theme = themes[themeId] || themes.default;
    root.style.setProperty("--theme-accent", theme.accent);
  };

  // Calculate current tracking period based on user's preferred start day
  const getCurrentTrackingPeriod = (trackingStartDay: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let periodStart: Date;
    let periodEnd: Date;

    if (currentDay >= trackingStartDay) {
      // We're in the current tracking period
      periodStart = new Date(currentYear, currentMonth, trackingStartDay);
      periodEnd = new Date(
        currentYear,
        currentMonth + 1,
        trackingStartDay - 1,
        23,
        59,
        59,
        999
      );
    } else {
      // We're in the previous tracking period
      periodStart = new Date(currentYear, currentMonth - 1, trackingStartDay);
      periodEnd = new Date(
        currentYear,
        currentMonth,
        trackingStartDay - 1,
        23,
        59,
        59,
        999
      );
    }

    return { periodStart, periodEnd };
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("users")
        .select("monthly_income, tracking_start_day, display_name")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      // Fetch budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setBudgets(budgetsData || []);

      // Fetch purchases for current tracking period based on user's preferred start day
      if (profile) {
        const { periodStart, periodEnd } = getCurrentTrackingPeriod(
          profile.tracking_start_day
        );

        const { data: purchasesData } = await supabase
          .from("purchases")
          .select("*")
          .eq("user_id", user.id)
          .gte("purchase_date", periodStart.toISOString())
          .lte("purchase_date", periodEnd.toISOString())
          .order("purchase_date", { ascending: false });

        setPurchases(purchasesData || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetAmount = (budget: Budget) => {
    if (!userProfile) return 0;

    if (budget.fixed_amount && budget.percentage_amount) {
      const percentageAmount =
        (userProfile.monthly_income * budget.percentage_amount) / 100;
      return Math.min(budget.fixed_amount, percentageAmount);
    } else if (budget.fixed_amount) {
      return budget.fixed_amount;
    } else if (budget.percentage_amount) {
      return (userProfile.monthly_income * budget.percentage_amount) / 100;
    }
    return 0;
  };

  const calculateBudgetSpent = (budgetId: string) => {
    return purchases
      .filter((p) => p.budget_id === budgetId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const calculateTotalsByPaymentMethod = () => {
    const totals = { bank: 0, credit: 0, cash: 0 };
    purchases.forEach((purchase) => {
      totals[purchase.payment_method] += purchase.amount;
    });
    return totals;
  };

  const totalBudgeted = budgets.reduce(
    (sum, budget) => sum + calculateBudgetAmount(budget),
    0
  );
  const totalSpent = purchases.reduce(
    (sum, purchase) => sum + purchase.amount,
    0
  );
  const paymentTotals = calculateTotalsByPaymentMethod();

  // Format tracking period for display
  const getTrackingPeriodText = () => {
    if (!userProfile) return "";

    const { periodStart, periodEnd } = getCurrentTrackingPeriod(
      userProfile.tracking_start_day
    );
    const startText = periodStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endText = periodEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${startText} - ${endText}`;
  };

  const getThemeClasses = () => {
    const savedTheme = localStorage.getItem("cashcat-theme") || "default";

    const themeClasses: Record<string, any> = {
      default: {
        background: "bg-gradient-to-br from-orange-50 to-purple-50",
        headerBorder: "border-orange-100",
        cardBorder: "border-orange-100",
      },
      dark: {
        background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
        headerBorder: "border-gray-700",
        cardBorder: "border-gray-700",
      },
      forest: {
        background: "bg-gradient-to-br from-green-50 to-teal-50",
        headerBorder: "border-green-100",
        cardBorder: "border-green-100",
      },
      ocean: {
        background: "bg-gradient-to-br from-blue-50 to-indigo-50",
        headerBorder: "border-blue-100",
        cardBorder: "border-blue-100",
      },
      sunset: {
        background: "bg-gradient-to-br from-purple-50 to-rose-50",
        headerBorder: "border-purple-100",
        cardBorder: "border-purple-100",
      },
    };

    return themeClasses[savedTheme] || themeClasses.default;
  };

  const themeClasses = getThemeClasses();
  const isDarkTheme = localStorage.getItem("cashcat-theme") === "dark";

  if (loading) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🐱</div>
          <p className={`${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
            Loading your finances...
          </p>
        </div>
      </div>
    );
  }

  if (!userProfile?.monthly_income || showIncomeSetup) {
    return (
      <IncomeSetup
        onComplete={() => {
          setShowIncomeSetup(false);
          fetchUserData();
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header */}
      <header
        className={`${
          isDarkTheme ? "bg-gray-800" : "bg-white"
        } shadow-sm border-b ${themeClasses.headerBorder}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 ${
                  isDarkTheme ? "bg-blue-900" : "bg-orange-100"
                } rounded-full flex items-center justify-center`}
              >
                <PiggyBank
                  className={`w-6 h-6 ${
                    isDarkTheme ? "text-blue-400" : "text-orange-500"
                  }`}
                />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    isDarkTheme ? "text-white" : "text-gray-800"
                  }`}
                >
                  CashCat
                </h1>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Welcome back, {userProfile.display_name || user?.email} •
                  Period: {getTrackingPeriodText()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowIncomeSetup(true)}
                className={`p-2 ${
                  isDarkTheme
                    ? "text-gray-300 hover:text-blue-400"
                    : "text-gray-600 hover:text-orange-500"
                } transition-colors`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className={`${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-lg p-6 border ${themeClasses.cardBorder}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Monthly Income
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ${userProfile.monthly_income.toFixed(2)}
                </p>
              </div>
              <PiggyBank className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div
            className={`${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-lg p-6 border ${themeClasses.cardBorder}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Total Budgeted
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ${totalBudgeted.toFixed(2)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div
            className={`${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-lg p-6 border ${themeClasses.cardBorder}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Period Spent
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div
            className={`${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-lg p-6 border ${themeClasses.cardBorder}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${
                    isDarkTheme ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Remaining
                </p>
                <p
                  className={`text-2xl font-bold ${
                    userProfile.monthly_income - totalSpent >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${(userProfile.monthly_income - totalSpent).toFixed(2)}
                </p>
              </div>
              <Banknote className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div
          className={`${
            isDarkTheme ? "bg-gray-800" : "bg-white"
          } rounded-2xl shadow-lg p-6 mb-8 border ${themeClasses.cardBorder}`}
        >
          <h3
            className={`text-lg font-semibold ${
              isDarkTheme ? "text-white" : "text-gray-800"
            } mb-4`}
          >
            Payment Method Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Bank
              </p>
              <p className="text-xl font-bold text-blue-600">
                ${paymentTotals.bank.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <CreditCard className="w-6 h-6 text-purple-500" />
              </div>
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Credit
              </p>
              <p className="text-xl font-bold text-purple-600">
                ${paymentTotals.credit.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <Banknote className="w-6 h-6 text-green-500" />
              </div>
              <p
                className={`text-sm ${
                  isDarkTheme ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Cash
              </p>
              <p className="text-xl font-bold text-green-600">
                ${paymentTotals.cash.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Budgets */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className={`text-2xl font-bold ${
              isDarkTheme ? "text-white" : "text-gray-800"
            }`}
          >
            Your Budgets
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddPurchase(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Purchase</span>
            </button>
            <button
              onClick={() => setShowCreateBudget(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Budget</span>
            </button>
          </div>
        </div>

        {budgets.length === 0 ? (
          <div
            className={`${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } rounded-2xl shadow-lg p-12 text-center border ${
              themeClasses.cardBorder
            }`}
          >
            <div className="text-6xl mb-4">😺</div>
            <h3
              className={`text-xl font-semibold ${
                isDarkTheme ? "text-white" : "text-gray-800"
              } mb-2`}
            >
              No budgets yet!
            </h3>
            <p
              className={`${
                isDarkTheme ? "text-gray-400" : "text-gray-600"
              } mb-6`}
            >
              Create your first budget to start tracking your expenses.
            </p>
            <button
              onClick={() => setShowCreateBudget(true)}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                budgetAmount={calculateBudgetAmount(budget)}
                spent={calculateBudgetSpent(budget.id)}
                onUpdate={fetchUserData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddPurchase && (
        <AddPurchaseModal
          budgets={budgets}
          onClose={() => setShowAddPurchase(false)}
          onSuccess={fetchUserData}
        />
      )}

      {showCreateBudget && (
        <CreateBudgetModal
          monthlyIncome={userProfile.monthly_income}
          totalBudgeted={totalBudgeted}
          onClose={() => setShowCreateBudget(false)}
          onSuccess={fetchUserData}
        />
      )}
    </div>
  );
};

export default Dashboard;
