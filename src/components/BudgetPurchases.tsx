import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
} from "lucide-react";
import EditPurchaseModal from "./EditPurchaseModal";
import AddPurchaseModal from "./AddPurchaseModal";

interface Budget {
  id: string;
  name: string;
  color: string;
  fixed_amount: number | null;
  percentage_amount: number | null;
}

interface Purchase {
  id: string;
  amount: number;
  description: string;
  payment_method: "bank" | "credit" | "cash";
  purchase_date: string;
  created_at: string;
}

const BudgetPurchases: React.FC = () => {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [budget, setBudget] = useState<Budget | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );

  useEffect(() => {
    if (user && budgetId) {
      fetchBudgetAndPurchases();
    }
  }, [user, budgetId]);

  useEffect(() => {
    filterPurchases();
  }, [purchases, searchTerm, paymentMethodFilter, dateFilter]);

  const fetchBudgetAndPurchases = async () => {
    if (!user || !budgetId) return;

    try {
      // Fetch budget details
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("*")
        .eq("id", budgetId)
        .eq("user_id", user.id)
        .single();

      if (!budgetData) {
        navigate("/dashboard");
        return;
      }

      setBudget(budgetData);

      // Fetch purchases for this budget
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("*")
        .eq("budget_id", budgetId)
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false });

      setPurchases(purchasesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    let filtered = [...purchases];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((purchase) =>
        purchase.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(
        (purchase) => purchase.payment_method === paymentMethodFilter
      );
    }

    // Date filter - using local time
    if (dateFilter !== "all") {
      const now = new Date();
      let filterDate = new Date();

      switch (dateFilter) {
        case "today":
          // Start of today in local time
          filterDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          filtered = filtered.filter((purchase) => {
            const purchaseDate = new Date(purchase.purchase_date);
            return purchaseDate >= filterDate;
          });
          break;
        case "week":
          // 7 days ago from now in local time
          filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((purchase) => {
            const purchaseDate = new Date(purchase.purchase_date);
            return purchaseDate >= filterDate;
          });
          break;
        case "month":
          // 30 days ago from now in local time
          filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((purchase) => {
            const purchaseDate = new Date(purchase.purchase_date);
            return purchaseDate >= filterDate;
          });
          break;
      }
    }

    setFilteredPurchases(filtered);
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowEditModal(true);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (window.confirm("Are you sure you want to delete this purchase?")) {
      await supabase.from("purchases").delete().eq("id", purchaseId);
      fetchBudgetAndPurchases();
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "bank":
        return <Building2 className="w-4 h-4" />;
      case "credit":
        return <CreditCard className="w-4 h-4" />;
      case "cash":
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodColor = (method: string, isDark: boolean) => {
    if (isDark) {
      switch (method) {
        case "bank":
          return "text-blue-400 bg-blue-900";
        case "credit":
          return "text-purple-400 bg-purple-900";
        case "cash":
          return "text-green-400 bg-green-900";
        default:
          return "text-gray-400 bg-gray-700";
      }
    } else {
      switch (method) {
        case "bank":
          return "text-blue-600 bg-blue-100";
        case "credit":
          return "text-purple-600 bg-purple-100";
        case "cash":
          return "text-green-600 bg-green-100";
        default:
          return "text-gray-600 bg-gray-100";
      }
    }
  };

  // Format date for display in local timezone (date only, no time)
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalSpent = purchases.reduce(
    (sum, purchase) => sum + purchase.amount,
    0
  );

  // Get current theme
  const savedTheme = localStorage.getItem("cashcat-theme") || "default";
  const isDarkTheme = savedTheme === "dark";

  const getThemeClasses = () => {
    const themeClasses: Record<string, any> = {
      default: {
        background: "bg-gradient-to-br from-orange-50 to-purple-50",
        headerBg: "bg-white",
        headerBorder: "border-orange-100",
        cardBg: "bg-white",
        cardBorder: "border-orange-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        buttonHover: "hover:text-orange-500",
        focusRing: "focus:ring-orange-500",
      },
      dark: {
        background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
        headerBg: "bg-gray-800",
        headerBorder: "border-gray-700",
        cardBg: "bg-gray-800",
        cardBorder: "border-gray-700",
        textPrimary: "text-white",
        textSecondary: "text-gray-300",
        buttonHover: "hover:text-blue-400",
        focusRing: "focus:ring-blue-500",
      },
      forest: {
        background: "bg-gradient-to-br from-green-50 to-teal-50",
        headerBg: "bg-white",
        headerBorder: "border-green-100",
        cardBg: "bg-white",
        cardBorder: "border-green-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        buttonHover: "hover:text-green-500",
        focusRing: "focus:ring-green-500",
      },
      ocean: {
        background: "bg-gradient-to-br from-blue-50 to-indigo-50",
        headerBg: "bg-white",
        headerBorder: "border-blue-100",
        cardBg: "bg-white",
        cardBorder: "border-blue-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        buttonHover: "hover:text-blue-500",
        focusRing: "focus:ring-blue-500",
      },
      sunset: {
        background: "bg-gradient-to-br from-purple-50 to-rose-50",
        headerBg: "bg-white",
        headerBorder: "border-purple-100",
        cardBg: "bg-white",
        cardBorder: "border-purple-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        buttonHover: "hover:text-purple-500",
        focusRing: "focus:ring-purple-500",
      },
    };

    return themeClasses[savedTheme] || themeClasses.default;
  };

  const themeClasses = getThemeClasses();

  if (loading) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🐱</div>
          <p className={themeClasses.textSecondary}>Loading purchases...</p>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div
        className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">😿</div>
          <p className={themeClasses.textSecondary}>Budget not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header */}
      <header
        className={`${themeClasses.headerBg} shadow-sm border-b ${themeClasses.headerBorder}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className={`p-2 ${themeClasses.textSecondary} ${themeClasses.buttonHover} transition-colors`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: budget.color }}
                />
                <div>
                  <h1
                    className={`text-2xl font-bold ${themeClasses.textPrimary}`}
                  >
                    {budget.name}
                  </h1>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    {purchases.length} purchases • ${totalSpent.toFixed(2)}{" "}
                    total spent
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Purchase</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-6 mb-8 border ${themeClasses.cardBorder}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDarkTheme ? "text-gray-400" : "text-gray-400"
                } w-5 h-5`}
              />
              <input
                type="text"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border ${
                  isDarkTheme
                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:ring-2 ${
                  themeClasses.focusRing
                } focus:border-transparent transition-all duration-200`}
              />
            </div>

            {/* Payment Method Filter */}
            <div className="relative">
              <Filter
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDarkTheme ? "text-gray-400" : "text-gray-400"
                } w-5 h-5`}
              />
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border ${
                  isDarkTheme
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:ring-2 ${
                  themeClasses.focusRing
                } focus:border-transparent transition-all duration-200 appearance-none`}
              >
                <option value="all">All Payment Methods</option>
                <option value="bank">Bank</option>
                <option value="credit">Credit</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDarkTheme ? "text-gray-400" : "text-gray-400"
                } w-5 h-5`}
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 border ${
                  isDarkTheme
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300 bg-white"
                } rounded-lg focus:ring-2 ${
                  themeClasses.focusRing
                } focus:border-transparent transition-all duration-200 appearance-none`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchases List */}
        {filteredPurchases.length === 0 ? (
          <div
            className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-12 text-center border ${themeClasses.cardBorder}`}
          >
            <div className="text-6xl mb-4">😺</div>
            <h3
              className={`text-xl font-semibold ${themeClasses.textPrimary} mb-2`}
            >
              {purchases.length === 0
                ? "No purchases yet!"
                : "No purchases match your filters"}
            </h3>
            <p className={`${themeClasses.textSecondary} mb-6`}>
              {purchases.length === 0
                ? "Start tracking your expenses by adding your first purchase."
                : "Try adjusting your search or filter criteria."}
            </p>
            {purchases.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Add Your First Purchase
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-6 border ${themeClasses.cardBorder} hover:shadow-xl transition-shadow duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`text-lg font-semibold ${themeClasses.textPrimary}`}
                      >
                        {purchase.description}
                      </h3>
                      <span className="text-2xl font-bold text-red-600">
                        ${purchase.amount.toFixed(2)}
                      </span>
                    </div>

                    <div
                      className={`flex items-center space-x-4 text-sm ${themeClasses.textSecondary}`}
                    >
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getPaymentMethodColor(
                          purchase.payment_method,
                          isDarkTheme
                        )}`}
                      >
                        {getPaymentMethodIcon(purchase.payment_method)}
                        <span className="capitalize">
                          {purchase.payment_method}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDateForDisplay(purchase.purchase_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditPurchase(purchase)}
                      className={`p-2 ${
                        isDarkTheme
                          ? "text-gray-400 hover:text-blue-400"
                          : "text-gray-400 hover:text-blue-500"
                      } transition-colors`}
                      title="Edit purchase"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(purchase.id)}
                      className={`p-2 ${
                        isDarkTheme
                          ? "text-gray-400 hover:text-red-400"
                          : "text-gray-400 hover:text-red-500"
                      } transition-colors`}
                      title="Delete purchase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && selectedPurchase && (
        <EditPurchaseModal
          purchase={selectedPurchase}
          budgets={[budget]}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPurchase(null);
          }}
          onSuccess={() => {
            fetchBudgetAndPurchases();
            setShowEditModal(false);
            setSelectedPurchase(null);
          }}
        />
      )}

      {showAddModal && (
        <AddPurchaseModal
          budgets={[budget]}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchBudgetAndPurchases();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default BudgetPurchases;
