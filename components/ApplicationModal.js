"use client";

import { useState } from "react";

export default function ApplicationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    age: "",
    city: "",
    area: "",
    hasGutBrainProblem: "",
    problemDescription: "",
    preferredOption: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Prepare the data payload
      const submissionData = {
        name: formData.name,
        phoneNumber: formData.phone,
        email: formData.email,
        age: formData.age,
        city: formData.city,
        area: formData.area,
        hasGutBrainProblem: formData.hasGutBrainProblem,
        problemDescription: formData.problemDescription,
        preferredOption: formData.preferredOption
      };

      // Send to current webhook
      const webhookPromise = fetch('https://server.wylto.com/webhook/XLuJDKiLWjA5j49Y8S', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      // Send to Google Sheets via our API route (avoids CORS)
      const googleSheetsPromise = fetch('/api/priority-circle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      // Wait for both requests to complete
      const [webhookResponse] = await Promise.all([
        webhookPromise,
        googleSheetsPromise
      ]);

      if (webhookResponse.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          name: "",
          phone: "",
          email: "",
          age: "",
          city: "",
          area: "",
          hasGutBrainProblem: "",
          problemDescription: "",
          preferredOption: ""
        });
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-beige-200 hover:bg-beige-300 transition-colors text-primary-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal content */}
        <div className="p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-block bg-accent-100 text-primary-700 px-6 py-2 rounded-full text-sm font-semibold mb-4">
              Priority Circle 365
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Apply for Membership
            </h2>
            <p className="text-lg text-primary-800">
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question 1: Are you facing any problem related to the Gut Brain Axis? */}
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-3">
                Are you facing any problem related to the Gut Brain Axis? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasGutBrainProblem"
                    value="Yes"
                    required
                    checked={formData.hasGutBrainProblem === "Yes"}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-600"
                  />
                  <span className="text-primary-900">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasGutBrainProblem"
                    value="No"
                    required
                    checked={formData.hasGutBrainProblem === "No"}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-600"
                  />
                  <span className="text-primary-900">No</span>
                </label>
              </div>
            </div>

            {/* Question 2: Describe in brief the problem you are facing */}
            <div>
              <label htmlFor="problemDescription" className="block text-sm font-semibold text-primary-900 mb-2">
                Describe in brief the problem you are facing *
              </label>
              <textarea
                id="problemDescription"
                name="problemDescription"
                rows="4"
                required
                value={formData.problemDescription}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900 resize-none"
                placeholder="Briefly describe the problem you are facing..."
              />
            </div>

            {/* Question 3: What would be helpful for you? */}
            <div>
              <label htmlFor="preferredOption" className="block text-sm font-semibold text-primary-900 mb-2">
                Given your current situation, what do you think would be helpful for you? *
              </label>
              <select
                id="preferredOption"
                name="preferredOption"
                required
                value={formData.preferredOption}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
              >
                <option value="">Select an option</option>
                <option value="One-time Video/In-clinic consultation">One-time Video/In-clinic consultation</option>
                <option value="Dr. Yuvaraj's Priority Circle 365">Dr. Yuvaraj's Priority Circle 365</option>
              </select>
            </div>

            {/* Personal Details */}
            <div className="pt-4 border-t border-primary-200">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Personal Details</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-primary-900 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-primary-900 mb-2">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-primary-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-semibold text-primary-900 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-primary-900 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-semibold text-primary-900 mb-2">
                    Area of Residence *
                  </label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    required
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all bg-white text-primary-900"
                    placeholder="Enter your area of residence"
                  />
                </div>
              </div>
            </div>

            <div className="bg-beige-200 p-4 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-800">
                <strong>What happens next?</strong> We'll review your application and contact you via WhatsApp within 24 hours to discuss your personalized care plan.
              </p>
            </div>

            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Application submitted successfully! We'll contact you soon.</span>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Failed to submit. Please try again.</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-600/50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="text-center text-sm text-primary-700">
              By submitting, you agree to receive WhatsApp communication from Dr. Yuvaraj's team.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
