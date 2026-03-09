"use client";

import { useState } from "react";
import Section from "./Section";
import Button from "./Button";
import ApplicationModal from "./ApplicationModal";

export default function PriorityCircleSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const benefits = [
    {
      title: "Direct WhatsApp Oversight",
      description: "Guidance on flare-ups and report reviews whenever you need it.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      title: "Priority Virtual Consults",
      description: "Skip the wait for expert diagnostic sessions with your dedicated gastroenterologist.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Priority In-Clinic Review",
      description: "For cases that require physical examination or pre-surgical workup. Get priority access to the clinic in Mumbai.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Priority Access to CuraGo Services",
      description: "Priority access at a special price to all of CuraGo's services.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Flexible Rescheduling",
      description: "Flexible appointment management to fit your schedule.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Family Coverage Option",
      description: "Extend benefits to your loved ones with family plan options.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      title: "Overall Medical Guidance",
      description: "Holistic health support beyond just gastroenterology.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <Section bgColor="bg-white" id="priority-circle">
      <div className="text-center mb-8 md:mb-10 px-4">
        <div className="inline-block bg-accent-100 text-primary-700 px-4 py-2 rounded-full text-xs md:text-sm font-semibold mb-3 md:mb-4">
          The Solution
        </div>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-primary-900 mb-3 md:mb-4 leading-tight">
          A 365-Day Partnership for{" "}
          <span className="text-primary-600">Your Gut Health</span>
        </h2>
        <p className="text-base md:text-lg text-primary-800 max-w-3xl mx-auto leading-relaxed">
          Priority Circle 365: Continuous care, expert guidance, and peace of mind—all year round.
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-beige-200 p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-xl border border-primary-100 mb-8 md:mb-10">
        <div className="space-y-3 md:space-y-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                {benefit.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-primary-900 mb-1 break-words">
                  {benefit.title}
                </h3>
                <p className="text-primary-800 text-xs md:text-sm leading-relaxed break-words">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-accent-50 p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl border-2 border-primary-200 text-center">
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-primary-900 mb-2 md:mb-3 leading-tight px-2">
          Ready to Take Control of Your Gut Health?
        </h3>
        <p className="text-sm md:text-base text-primary-800 mb-5 md:mb-6 max-w-2xl mx-auto px-2 leading-relaxed">
          Join Priority Circle 365 and get year-round expert support for your digestive wellness.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm md:text-base px-5 md:px-6 py-2.5 md:py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-600/50 w-full md:w-auto"
        >
          Apply for Priority Circle 365
        </button>
      </div>

      <ApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Section>
  );
}
