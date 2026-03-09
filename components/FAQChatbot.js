"use client";

import { useState, useEffect, useRef } from "react";

// Default FAQ data organized by categories
const defaultFAQData = {
  categories: [
    {
      id: "services",
      name: "Service & Consultations",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      questions: [
        {
          q: "How do I book an online consultation?",
          a: "You can pre-book directly through our website or via the WhatsApp link provided."
        },
        {
          q: "Do I need to have my reports ready before booking?",
          a: "Yes, having your scans (USG/CT/MRI) ready ensures the most accurate audit."
        },
        {
          q: "Is an online consultation as effective as in-person?",
          a: "Online consultation has its role in patient evaluation and management. For conditions like IBS, report review, second opinions, follow ups and so on, online consultation is an alternative. It never replaces an in-person consultation."
        },
        {
          q: "How long does a typical session last?",
          a: "Most audits last between 15-20 minutes, depending on the complexity of your case."
        },
        {
          q: "Can I consult for someone else (e.g., a parent)?",
          a: "Yes, as long as you have their clinical history and reports available."
        },
        {
          q: "Is this only for surgery?",
          a: "No, we also provide consultations for chronic conditions like IBS and medical gastro issues."
        },
        {
          q: "What if I don't have any reports yet?",
          a: "Dr. Yuvaraj will guide you on exactly which scans are needed after an initial discussion."
        },
        {
          q: "Do you provide a written prescription/summary?",
          a: "Yes, a digital summary of the consultation and advice is provided after the call."
        },
        {
          q: "Can I show my reports on screen during the call?",
          a: "We don't have that feature as of yet, but you can share your reports either before or after the consultation to the WhatsApp support number provided."
        }
      ]
    },
    {
      id: "pricing",
      name: "Pricing & Payments",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      questions: [
        {
          q: "What is the consultation fee?",
          a: "The consultation fee for the first time consultation is Rs 1000/- and for follow-up consultation it is Rs 800/-"
        },
        {
          q: "Are there any hidden charges?",
          a: "All the prices mentioned are inclusive of everything. There are no hidden prices."
        },
        {
          q: "How do I pay?",
          a: "Payment can be done seamlessly via Razorpay."
        },
        {
          q: "Is the payment gateway secure?",
          a: "Yes, we use industry-standard encrypted payment gateways."
        },
        {
          q: "Do I get a receipt for the payment?",
          a: "Yes, an automated receipt is generated and sent to your email/WhatsApp."
        },
        {
          q: "Is there a discount for follow-up consultations?",
          a: "Please check the 'Follow-up' section on our booking page for current rates."
        },
        {
          q: "Can I pay after the consultation?",
          a: "No, we would require all payments to be done prior to the commencement of the consultation."
        },
        {
          q: "Do you offer refunds?",
          a: "In certain situations, Yes. We do provide refunds. Each refund ticket will be analysed and only after that the refund will be processed."
        },
        {
          q: "What happens if the payment fails?",
          a: "Please check your bank statement; failed transactions usually reverse within 3-5 business days."
        }
      ]
    },
    {
      id: "language",
      name: "Language & Regional Support",
      icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
      questions: [
        {
          q: "Can I speak to the doctor in Tamil?",
          a: "Yes, Dr. Yuvaraj is a native Tamil speaker from Salem."
        },
        {
          q: "Does the doctor speak Kannada?",
          a: "Yes, Dr. Yuvaraj is fluent in Kannada."
        },
        {
          q: "Is the consultation available in Hindi?",
          a: "Yes, consultations are available in Hindi."
        },
        {
          q: "Can I talk in Marathi?",
          a: "Dr. Yuvaraj can follow Marathi and reply in Hindi/English."
        },
        {
          q: "Is Malayalam supported?",
          a: "Dr. Yuvaraj can follow Malayalam and provide advice accordingly."
        },
        {
          q: "I am from Salem; can I meet the doctor in person?",
          a: "Currently, Dr. Yuvaraj is practicing in Mumbai, but specialized online audits are available for Salem residents."
        },
        {
          q: "Do I need to speak English to consult?",
          a: "No, you can choose any of the supported regional languages."
        }
      ]
    },
    {
      id: "timings",
      name: "Timings & Scheduling",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      questions: [
        {
          q: "What are the consultation hours?",
          a: "Standard hours are updated weekly on the booking calendar."
        },
        {
          q: "Do you have slots on weekends?",
          a: "Yes, specific slots are usually available on Saturdays."
        },
        {
          q: "What if the doctor is late for the call?",
          a: "Our team will notify you via WhatsApp if there is a minor delay due to a surgical emergency."
        },
        {
          q: "Can I book an emergency same-day slot?",
          a: "Same-day slots depend on availability; please check with the team via WhatsApp support line."
        },
        {
          q: "Is there a waiting time for the online call?",
          a: "We strive to start all calls within 10 minutes of the scheduled time."
        },
        {
          q: "What if I miss my scheduled slot?",
          a: "Please contact support immediately to see if you can be squeezed into a later slot."
        }
      ]
    },
    {
      id: "cancellations",
      name: "Cancellations & Rescheduling",
      icon: "M6 18L18 6M6 6l12 12",
      questions: [
        {
          q: "How do I cancel my booking?",
          a: "You can cancel by messaging our support."
        },
        {
          q: "Can I reschedule my appointment?",
          a: "Yes, rescheduling is free if done at least 12 hours before the slot."
        },
        {
          q: "What is the cancellation fee?",
          a: "Cancellations within 12 hours of the slot may incur a small processing fee."
        },
        {
          q: "How long does a refund take?",
          a: "Refunds usually take 5-7 working days to reflect in your account."
        },
        {
          q: "Can I change my online slot to an in-person visit?",
          a: "Yes, reach out to our team and they will co-ordinate and do the needful."
        }
      ]
    },
    {
      id: "technology",
      name: "Technology & Privacy",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      questions: [
        {
          q: "Which app is used for the video call?",
          a: "We use secure platforms like Google Meet."
        },
        {
          q: "Are my medical reports safe?",
          a: "Yes, all uploaded documents are encrypted and accessible only to the clinical team."
        },
        {
          q: "Do you record the consultation?",
          a: "We do not record video calls without explicit patient consent."
        },
        {
          q: "Can I use my phone for the consultation?",
          a: "Yes, any smartphone with a working camera and microphone is sufficient."
        },
        {
          q: "What if the internet connection drops during the call?",
          a: "Our team will attempt to reconnect or finish the audit via a standard phone call."
        }
      ]
    },
    {
      id: "general",
      name: "General & Trust",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      questions: [
        {
          q: "Where is Dr. Yuvaraj's clinic located?",
          a: "Dr. Yuvaraj practices at SRV Hospital in Tilak Nagar, Mumbai."
        },
        {
          q: "What are the doctor's qualifications?",
          a: "He is an MS, MCh (Gold Medalist) from KEM Mumbai."
        },
        {
          q: "How many surgeries has he performed?",
          a: "He has personally performed over 450 complex GI surgeries."
        },
        {
          q: "Can I get a second opinion on a surgery already scheduled?",
          a: "Yes, that is a primary focus of our 'Second Opinion' service."
        },
        {
          q: "Is this chatbot monitored by humans?",
          a: "Yes, our administrative team reviews queries to assist with booking."
        },
        {
          q: "How can I provide feedback?",
          a: "You will receive a feedback link via WhatsApp after your audit."
        }
      ]
    }
  ],
  welcomeMessage: "Hi! I'm here to help you with any questions about our consultation services. What would you like to know?",
  botName: "CuraGo Assistant",
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
    categories: categories?.length > 0 ? categories : (config.categories?.length > 0 ? config.categories : defaultFAQData.categories)
  };

  // Check if chatbot is enabled and should show on current page
  const isEnabled = enabled !== false && config.enabled !== false;
  const shouldShow = isEnabled && (showOnPages.includes("all") || showOnPages.includes(currentPage));

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
              Need more help? <a href="https://wa.me/917021227203" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Chat on WhatsApp</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
