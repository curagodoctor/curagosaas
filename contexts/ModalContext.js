"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [alert, setAlert] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const showAlert = useCallback(({ title, message, type = "info" }) => {
    return new Promise((resolve) => {
      setAlert({ title, message, type, resolve });
    });
  }, []);

  const showConfirm = useCallback(({ title, message, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
    return new Promise((resolve) => {
      setConfirm({ title, message, confirmText, cancelText, type, resolve });
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alert?.resolve) alert.resolve();
    setAlert(null);
  }, [alert]);

  const handleConfirm = useCallback((value) => {
    if (confirm?.resolve) confirm.resolve(value);
    setConfirm(null);
  }, [confirm]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Modal */}
      {alert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
            {/* Header */}
            <div className={`px-6 py-4 border-b-2 ${
              alert.type === "success" ? "border-green-200 bg-green-50" :
              alert.type === "error" ? "border-red-200 bg-red-50" :
              alert.type === "warning" ? "border-yellow-200 bg-yellow-50" :
              "border-blue-200 bg-blue-50"
            }`}>
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  alert.type === "success" ? "bg-green-100" :
                  alert.type === "error" ? "bg-red-100" :
                  alert.type === "warning" ? "bg-yellow-100" :
                  "bg-blue-100"
                }`}>
                  {alert.type === "success" && (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {alert.type === "error" && (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {alert.type === "warning" && (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {alert.type === "info" && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                {/* Title */}
                <h3 className={`text-lg font-bold ${
                  alert.type === "success" ? "text-green-900" :
                  alert.type === "error" ? "text-red-900" :
                  alert.type === "warning" ? "text-yellow-900" :
                  "text-blue-900"
                }`}>
                  {alert.title || (
                    alert.type === "success" ? "Success" :
                    alert.type === "error" ? "Error" :
                    alert.type === "warning" ? "Warning" :
                    "Information"
                  )}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 text-base leading-relaxed">{alert.message}</p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={closeAlert}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                  alert.type === "success" ? "bg-green-600 hover:bg-green-700 text-white" :
                  alert.type === "error" ? "bg-red-600 hover:bg-red-700 text-white" :
                  alert.type === "warning" ? "bg-yellow-600 hover:bg-yellow-700 text-white" :
                  "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
            {/* Header */}
            <div className={`px-6 py-4 border-b-2 ${
              confirm.type === "danger" ? "border-red-200 bg-red-50" :
              confirm.type === "warning" ? "border-yellow-200 bg-yellow-50" :
              "border-blue-200 bg-blue-50"
            }`}>
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  confirm.type === "danger" ? "bg-red-100" :
                  confirm.type === "warning" ? "bg-yellow-100" :
                  "bg-blue-100"
                }`}>
                  {confirm.type === "danger" && (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {confirm.type === "warning" && (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {confirm.type !== "danger" && confirm.type !== "warning" && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                {/* Title */}
                <h3 className={`text-lg font-bold ${
                  confirm.type === "danger" ? "text-red-900" :
                  confirm.type === "warning" ? "text-yellow-900" :
                  "text-blue-900"
                }`}>
                  {confirm.title || "Confirm Action"}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{confirm.message}</p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => handleConfirm(false)}
                className="px-6 py-2.5 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                {confirm.cancelText}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                  confirm.type === "danger" ? "bg-red-600 hover:bg-red-700 text-white" :
                  confirm.type === "warning" ? "bg-yellow-600 hover:bg-yellow-700 text-white" :
                  "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {confirm.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
