import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  DollarSign,
  Calendar,
  Save,
  User,
  Lock,
  Palette,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

interface IncomeSetupProps {
  onComplete: () => void;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
}

const themes: Theme[] = [
  {
    id: "default",
    name: "CashCat Orange",
    description: "Warm and friendly orange theme",
    colors: {
      primary: "from-orange-100 via-pink-50 to-purple-100",
      secondary: "from-orange-50 to-purple-50",
      accent: "orange",
      background: "bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100",
      surface: "bg-white",
    },
  },
  {
    id: "dark",
    name: "Midnight Dark",
    description: "Sleek dark theme for night owls",
    colors: {
      primary: "from-gray-900 via-gray-800 to-gray-900",
      secondary: "from-gray-700 to-gray-800",
      accent: "blue",
      background: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900",
      surface: "bg-gray-800",
    },
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural green theme for eco-conscious users",
    colors: {
      primary: "from-green-100 via-emerald-50 to-teal-100",
      secondary: "from-green-50 to-teal-50",
      accent: "green",
      background: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100",
      surface: "bg-white",
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Calm and professional blue theme",
    colors: {
      primary: "from-blue-100 via-cyan-50 to-indigo-100",
      secondary: "from-blue-50 to-indigo-50",
      accent: "blue",
      background: "bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100",
      surface: "bg-white",
    },
  },
  {
    id: "sunset",
    name: "Sunset Purple",
    description: "Vibrant purple and pink sunset theme",
    colors: {
      primary: "from-purple-100 via-pink-50 to-rose-100",
      secondary: "from-purple-50 to-rose-50",
      accent: "purple",
      background: "bg-gradient-to-br from-purple-100 via-pink-50 to-rose-100",
      surface: "bg-white",
    },
  },
];

const IncomeSetup: React.FC<IncomeSetupProps> = ({ onComplete }) => {
  const { user, signOut } = useAuthContext();
  const [displayName, setDisplayName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [trackingStartDay, setTrackingStartDay] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "appearance" | "danger"
  >("profile");

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      loadTheme();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("monthly_income, tracking_start_day, display_name")
      .eq("id", user.id)
      .single();

    if (data) {
      setMonthlyIncome(data.monthly_income?.toString() || "");
      setTrackingStartDay(data.tracking_start_day || 1);
      setDisplayName(data.display_name || "");
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem("cashcat-theme") || "default";
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  };

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId) || themes[0];
    document.documentElement.setAttribute("data-theme", themeId);

    // Apply CSS custom properties for the theme
    const root = document.documentElement;
    root.style.setProperty("--theme-accent", theme.colors.accent);

    // Store theme preference
    localStorage.setItem("cashcat-theme", themeId);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const income = parseFloat(monthlyIncome);
      if (isNaN(income) || income <= 0) {
        setError("Please enter a valid monthly income");
        return;
      }

      const { error } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email!,
        display_name: displayName.trim() || null,
        monthly_income: income,
        tracking_start_day: trackingStartDay,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPasswordLoading(true);
    setPasswordError("");
    setSuccess("");

    try {
      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    setSuccess("Theme updated successfully!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmText = "DELETE MY ACCOUNT";
    const userInput = prompt(
      `This action cannot be undone. All your data will be permanently deleted.\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      return;
    }

    setDeleteLoading(true);

    try {
      // Delete user data (RLS policies will handle cascade deletion)
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

      if (deleteError) {
        setError("Failed to delete account data");
        return;
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (authError) {
        console.error("Auth deletion error:", authError);
      }

      // Sign out and redirect
      await signOut();
    } catch (err) {
      setError("An unexpected error occurred while deleting your account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentTheme = themes.find((t) => t.id === selectedTheme) || themes[0];

  return (
    <div
      className={`min-h-screen ${currentTheme.colors.background} flex items-center justify-center p-4`}
    >
      <div
        className={`max-w-2xl w-full ${currentTheme.colors.surface} rounded-3xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`bg-gradient-to-r from-${currentTheme.colors.accent}-500 to-${currentTheme.colors.accent}-600 p-6 text-white`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="opacity-90">Manage your CashCat preferences</p>
            </div>
            <button
              onClick={onComplete}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: Lock },
            { id: "appearance", label: "Appearance", icon: Palette },
            { id: "danger", label: "Danger Zone", icon: Trash2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                  activeTab === tab.id
                    ? `text-${currentTheme.colors.accent}-600 border-b-2 border-${currentTheme.colors.accent}-600`
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-8 max-h-96 overflow-y-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Display Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${currentTheme.colors.accent}-500 focus:border-transparent transition-all duration-200`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Monthly Income
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter your monthly income"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${currentTheme.colors.accent}-500 focus:border-transparent transition-all duration-200`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Tracking Period Start Day
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={trackingStartDay}
                    onChange={(e) =>
                      setTrackingStartDay(parseInt(e.target.value))
                    }
                    className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${currentTheme.colors.accent}-500 focus:border-transparent transition-all duration-200 appearance-none`}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day === 1
                          ? "1st"
                          : day === 2
                          ? "2nd"
                          : day === 3
                          ? "3rd"
                          : `${day}th`}{" "}
                        of each month
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This determines when your budget period starts and resets each
                  month.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-${currentTheme.colors.accent}-500 to-${currentTheme.colors.accent}-600 text-white py-3 rounded-lg font-semibold hover:from-${currentTheme.colors.accent}-600 hover:to-${currentTheme.colors.accent}-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <Save className="w-5 h-5" />
                <span>{loading ? "Saving..." : "Save Profile"}</span>
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${currentTheme.colors.accent}-500 focus:border-transparent transition-all duration-200`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${currentTheme.colors.accent}-500 focus:border-transparent transition-all duration-200`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${currentTheme.colors.accent}-500 focus:border-transparent transition-all duration-200`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className={`w-full bg-gradient-to-r from-${currentTheme.colors.accent}-500 to-${currentTheme.colors.accent}-600 text-white py-3 rounded-lg font-semibold hover:from-${currentTheme.colors.accent}-600 hover:to-${currentTheme.colors.accent}-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2`}
              >
                <Lock className="w-5 h-5" />
                <span>
                  {passwordLoading ? "Updating..." : "Update Password"}
                </span>
              </button>
            </form>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Choose Your Theme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedTheme === theme.id
                          ? `border-${currentTheme.colors.accent}-500 bg-${currentTheme.colors.accent}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`w-full h-16 rounded-lg mb-3 ${theme.colors.background}`}
                      ></div>
                      <h4 className="font-semibold text-gray-700">
                        {theme.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {theme.description}
                      </p>
                      {selectedTheme === theme.id && (
                        <div
                          className={`mt-2 text-${currentTheme.colors.accent}-600 text-sm font-medium`}
                        >
                          ✓ Currently Active
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">
                    Delete Account
                  </h3>
                </div>
                <p className="text-red-700 mb-4">
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </p>
                <ul className="text-red-600 text-sm mb-6 space-y-1">
                  <li>• All your budgets will be deleted</li>
                  <li>• All your purchase records will be deleted</li>
                  <li>• Your profile and settings will be deleted</li>
                  <li>• This action is irreversible</li>
                </ul>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {deleteLoading
                      ? "Deleting Account..."
                      : "Delete My Account"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeSetup;
