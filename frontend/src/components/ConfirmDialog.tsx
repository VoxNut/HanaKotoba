import { useConfirmStore } from "../store/confirmStore";

export function ConfirmDialog() {
  const { dialog } = useConfirmStore();

  if (!dialog || !dialog.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
          {dialog.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {dialog.message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={dialog.onCancel}
            className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={dialog.onConfirm}
            className="px-4 py-2 rounded-lg font-medium transition-all bg-primary-500 hover:bg-primary-600 text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
