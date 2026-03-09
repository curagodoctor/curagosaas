"use client";

import { useState } from "react";

// Default FAQ data for initialization
const defaultCategories = [
  {
    id: "services",
    name: "Service & Consultations",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    questions: [
      { q: "How do I book an online consultation?", a: "You can pre-book directly through our website or via the WhatsApp link provided." },
      { q: "Do I need to have my reports ready before booking?", a: "Yes, having your scans (USG/CT/MRI) ready ensures the most accurate audit." },
      { q: "Is an online consultation as effective as in-person?", a: "Online consultation has its role in patient evaluation and management. For conditions like IBS, report review, second opinions, follow ups and so on, online consultation is an alternative. It never replaces an in-person consultation." },
      { q: "How long does a typical session last?", a: "Most audits last between 15-20 minutes, depending on the complexity of your case." },
      { q: "Can I consult for someone else (e.g., a parent)?", a: "Yes, as long as you have their clinical history and reports available." },
      { q: "Is this only for surgery?", a: "No, we also provide consultations for chronic conditions like IBS and medical gastro issues." },
      { q: "What if I don't have any reports yet?", a: "Dr. Yuvaraj will guide you on exactly which scans are needed after an initial discussion." },
      { q: "Do you provide a written prescription/summary?", a: "Yes, a digital summary of the consultation and advice is provided after the call." },
      { q: "Can I show my reports on screen during the call?", a: "We don't have that feature as of yet, but you can share your reports either before or after the consultation to the WhatsApp support number provided." }
    ]
  },
  {
    id: "pricing",
    name: "Pricing & Payments",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    questions: [
      { q: "What is the consultation fee?", a: "The consultation fee for the first time consultation is Rs 1000/- and for follow-up consultation it is Rs 800/-" },
      { q: "Are there any hidden charges?", a: "All the prices mentioned are inclusive of everything. There are no hidden prices." },
      { q: "How do I pay?", a: "Payment can be done seamlessly via Razorpay." },
      { q: "Is the payment gateway secure?", a: "Yes, we use industry-standard encrypted payment gateways." },
      { q: "Do I get a receipt for the payment?", a: "Yes, an automated receipt is generated and sent to your email/WhatsApp." },
      { q: "Is there a discount for follow-up consultations?", a: "Please check the 'Follow-up' section on our booking page for current rates." },
      { q: "Can I pay after the consultation?", a: "No, we would require all payments to be done prior to the commencement of the consultation." },
      { q: "Do you offer refunds?", a: "In certain situations, Yes. We do provide refunds. Each refund ticket will be analysed and only after that the refund will be processed." },
      { q: "What happens if the payment fails?", a: "Please check your bank statement; failed transactions usually reverse within 3-5 business days." }
    ]
  },
  {
    id: "language",
    name: "Language & Regional Support",
    icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
    questions: [
      { q: "Can I speak to the doctor in Tamil?", a: "Yes, Dr. Yuvaraj is a native Tamil speaker from Salem." },
      { q: "Does the doctor speak Kannada?", a: "Yes, Dr. Yuvaraj is fluent in Kannada." },
      { q: "Is the consultation available in Hindi?", a: "Yes, consultations are available in Hindi." },
      { q: "Can I talk in Marathi?", a: "Dr. Yuvaraj can follow Marathi and reply in Hindi/English." },
      { q: "Is Malayalam supported?", a: "Dr. Yuvaraj can follow Malayalam and provide advice accordingly." },
      { q: "I am from Salem; can I meet the doctor in person?", a: "Currently, Dr. Yuvaraj is practicing in Mumbai, but specialized online audits are available for Salem residents." },
      { q: "Do I need to speak English to consult?", a: "No, you can choose any of the supported regional languages." }
    ]
  },
  {
    id: "timings",
    name: "Timings & Scheduling",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    questions: [
      { q: "What are the consultation hours?", a: "Standard hours are updated weekly on the booking calendar." },
      { q: "Do you have slots on weekends?", a: "Yes, specific slots are usually available on Saturdays." },
      { q: "What if the doctor is late for the call?", a: "Our team will notify you via WhatsApp if there is a minor delay due to a surgical emergency." },
      { q: "Can I book an emergency same-day slot?", a: "Same-day slots depend on availability; please check with the team via WhatsApp support line." },
      { q: "Is there a waiting time for the online call?", a: "We strive to start all calls within 10 minutes of the scheduled time." },
      { q: "What if I miss my scheduled slot?", a: "Please contact support immediately to see if you can be squeezed into a later slot." }
    ]
  },
  {
    id: "cancellations",
    name: "Cancellations & Rescheduling",
    icon: "M6 18L18 6M6 6l12 12",
    questions: [
      { q: "How do I cancel my booking?", a: "You can cancel by messaging our support." },
      { q: "Can I reschedule my appointment?", a: "Yes, rescheduling is free if done at least 12 hours before the slot." },
      { q: "What is the cancellation fee?", a: "Cancellations within 12 hours of the slot may incur a small processing fee." },
      { q: "How long does a refund take?", a: "Refunds usually take 5-7 working days to reflect in your account." },
      { q: "Can I change my online slot to an in-person visit?", a: "Yes, reach out to our team and they will co-ordinate and do the needful." }
    ]
  },
  {
    id: "technology",
    name: "Technology & Privacy",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    questions: [
      { q: "Which app is used for the video call?", a: "We use secure platforms like Google Meet." },
      { q: "Are my medical reports safe?", a: "Yes, all uploaded documents are encrypted and accessible only to the clinical team." },
      { q: "Do you record the consultation?", a: "We do not record video calls without explicit patient consent." },
      { q: "Can I use my phone for the consultation?", a: "Yes, any smartphone with a working camera and microphone is sufficient." },
      { q: "What if the internet connection drops during the call?", a: "Our team will attempt to reconnect or finish the audit via a standard phone call." }
    ]
  },
  {
    id: "general",
    name: "General & Trust",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    questions: [
      { q: "Where is Dr. Yuvaraj's clinic located?", a: "Dr. Yuvaraj practices at SRV Hospital in Tilak Nagar, Mumbai." },
      { q: "What are the doctor's qualifications?", a: "He is an MS, MCh (Gold Medalist) from KEM Mumbai." },
      { q: "How many surgeries has he performed?", a: "He has personally performed over 450 complex GI surgeries." },
      { q: "Can I get a second opinion on a surgery already scheduled?", a: "Yes, that is a primary focus of our 'Second Opinion' service." },
      { q: "Is this chatbot monitored by humans?", a: "Yes, our administrative team reviews queries to assist with booking." },
      { q: "How can I provide feedback?", a: "You will receive a feedback link via WhatsApp after your audit." }
    ]
  }
];

const iconOptions = [
  { value: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Document" },
  { value: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Money" },
  { value: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129", label: "Language" },
  { value: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Clock" },
  { value: "M6 18L18 6M6 6l12 12", label: "Cancel" },
  { value: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Shield" },
  { value: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Info" },
  { value: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", label: "Heart" },
  { value: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Chat" },
];

export default function ChatbotConfig({ config = {}, onChange }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Initialize with defaults
  const chatConfig = {
    enabled: config.enabled ?? true,
    botName: config.botName || "CuraGo Assistant",
    welcomeMessage: config.welcomeMessage || "Hi! I'm here to help you with any questions about our consultation services. What would you like to know?",
    primaryColor: config.primaryColor || "#059669",
    position: config.position || "right",
    categories: config.categories?.length > 0 ? config.categories : defaultCategories,
  };

  const handleChange = (field, value) => {
    onChange({
      ...chatConfig,
      [field]: value
    });
  };

  const handleCategoryChange = (categoryIndex, field, value) => {
    const newCategories = [...chatConfig.categories];
    newCategories[categoryIndex] = {
      ...newCategories[categoryIndex],
      [field]: value
    };
    handleChange("categories", newCategories);
  };

  const handleQuestionChange = (categoryIndex, questionIndex, field, value) => {
    const newCategories = [...chatConfig.categories];
    newCategories[categoryIndex].questions[questionIndex] = {
      ...newCategories[categoryIndex].questions[questionIndex],
      [field]: value
    };
    handleChange("categories", newCategories);
  };

  const addCategory = () => {
    const newCategory = {
      id: `category_${Date.now()}`,
      name: "New Category",
      icon: iconOptions[0].value,
      questions: []
    };
    handleChange("categories", [...chatConfig.categories, newCategory]);
    setExpandedCategory(chatConfig.categories.length);
  };

  const removeCategory = (index) => {
    const newCategories = chatConfig.categories.filter((_, i) => i !== index);
    handleChange("categories", newCategories);
    setExpandedCategory(null);
  };

  const addQuestion = (categoryIndex) => {
    const newCategories = [...chatConfig.categories];
    newCategories[categoryIndex].questions.push({
      q: "New Question?",
      a: "Answer here..."
    });
    handleChange("categories", newCategories);
  };

  const removeQuestion = (categoryIndex, questionIndex) => {
    const newCategories = [...chatConfig.categories];
    newCategories[categoryIndex].questions = newCategories[categoryIndex].questions.filter((_, i) => i !== questionIndex);
    handleChange("categories", newCategories);
  };

  const moveCategory = (index, direction) => {
    const newCategories = [...chatConfig.categories];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newCategories.length) return;
    [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
    handleChange("categories", newCategories);
    setExpandedCategory(newIndex);
  };

  const resetToDefaults = () => {
    if (confirm("This will reset all FAQ content to defaults. Continue?")) {
      onChange({
        enabled: true,
        botName: "CuraGo Assistant",
        welcomeMessage: "Hi! I'm here to help you with any questions about our consultation services. What would you like to know?",
        primaryColor: "#059669",
        position: "right",
        categories: defaultCategories,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">Enable FAQ Chatbot</h4>
          <p className="text-sm text-gray-500">Show the chatbot on this page</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={chatConfig.enabled}
            onChange={(e) => handleChange("enabled", e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {chatConfig.enabled && (
        <>
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2">Basic Settings</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
              <input
                type="text"
                value={chatConfig.botName}
                onChange={(e) => handleChange("botName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
              <textarea
                value={chatConfig.welcomeMessage}
                onChange={(e) => handleChange("welcomeMessage", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chatConfig.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={chatConfig.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  value={chatConfig.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="right">Bottom Right</option>
                  <option value="left">Bottom Left</option>
                </select>
              </div>
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-medium text-gray-900">FAQ Categories ({chatConfig.categories.length})</h4>
              <div className="flex gap-2">
                <button
                  onClick={resetToDefaults}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset to defaults
                </button>
                <button
                  onClick={addCategory}
                  className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                >
                  + Add Category
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {chatConfig.categories.map((category, catIndex) => (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => setExpandedCategory(expandedCategory === catIndex ? null : catIndex)}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                      </svg>
                      <span className="font-medium text-gray-700">{category.name}</span>
                      <span className="text-sm text-gray-400">({category.questions.length} questions)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveCategory(catIndex, -1); }}
                        disabled={catIndex === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveCategory(catIndex, 1); }}
                        disabled={catIndex === chatConfig.categories.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCategory(catIndex); }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategory === catIndex ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Category Content */}
                  {expandedCategory === catIndex && (
                    <div className="p-4 space-y-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleCategoryChange(catIndex, "name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                          <select
                            value={category.icon}
                            onChange={(e) => handleCategoryChange(catIndex, "icon", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            {iconOptions.map((icon) => (
                              <option key={icon.label} value={icon.value}>{icon.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Questions</label>
                          <button
                            onClick={() => addQuestion(catIndex)}
                            className="text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            + Add Question
                          </button>
                        </div>

                        {category.questions.map((question, qIndex) => (
                          <div key={qIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div
                              className="flex items-center justify-between p-2 bg-white cursor-pointer hover:bg-gray-50"
                              onClick={() => setExpandedQuestion(expandedQuestion === `${catIndex}-${qIndex}` ? null : `${catIndex}-${qIndex}`)}
                            >
                              <span className="text-sm text-gray-700 truncate flex-1 pr-2">{question.q}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeQuestion(catIndex, qIndex); }}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <svg
                                  className={`w-4 h-4 text-gray-400 transition-transform ${expandedQuestion === `${catIndex}-${qIndex}` ? "rotate-180" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {expandedQuestion === `${catIndex}-${qIndex}` && (
                              <div className="p-3 space-y-3 border-t border-gray-200 bg-gray-50">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                                  <input
                                    type="text"
                                    value={question.q}
                                    onChange={(e) => handleQuestionChange(catIndex, qIndex, "q", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Answer</label>
                                  <textarea
                                    value={question.a}
                                    onChange={(e) => handleQuestionChange(catIndex, qIndex, "a", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
