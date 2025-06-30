import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Tag, DollarSign, Percent, Palette } from 'lucide-react';

interface CreateBudgetModalProps {
  monthlyIncome: number;
  totalBudgeted: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({ 
  monthlyIncome, 
  totalBudgeted, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuthContext();
  const [name, setName] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'percentage' | 'hybrid'>('fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [percentageAmount, setPercentageAmount] = useState('');
  const [color, setColor] = useState('#FF6B35');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = [
    '#FF6B35', '#2DD4BF', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
    '#3B82F6', '#F97316', '#84CC16', '#EC4899', '#6366F1', '#14B8A6'
  ];

  const calculateBudgetAmount = () => {
    if (budgetType === 'fixed') {
      return parseFloat(fixedAmount) || 0;
    } else if (budgetType === 'percentage') {
      return (monthlyIncome * (parseFloat(percentageAmount) || 0)) / 100;
    } else if (budgetType === 'hybrid') {
      const fixed = parseFloat(fixedAmount) || 0;
      const percentage = (monthlyIncome * (parseFloat(percentageAmount) || 0)) / 100;
      return Math.min(fixed, percentage);
    }
    return 0;
  };

  const newBudgetAmount = calculateBudgetAmount();
  const newTotal = totalBudgeted + newBudgetAmount;
  const exceedsIncome = newTotal > monthlyIncome;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      if (!name.trim()) {
        setError('Please enter a budget name');
        return;
      }

      let budgetData: any = {
        user_id: user.id,
        name: name.trim(),
        color,
      };

      if (budgetType === 'fixed') {
        const amount = parseFloat(fixedAmount);
        if (isNaN(amount) || amount <= 0) {
          setError('Please enter a valid fixed amount');
          return;
        }
        budgetData.fixed_amount = amount;
      } else if (budgetType === 'percentage') {
        const percentage = parseFloat(percentageAmount);
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          setError('Please enter a percentage between 1 and 100');
          return;
        }
        budgetData.percentage_amount = percentage;
      } else if (budgetType === 'hybrid') {
        const fixed = parseFloat(fixedAmount);
        const percentage = parseFloat(percentageAmount);
        
        if (isNaN(fixed) || fixed <= 0) {
          setError('Please enter a valid fixed amount');
          return;
        }
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          setError('Please enter a percentage between 1 and 100');
          return;
        }
        
        budgetData.fixed_amount = fixed;
        budgetData.percentage_amount = percentage;
      }

      const { error } = await supabase.from('budgets').insert(budgetData);

      if (error) {
        setError(error.message);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Budget</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {exceedsIncome && newBudgetAmount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-700 text-sm">
              ⚠️ Warning: Adding this budget will exceed your monthly income by ${(newTotal - monthlyIncome).toFixed(2)}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Name
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="e.g., Food, Transportation, Entertainment"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Budget Type
            </label>
            <div className="space-y-3">
              {[
                { value: 'fixed', label: 'Fixed Amount', desc: 'Set a specific dollar amount' },
                { value: 'percentage', label: 'Percentage', desc: 'Set as percentage of income' },
                { value: 'hybrid', label: 'Hybrid', desc: 'Both fixed and percentage (whichever is less)' },
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setBudgetType(type.value as 'fixed' | 'percentage' | 'hybrid')}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                    budgetType === type.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-800">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {(budgetType === 'fixed' || budgetType === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter fixed amount"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required={budgetType === 'fixed' || budgetType === 'hybrid'}
                />
              </div>
            </div>
          )}

          {(budgetType === 'percentage' || budgetType === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage of Income
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Enter percentage"
                  value={percentageAmount}
                  onChange={(e) => setPercentageAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required={budgetType === 'percentage' || budgetType === 'hybrid'}
                />
              </div>
            </div>
          )}

          {newBudgetAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 font-medium">
                Budget Amount: ${newBudgetAmount.toFixed(2)}
              </p>
              {budgetType === 'hybrid' && (
                <p className="text-blue-600 text-sm mt-1">
                  (Lesser of ${fixedAmount} fixed or {percentageAmount}% of income)
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {colors.map(colorOption => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-10 h-10 rounded-full border-4 transition-all duration-200 ${
                    color === colorOption ? 'border-gray-800 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBudgetModal;