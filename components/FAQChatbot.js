"use client";

import { useState, useEffect, useRef } from "react";

// Default chatbot CONFIG only — deliberately carries NO doctor-specific or seed
// FAQ content. A doctor's chatbot must only ever show FAQs THEY configured; when
// none are configured, `categories` stays empty and the chatbot does not render
// at all (see the guard in the component). This prevents any one doctor's / the
// platform's placeholder content from leaking onto another doctor's site.
const defaultFAQData = {
  categories: [],
  welcomeMessage: "Hi! How can I help you today?",
  botName: "Assistant",
  primaryColor: "#059669",
  position: "right"
};

export default function FAQChatbot({
  // Direct props from SectionRenderer (spread from section.config)
  enabled = true,
  botName,
  welcomeMessage,
  primaryColor,
  position,
  categories,
  // Legacy config prop support
  config = {},
  // Doctor info (passed from site page)
  doctor,
  // Page visibility control
  showOnPages = ["all"],
  currentPage = "home"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentView, setCurrentView] = useState("categories"); // categories, questions, answer
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const chatEndRef = useRef(null);

  // Merge default config with direct props and legacy config prop
  const faqConfig = {
    ...defaultFAQData,
    ...config,
    // Direct props override everything
    ...(botName && { botName }),
    ...(welcomeMessage && { welcomeMessage }),
    ...(primaryColor && { primaryColor }),
    ...(position && { position }),
    // A doctor's chatbot must ONLY show their own configured FAQs — never any
    // seed/placeholder data. If nothing is configured, categories stays empty and
    // the chatbot does not render (see guard below).
    categories: categories?.length > 0 ? categories : (config.categories?.length > 0 ? config.categories : [])
  };

  // Check if chatbot is enabled and should show on current page. It also must
  // have at least one configured category — otherwise there's nothing to answer
  // and we must never fall back to another doctor's / platform seed content.
  const isEnabled = enabled !== false && config.enabled !== false;
  const hasContent = Array.isArray(faqConfig.categories) && faqConfig.categories.length > 0;
  const shouldShow = isEnabled && hasContent && (showOnPages.includes("all") || showOnPages.includes(currentPage));

  // Auto-show tooltip on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500); // Show after 1.5 seconds

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000); // Hide after 8 seconds

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, currentView]);

  // Initialize chat with welcome message when opened
  useEffect(() => {
    if (isOpen && chatHistory.length === 0) {
      setChatHistory([
        { type: "bot", content: faqConfig.welcomeMessage }
      ]);
    }
    // Hide tooltip when chat is opened
    if (isOpen) {
      setShowTooltip(false);
    }
  }, [isOpen]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentView("questions");
    setChatHistory(prev => [
      ...prev,
      { type: "user", content: category.name },
      { type: "bot", content: `Here are common questions about ${category.name}. Select one to learn more:` }
    ]);
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setCurrentView("answer");
    setChatHistory(prev => [
      ...prev,
      { type: "user", content: question.q },
      { type: "bot", content: question.a }
    ]);
  };

  const handleBackToCategories = () => {
    setCurrentView("categories");
    setSelectedCategory(null);
    setSelectedQuestion(null);
    setChatHistory(prev => [
      ...prev,
      { type: "bot", content: "What else would you like to know?" }
    ]);
  };

  const handleBackToQuestions = () => {
    setCurrentView("questions");
    setSelectedQuestion(null);
  };

  const resetChat = () => {
    setChatHistory([
      { type: "bot", content: faqConfig.welcomeMessage }
    ]);
    setCurrentView("categories");
    setSelectedCategory(null);
    setSelectedQuestion(null);
  };

  if (!shouldShow) return null;

  const themeColor = faqConfig.primaryColor || "#059669";

  return (
    <>
      {/* Chat Button with Tooltip */}
      <div
        className="fixed z-50 group"
        style={{
          bottom: "104px",
          right: faqConfig.position === "left" ? "auto" : "24px",
          left: faqConfig.position === "left" ? "24px" : "auto"
        }}
      >
        {/* Tooltip */}
        <div
          className={`absolute bottom-full right-0 mb-3 transition-all duration-500 ${
            showTooltip && !isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="relative bg-white text-gray-800 px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 whitespace-nowrap">
            <span className="text-sm font-medium">Hey, how can I help you?</span>
            {/* Tooltip arrow */}
            <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45"></div>
          </div>
        </div>

        {/* Button - same size as WhatsApp button (p-4 + w-8 h-8 icon) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 text-white flex items-center justify-center"
          style={{ backgroundColor: themeColor }}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>

        {/* Hover tooltip (shows on hover when auto-tooltip is hidden) */}
        {!showTooltip && !isOpen && (
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Chat with us
          </span>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            bottom: "176px",
            right: faqConfig.position === "left" ? "auto" : "24px",
            left: faqConfig.position === "left" ? "24px" : "auto",
            width: "min(380px, calc(100vw - 48px))",
            height: "min(550px, calc(100vh - 220px))"
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{faqConfig.botName}</h3>
                <p className="text-white/80 text-xs">Online | Typically replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetChat}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                title="Reset chat"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.type === "user"
                      ? "bg-gray-200 text-gray-800 rounded-br-md"
                      : "bg-white text-gray-700 rounded-bl-md shadow-sm border border-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Options Panel */}
          <div className="border-t border-gray-200 bg-white p-3 max-h-[45%] overflow-y-auto">
            {/* Back Button */}
            {currentView !== "categories" && (
              <button
                onClick={currentView === "answer" ? handleBackToQuestions : handleBackToCategories}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {currentView === "answer" ? "More questions" : "All categories"}
              </button>
            )}

            {/* Categories View */}
            {currentView === "categories" && (
              <div className="grid grid-cols-2 gap-2">
                {faqConfig.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-all duration-200 border border-gray-100 hover:border-gray-200"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke={themeColor}
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{category.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Questions View */}
            {currentView === "questions" && selectedCategory && (
              <div className="space-y-2">
                {selectedCategory.questions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuestionSelect(question)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 transition-all duration-200 border border-gray-100 hover:border-gray-200"
                  >
                    {question.q}
                  </button>
                ))}
              </div>
            )}

            {/* Answer View - Show related questions */}
            {currentView === "answer" && selectedCategory && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Related questions:</p>
                {selectedCategory.questions
                  .filter(q => q.q !== selectedQuestion?.q)
                  .slice(0, 3)
                  .map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuestionSelect(question)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 transition-all duration-200 border border-gray-100 hover:border-gray-200"
                    >
                      {question.q}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Need more help? <a href={`https://wa.me/${doctor?.whatsappNumber ? '91' + doctor.whatsappNumber : doctor?.phone ? '91' + doctor.phone : ''}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Chat on WhatsApp</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
