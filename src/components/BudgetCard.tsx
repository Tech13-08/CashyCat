import React from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface Budget {
  id: string;
  name: string;
  fixed_amount: number | null;
  percentage_amount: number | null;
  color: string;
}

interface BudgetCardProps {
  budget: Budget;
  budgetAmount: number;
  spent: number;
  onUpdate: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  budgetAmount,
  spent,
  onUpdate,
}) => {
  const navigate = useNavigate();
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - spent;

  // Get current theme
  const savedTheme = localStorage.getItem("cashcat-theme") || "default";
  const isDarkTheme = savedTheme === "dark";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when deleting
    if (
      window.confirm(
        `Are you sure you want to delete the "${budget.name}" budget?`
      )
    ) {
      await supabase.from("budgets").delete().eq("id", budget.id);
      onUpdate();
    }
  };

  const handleCardClick = () => {
    navigate(`/budget/${budget.id}`);
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    return "bg-green-500";
  };

  const getBudgetTypeText = () => {
    if (budget.fixed_amount && budget.percentage_amount) {
      return `$${budget.fixed_amount} or ${budget.percentage_amount}% (whichever is less)`;
    } else if (budget.fixed_amount) {
      return `$${budget.fixed_amount} fixed`;
    } else if (budget.percentage_amount) {
      return `${budget.percentage_amount}% of income`;
    }
    return "";
  };

  const getThemeClasses = () => {
    const themeClasses: Record<string, any> = {
      default: {
        cardBg: "bg-white",
        cardBorder: "border-orange-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        progressBg: "bg-gray-200",
      },
      dark: {
        cardBg: "bg-gray-800",
        cardBorder: "border-gray-700",
        textPrimary: "text-white",
        textSecondary: "text-gray-300",
        progressBg: "bg-gray-700",
      },
      forest: {
        cardBg: "bg-white",
        cardBorder: "border-green-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        progressBg: "bg-gray-200",
      },
      ocean: {
        cardBg: "bg-white",
        cardBorder: "border-blue-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        progressBg: "bg-gray-200",
      },
      sunset: {
        cardBg: "bg-white",
        cardBorder: "border-purple-100",
        textPrimary: "text-gray-800",
        textSecondary: "text-gray-600",
        progressBg: "bg-gray-200",
      },
    };

    return themeClasses[savedTheme] || themeClasses.default;
  };

  const themeClasses = getThemeClasses();

  return (
    <div
      onClick={handleCardClick}
      className={`${themeClasses.cardBg} rounded-2xl shadow-lg p-6 border ${themeClasses.cardBorder} hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: budget.color }}
          />
          <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
            {budget.name}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDelete}
            className={`p-1 ${
              isDarkTheme
                ? "text-gray-400 hover:text-red-400"
                : "text-gray-400 hover:text-red-500"
            } transition-colors z-10`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Budget Type */}
      <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
        {getBudgetTypeText()}
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className={themeClasses.textSecondary}>Spent</span>
          <span className={`font-medium ${themeClasses.textPrimary}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className={`w-full ${themeClasses.progressBg} rounded-full h-2`}>
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Amounts */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className={themeClasses.textSecondary}>Spent:</span>
          <span className="font-semibold text-red-600">
            ${spent.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className={themeClasses.textSecondary}>Budget:</span>
          <span className="font-semibold text-blue-600">
            ${budgetAmount.toFixed(2)}
          </span>
        </div>
        <div
          className={`flex justify-between border-t pt-2 ${
            isDarkTheme ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <span className={themeClasses.textSecondary}>Remaining:</span>
          <span
            className={`font-semibold ${
              remaining >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${remaining.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Status */}
      {percentage > 100 && (
        <div
          className={`mt-4 p-3 ${
            isDarkTheme
              ? "bg-red-900 border-red-700"
              : "bg-red-50 border-red-200"
          } border rounded-lg`}
        >
          <p
            className={`${
              isDarkTheme ? "text-red-300" : "text-red-700"
            } text-sm font-medium`}
          >
            ⚠️ Budget exceeded!
          </p>
        </div>
      )}
      {percentage >= 80 && percentage < 100 && (
        <div
          className={`mt-4 p-3 ${
            isDarkTheme
              ? "bg-orange-900 border-orange-700"
              : "bg-orange-50 border-orange-200"
          } border rounded-lg`}
        >
          <p
            className={`${
              isDarkTheme ? "text-orange-300" : "text-orange-700"
            } text-sm font-medium`}
          >
            🔶 Getting close to limit!
          </p>
        </div>
      )}
      {percentage === 100 && (
        <div
          className={`mt-4 p-3 ${
            isDarkTheme
              ? "bg-red-900 border-red-700"
              : "bg-orange-50 border-orange-200"
          } border rounded-lg`}
        >
          <p
            className={`${
              isDarkTheme ? "text-red-300" : "text-red-700"
            } text-sm font-medium`}
          >
            ⚡ Budget limit hit!
          </p>
        </div>
      )}

      {/* Click hint */}
      <div className="mt-4 text-center">
        <p
          className={`text-xs ${
            isDarkTheme ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Click to view purchases
        </p>
      </div>
    </div>
  );
};

export default BudgetCard;
