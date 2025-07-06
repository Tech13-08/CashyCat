import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export interface Budget {
  id: string;
  name: string;
  fixed_amount: number | null;
  percentage_amount: number | null;
  color: string;
}

interface EditBudgetModalProps {
  budget: Budget;
  onClose: () => void;
  onSuccess: () => void;
}

const colorOptions = [
  "#FF6B35",
  "#2DD4BF",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#3B82F6",
  "#F97316",
  "#84CC16",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
];

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  budget,
  onClose,
  onSuccess,
}) => {
  const [editName, setEditName] = useState(budget.name);
  const [editFixed, setEditFixed] = useState(
    budget.fixed_amount?.toString() || ""
  );
  const [editPercent, setEditPercent] = useState(
    budget.percentage_amount?.toString() || ""
  );
  const [editColor, setEditColor] = useState(budget.color);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    if (!editName.trim()) {
      setEditError("Please enter a budget name");
      setEditLoading(false);
      return;
    }
    const updateData: any = {
      name: editName.trim(),
      color: editColor,
      fixed_amount: editFixed ? parseFloat(editFixed) : null,
      percentage_amount: editPercent ? parseFloat(editPercent) : null,
    };
    if (
      updateData.fixed_amount !== null &&
      (isNaN(updateData.fixed_amount) || updateData.fixed_amount < 0)
    ) {
      setEditError("Fixed amount must be a positive number");
      setEditLoading(false);
      return;
    }
    if (
      updateData.percentage_amount !== null &&
      (isNaN(updateData.percentage_amount) ||
        updateData.percentage_amount < 0 ||
        updateData.percentage_amount > 100)
    ) {
      setEditError("Percentage must be between 0 and 100");
      setEditLoading(false);
      return;
    }
    try {
      const { error } = await supabase
        .from("budgets")
        .update(updateData)
        .eq("id", budget.id);
      if (error) {
        setEditError(error.message);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setEditError("An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Budget</h2>
        {editError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm mb-2">
            {editError}
          </div>
        )}
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Fixed Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editFixed}
                onChange={(e) => setEditFixed(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                % of Income
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editPercent}
                onChange={(e) => setEditPercent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {colorOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 ${
                    editColor === opt
                      ? "border-gray-800 scale-110"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: opt }}
                  onClick={() => setEditColor(opt)}
                />
              ))}
            </div>
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;
