import { useState } from "react";

interface Props {
  onImport: (path: string) => void;
  onClose: () => void;
}

export function ImportRecipeModal({ onImport, onClose }: Props) {
  const [path, setPath] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (path.trim()) {
      onImport(path.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-gray-100 mb-1">Import Recipe</h2>
        <p className="text-xs text-gray-500 mb-4">Enter the path to a recipe (.recipe.json) file.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/path/to/recipe.recipe.json"
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!path.trim()}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-gray-100 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
