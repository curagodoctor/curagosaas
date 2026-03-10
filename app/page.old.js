"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  trackPageView,
  trackAddToCart,
  trackButtonClick,
  trackWhatsAppClick,
  trackScrollDepth,
  trackFormSubmit
} from "@/lib/tracking";
import { useModal } from "@/contexts/ModalContext";
import Footer from "@/components/Footer";
import FAQChatbot from "@/components/FAQChatbot";

// Color scheme mapping for clinic buttons
const colorMap = {
  green: { border: "border-green-200", hoverBorder: "hover:border-green-400", dot: "bg-green-500" },
  blue: { border: "border-blue-200", hoverBorder: "hover:border-blue-400", dot: "bg-blue-500" },
  purple: { border: "border-purple-200", hoverBorder: "hover:border-purple-400", dot: "bg-purple-500" },
  orange: { border: "border-orange-200", hoverBorder: "hover:border-orange-400", dot: "bg-orange-500" },
  red: { border: "border-red-200", hoverBorder: "hover:border-red-400", dot: "bg-red-500" },
  teal: { border: "border-teal-200", hoverBorder: "hover:border-teal-400", dot: "bg-teal-500" },
  indigo: { border: "border-indigo-200", hoverBorder: "hover:border-indigo-400", dot: "bg-indigo-500" },
};

export default function Home() {
  const { showAlert } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dates, setDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);

  // Refs
  const genderDropdownRef = useRef(null);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselImages = ["/main1.webp", "/main2.JPG", "/main3.jpeg"];

  // Payment flow states
  const [reservation, setReservation] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    whatsapp: "",
    modeOfContact: "",
    modeId: "",
  });

  // Consultation modes state
  const [consultationModes, setConsultationModes] = useState([]);

  // Track page view and scroll on component mount
  useEffect(() => {
    // Track page view
    trackPageView('Book Consultation - Home', '/');

    // Track scroll depth
    let scrollThresholds = [25, 50, 75, 90];
    let trackedThresholds = new Set();

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      scrollThresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
          trackedThresholds.add(threshold);
          trackScrollDepth(threshold);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dates on component mount
  useEffect(() => {
    fetchDates();
  }, []);

  // Fetch consultation modes on mount
  useEffect(() => {
    const fetchConsultationModes = async () => {
      try {
        const response = await fetch('/api/consultation-modes');
        const data = await response.json();
        if (data.success && data.modes.length > 0) {
          setConsultationModes(data.modes);
          // Auto-select first mode
          setFormData(prev => ({
            ...prev,
            modeOfContact: data.modes[0].name,
            modeId: data.modes[0]._id,
          }));
        }
      } catch (error) {
        console.error("Error fetching consultation modes:", error);
      }
    };
    fetchConsultationModes();
  }, []);

  // Fetch clinics for homepage
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setClinicsLoading(true);
        const response = await fetch('/api/clinics?category=myclinic');
        const data = await response.json();
        if (data.success && data.clinics.length > 0) {
          setClinics(data.clinics.map(clinic => ({
            name: clinic.name,
            href: clinic.href,
            colorScheme: clinic.colorScheme || 'blue',
          })));
        }
      } catch (error) {
        console.error('Failed to fetch clinics:', error);
      } finally {
        setClinicsLoading(false);
      }
    };
    fetchClinics();
  }, []);

  // Fetch slots when date or mode changes (only if slots are visible)
  useEffect(() => {
    if (selectedDate && showSlots && formData.modeId) {
      fetchSlots();
    }
  }, [selectedDate, formData.modeId, showSlots]);

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Close gender dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target)) {
        setShowGenderDropdown(false);
      }
    };

    if (showGenderDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGenderDropdown]);

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `/api/available-slots?date=${new Date().toISOString().split("T")[0]}&mode=online`
      );
      const data = await response.json();
      if (data.success) {
        setDates(data.dates);
        if (data.dates.length > 0) {
          setSelectedDate(data.dates[0].date);
        }
      }
    } catch (error) {
      console.error("Error fetching dates:", error);
    }
  };

  const fetchSlots = async () => {
    if (!selectedDate || !formData.modeId) return;

    setIsLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/available-slots?date=${selectedDate}&modeId=${formData.modeId}`
      );
      const data = await response.json();
      if (data.success) {
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Check if all required fields are filled
  const areRequiredFieldsFilled = () => {
    return (
      formData.name.trim() !== "" &&
      formData.age.trim() !== "" &&
      formData.gender.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.whatsapp.trim() !== "" &&
      formData.modeOfContact.trim() !== "" &&
      formData.modeId !== ""
    );
  };

  // Check if selected date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // Handle View Slots button click
  const handleViewSlots = async () => {
    if (areRequiredFieldsFilled()) {
      setShowSlots(true);
      trackButtonClick('View Slots', 'view_slots_button');
      trackAddToCart('View Available Slots', 'view_slots_button', 150);

      // Track slot view in database
      try {
        console.log('📊 Tracking slot view...');
        const response = await fetch('/api/track-slot-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            email: formData.email,
            whatsapp: formData.whatsapp,
            modeOfContact: formData.modeOfContact,
            pageName: 'Book Consultation - Home',
            pageSlug: 'home',
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
          }),
        });

        const result = await response.json();
        if (result.success) {
          console.log('✅ Slot view tracked successfully:', result.id);
        } else {
          console.error('❌ Failed to track slot view:', result.error);
        }
      } catch (error) {
        console.error('❌ Error tracking slot view:', error);
        // Don't block the user flow if tracking fails
      }

      // Fetch slots if date is already selected (and not today)
      if (selectedDate && !isToday(selectedDate)) {
        fetchSlots();
      }
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowPayment(false);
            setReservation(null);
            showAlert({
              title: "Reservation Expired",
              message: "Your reservation has expired. Please try booking again.",
              type: "warning"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showAlert]);

  // Load Razorpay payment button when payment section shows
  useEffect(() => {
    if (showPayment && reservation) {
      const container = document.getElementById("razorpay-button-container");
      if (container) {
        // Clear any existing content
        container.innerHTML = "";

        // Create form element
        const form = document.createElement("form");

        // Create script element - exact format as Razorpay provides
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/payment-button.js";
        script.setAttribute("data-payment_button_id", "pl_S32iD93nAACoNH");
        script.async = true;

        // Append script to form, form to container
        form.appendChild(script);
        container.appendChild(form);
      }
    }
  }, [showPayment, reservation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.gender) {
      await showAlert({
        title: "Missing Information",
        message: "Please select your gender",
        type: "warning"
      });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      await showAlert({
        title: "Missing Information",
        message: "Please select a date and time slot",
        type: "warning"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Track form submission and add to cart
      trackFormSubmit('Booking Form', {
        mode: formData.modeOfContact,
        date: selectedDate,
        time: selectedSlot.label
      });

      // Step 1: Reserve the slot
      const response = await fetch("/api/reserve-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
          time: selectedSlot.time,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReservation(data.reservation);
        setTimeRemaining(data.reservation.timeRemaining);
        setShowPayment(true);

        // Store reservation ID and booking data for payment callback
        sessionStorage.setItem("reservationId", data.reservation.id);
        sessionStorage.setItem(
          "pendingBooking",
          JSON.stringify({
            name: formData.name,
            date: selectedDate,
            time: selectedSlot.label,
            mode: formData.modeOfContact,
          })
        );
      } else {
        await showAlert({
          title: "Booking Failed",
          message: data.error || "Failed to reserve slot. Please try again.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error reserving slot:", error);
      await showAlert({
        title: "Booking Failed",
        message: "Failed to reserve slot. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-beige-50 to-white">
      {/* Hero Section with Carousel */}
      <section className="relative w-full overflow-hidden bg-gray-100">
        {/* Carousel Container */}
        <div className="relative w-full pt-20 md:pt-24">
          <div className="relative w-full overflow-hidden">
            {/* Carousel Images - Responsive Height */}
            <div className="relative w-full h-[150px] sm:h-[250px] md:h-[350px] lg:h-[500px] xl:h-[600px]">
              {carouselImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                    index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`My Clinic - Slide ${index + 1}`}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-[center_30%] sm:object-[center_35%]"
                    quality={90}
                    unoptimized
                  />
                </div>
              ))}
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    trackButtonClick(`Carousel Slide ${index + 1}`, 'hero_carousel');
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-primary-600 w-8"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Credentials - Compact */}
        <div className="bg-white py-3">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm md:text-base">
              <h2 className="font-bold text-primary-600 whitespace-nowrap">
                Dr. Yuvaraj T
              </h2>
              <span className="text-primary-700">|</span>
              <span className="text-primary-800 font-semibold">
                Consultant GI & HPB Surgeon
              </span>
              <span className="text-primary-700 text-xs md:text-sm">|</span>
              <span className="text-primary-700 text-xs md:text-sm">
                MCh Surgical Gastroenterology (KEMH, Mumbai)
              </span>
              <span className="text-primary-700 text-xs md:text-sm">|</span>
              <span className="text-primary-700 text-xs md:text-sm">
                FMAS, FACRSI
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Scrolling Disease Icons */}
      <section className="bg-white overflow-hidden py-0 lg:py-2">
        <div className="relative">
          <div className="flex animate-scroll items-center">
            {/* First set of icons */}
            {[2, 3, 4, 5, 6, 7, 8].map((num) => (
              <div
                key={`first-${num}`}
                className="flex-shrink-0 w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[100px] lg:h-[100px] mx-3 md:mx-4"
              >
                <Image
                  src={`/All diseases/${num}.svg`}
                  alt={`Disease ${num}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {[2, 3, 4, 5, 6, 7, 8].map((num) => (
              <div
                key={`second-${num}`}
                className="flex-shrink-0 w-[60px] h-[60px] md:w-[80px] md:h-[80px] lg:w-[100px] lg:h-[100px] mx-3 md:mx-4"
              >
                <Image
                  src={`/All diseases/${num}.svg`}
                  alt={`Disease ${num}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find Us in Mumbai Section */}
      <section className="bg-white pt-4">
        <div className="container mx-auto px-3 md:px-4">
          <div className="text-center">
            <h2 className="text-base md:text-lg font-bold text-primary-600 mb-2">
              Find Us in Mumbai
            </h2>
            <p className="text-sm md:text-base text-primary-800 mb-1">
              📍 SRV Hospital, Tilak Nagar, Chembur.
            </p>
            <a
              href="https://maps.google.com/?q=SRV+Hospital+Tilak+Nagar+Chembur"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick('View Location', 'find_us_section')}
              className="inline-block text-sm md:text-base text-primary-600 hover:text-primary-700 font-semibold underline"
            >
              View Location
            </a>

            {/* Consultation Information */}
            <div className="mt-2 pt-2  border-primary-100 max-w-2xl mx-auto">
              <p className="text-xs md:text-sm text-primary-800 mb-1">
                <span className="font-semibold">Online Consultations:</span> Available, check available slots below
              </p>
              <p className="text-xs md:text-sm text-primary-800 mb-1">
                <span className="font-semibold">Consultation fee:</span> Rs 1000/- Both Online and In-clinic
              </p>
              <p className="text-xs md:text-sm text-primary-700">
                <span className="font-semibold">Slot Booking Fee:</span> Rs 150/- Adjusted against consultation fee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Clinics Section */}
      {clinics.length > 0 && (
        <section className="bg-beige-50 py-6 md:py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-lg md:text-xl font-bold text-primary-600 text-center mb-4">
              Our Specialized Clinics
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {clinics.map((clinic) => {
                const colors = colorMap[clinic.colorScheme] || colorMap.blue;
                return (
                  <Link
                    key={clinic.href}
                    href={clinic.href}
                    onClick={() => trackButtonClick(clinic.name, 'home_clinic_button')}
                    className={`flex items-center gap-2 bg-white border-2 ${colors.border} ${colors.hoverBorder} text-primary-800 font-medium px-4 py-2 rounded-lg transition-all hover:shadow-md`}
                  >
                    <span className={`w-3 h-3 rounded-full ${colors.dot}`}></span>
                    {clinic.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {clinicsLoading && (
        <section className="bg-beige-50 py-6 md:py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-pulse flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 h-10 w-40 rounded-lg"></div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Booking Form Section */}
      <section id="booking" className="container mx-auto px-4 md:px-6 py-4 md:py-12 lg:py-16">
        <div className="max-w-4xl lg:max-w-5xl mx-auto">
          {/* Book Your Slot Header */}
          <div className="text-center mb-3 md:mb-6">
            <h2 className="text-xl md:text-3xl font-bold text-primary-600 mb-1 md:mb-2">
              Book Your Slot
            </h2>
            <p className="text-base md:text-xl text-primary-700 font-semibold">
              Secure your consultation slot & mode of consultation at ₹150/-
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 animate-slide-up">

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-primary-900 mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Age and Gender Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* Age Field */}
                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-semibold text-primary-900 mb-2"
                  >
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
                    className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    placeholder="Your age"
                  />
                </div>

                {/* Gender Field - Custom Dropdown */}
                <div className="relative" ref={genderDropdownRef}>
                  <label className="block text-sm font-semibold text-primary-900 mb-2">
                    Gender *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                    className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all bg-white text-left flex items-center justify-between"
                  >
                    <span className={formData.gender ? "text-primary-900" : "text-gray-400"}>
                      {formData.gender || "Select Gender"}
                    </span>
                    <svg
                      className={`w-5 h-5 text-primary-600 transition-transform ${showGenderDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showGenderDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-primary-200 rounded-lg shadow-xl overflow-hidden">
                      {["Male", "Female", "Other"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, gender: option }));
                            setShowGenderDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-primary-50 transition-colors ${
                            formData.gender === option ? "bg-primary-100 text-primary-900 font-semibold" : "text-primary-700"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-primary-900 mb-2"
                >
                  Email ID *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* WhatsApp Number Field */}
              <div>
                <label
                  htmlFor="whatsapp"
                  className="block text-sm font-semibold text-primary-900 mb-2"
                >
                  WhatsApp Number *
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 py-2 bg-gray-100 border-2 border-primary-200 rounded-lg text-primary-700 font-semibold text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="flex-1 min-w-0 px-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    placeholder="XXXXX XXXXX"
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>
              </div>

              {/* Mode of Consultation Field */}
              <div>
                <label className="block text-sm font-semibold text-primary-900 mb-2">
                  Mode of Consultation *
                </label>
                <div className="flex flex-col gap-3">
                  {consultationModes.map((mode) => (
                    <button
                      key={mode._id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          modeOfContact: mode.name,
                          modeId: mode._id,
                        }));
                        setSelectedSlot(null);
                        setShowSlots(false);
                      }}
                      className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 border-2 ${
                        formData.modeId === mode._id
                          ? "text-white shadow-md"
                          : "bg-white text-primary-700 border-primary-200 hover:border-primary-400"
                      }`}
                      style={formData.modeId === mode._id ? {
                        backgroundColor: mode.color || '#059669',
                        borderColor: mode.color || '#059669',
                      } : {}}
                    >
                      <div className="flex items-center gap-2">
                        {mode.name === "online" ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        )}
                        <span>{mode.displayName || mode.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Slots Button */}
              {!showSlots && (
                <div>
                  <button
                    type="button"
                    onClick={handleViewSlots}
                    disabled={!areRequiredFieldsFilled()}
                    className={`w-full py-3 px-6 rounded-lg text-sm md:text-base font-bold transition-all duration-300 border-2 flex items-center justify-center gap-2 ${
                      areRequiredFieldsFilled()
                        ? "bg-accent-500 hover:bg-accent-600 text-white border-accent-500 shadow-md hover:shadow-lg transform hover:scale-105"
                        : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>View Available Slots</span>
                  </button>
                  {!areRequiredFieldsFilled() && (
                    <p className="text-xs text-primary-600 mt-2 text-center">
                      Please fill in all required fields above to view available slots
                    </p>
                  )}
                </div>
              )}

              {/* Date & Time Selection - Only show when slots are visible */}
              {showSlots && (
              <>
              <div>
                <label className="block text-sm font-semibold text-primary-900 mb-2">
                  Select Date & Time *
                </label>
                <p className="text-xs text-primary-600 mb-2">Choose your preferred date:</p>
                {/* Horizontal scrollable on mobile, grid on larger screens */}
                <div className="overflow-x-auto pb-2 -mx-1">
                  <div className="flex md:grid md:grid-cols-4 lg:grid-cols-7 gap-2 px-1 min-w-max md:min-w-0">
                    {dates.map((dateOption) => (
                      <button
                        key={dateOption.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateOption.date);
                          setSelectedSlot(null);
                        }}
                        className={`flex-shrink-0 p-2 md:p-3 rounded-lg text-xs md:text-sm font-semibold transition-all border-2 min-w-[100px] md:min-w-0 ${
                          selectedDate === dateOption.date
                            ? "bg-primary-600 text-white border-primary-600 shadow-md"
                            : "bg-white text-primary-700 border-primary-200 hover:border-primary-400"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs opacity-75">
                            {dateOption.isToday ? "Today" : dateOption.label.split(",")[0]}
                          </div>
                          <div className="font-bold">
                            {dateOption.label.split(",")[1]?.trim() || dateOption.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slot Selection or Today Message */}
              <div>
                {isToday(selectedDate) ? (
                  /* Special message for today */
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 md:p-8">
                    <div className="text-center mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-primary-900 mb-2">
                        No vacant slots for the day
                      </h3>
                      <p className="text-sm md:text-base text-primary-700 mb-4">
                        Reach out on WhatsApp to see if we can accommodate you
                      </p>
                    </div>

                    {/* WhatsApp CTA Button */}
                    <a
                      href={`https://wa.me/917021227203?text=${encodeURIComponent("Hi! I want to book a consultation with Dr Yuvaraj for today")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackWhatsAppClick('today_booking_request')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 md:py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 mb-4"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Request Appointment on WhatsApp
                    </a>

                    <p className="text-center text-sm text-primary-600 font-medium">
                      Walk-ins are available
                    </p>
                  </div>
                ) : (
                  /* Regular time slot selection */
                  <>
                    <p className="text-xs text-primary-600 mb-2">Choose your preferred time:</p>

                    {isLoadingSlots ? (
                      <div className="text-center py-6 md:py-8">
                        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-4 border-primary-600 mx-auto"></div>
                        <p className="mt-3 md:mt-4 text-primary-700 text-sm">Loading slots...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => {
                              setSelectedSlot(slot);
                            }}
                            className={`p-2 md:p-3 rounded-lg text-xs md:text-sm font-semibold transition-all border-2 ${
                              !slot.available
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : selectedSlot?.time === slot.time
                                ? "bg-accent-500 text-white border-accent-500 shadow-md"
                                : "bg-white text-primary-700 border-primary-200 hover:border-accent-400 hover:bg-accent-50"
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {!isLoadingSlots && availableSlots.length === 0 && (
                      <div className="text-center py-6 md:py-8 text-primary-600 text-sm">
                        No slots available for this date and mode.
                      </div>
                    )}
                  </>
                )}
              </div>
              </>
              )}

              {/* Submit Button or Payment Section */}
              {!showPayment ? (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSlot}
                    onClick={() => {
                      if (!isSubmitting && selectedSlot) {
                        trackButtonClick('Book Your Slot Now', 'booking_form_submit');
                      }
                    }}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-sm md:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "BOOK YOUR SLOT NOW"
                    )}
                  </button>

                  {/* Terms of Booking */}
                  <div className="mt-4 md:mt-6 bg-beige-50 rounded-2xl p-4 md:p-6 border-2 border-primary-200">
                    <h3 className="text-base md:text-lg font-bold text-primary-900 mb-3 md:mb-4">
                      Terms of Booking:
                    </h3>
                    <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-primary-800">
                      <p className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1 flex-shrink-0">•</span>
                        <span>
                          This payment is a <strong>non-refundable commitment fee</strong>. The amount paid now will be fully adjusted against your final consultation fee at the time of the visit.
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1 flex-shrink-0">•</span>
                        <span>
                          <strong>Rescheduling:</strong> We understand plans change. You can request a reschedule via WhatsApp at least 2 hours before your slot.
                        </span>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Countdown Timer */}
                  <div className="bg-accent-50 border-2 border-accent-300 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-primary-900 mb-2">
                      Slot Reserved - Complete Payment
                    </p>
                    <div className="flex items-center justify-center gap-2 text-accent-600">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-2xl font-bold">
                        {Math.floor(timeRemaining / 60)}:
                        {String(timeRemaining % 60).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-xs text-primary-600 mt-2">
                      Time remaining to complete payment
                    </p>
                  </div>

                  {/* Razorpay Payment Button */}
                  <div
                    id="razorpay-button-container"
                    className="w-full flex justify-center"
                  >
                    {/* Payment button will be injected here by useEffect */}
                  </div>

                  <p className="text-center text-xs text-primary-600 mt-4">
                    Your slot will be released if payment is not completed within the time limit
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Additional Information */}
          <div className="mt-4 md:mt-8 text-center text-primary-600">
            <p className="text-xs md:text-sm">
              Need help?{" "}
              <a
                href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20help%20with%20my%20booking%20on%20CuraGo."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick('need_help_section')}
                className="text-primary-600 font-semibold hover:text-primary-700 underline"
              >
                Contact us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CuraGo Advantage Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-gradient-to-br from-beige-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-4 md:mb-6">
            The CuraGo Advantage
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-primary-200">
            <h3 className="text-lg md:text-xl font-bold text-primary-900 mb-3 md:mb-4">
              Book Your Slot for a Hassle-Free Experience
            </h3>
            <p className="text-sm md:text-base text-primary-700 leading-relaxed">
              Skip the crowded hospital lounge. By booking through CuraGo, you secure a dedicated time slot, ensuring zero waiting time and a direct, focused session with Dr. Yuvaraj.
            </p>
          </div>
        </div>
      </section>

      {/* Professional Consultation Fees Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 lg:p-12 border-2 border-primary-200">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-6 lg:mb-8 text-center">
              Professional Consultation Fees
            </h2>

            {/* Fees Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary-600 text-white">
                    <th className="py-3 px-4 text-left font-semibold text-sm md:text-base border border-primary-700">Service Type</th>
                    <th className="py-3 px-4 text-center font-semibold text-sm md:text-base border border-primary-700">New Consultation</th>
                    <th className="py-3 px-4 text-center font-semibold text-sm md:text-base border border-primary-700">Follow-up Visit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-beige-50">
                    <td className="py-3 px-4 font-semibold text-primary-900 text-sm md:text-base border border-primary-200">In-Clinic (Offline)</td>
                    <td className="py-3 px-4 text-center text-primary-800 font-bold text-base md:text-lg border border-primary-200">₹1,000</td>
                    <td className="py-3 px-4 text-center text-primary-800 font-bold text-base md:text-lg border border-primary-200">₹800</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-semibold text-primary-900 text-sm md:text-base border border-primary-200">Video (Online)</td>
                    <td className="py-3 px-4 text-center text-primary-800 font-bold text-base md:text-lg border border-primary-200">₹1,000</td>
                    <td className="py-3 px-4 text-center text-primary-800 font-bold text-base md:text-lg border border-primary-200">₹800</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps Location Section */}
      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-beige-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-4 lg:mb-6">
              Visit Our Clinic
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-primary-700 mb-4 lg:mb-6">
              📍 SRV Hospital, Tilak Nagar, Chembur, Mumbai
            </p>
            <a
              href="https://maps.google.com/?q=SRV+Hospital+Tilak+Nagar+Chembur"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackButtonClick('View on Google Maps', 'clinic_location_section')}
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              View on Google Maps
            </a>
          </div>

          {/* Map Image */}
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.234567890123!2d72.8947!3d19.0596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDAzJzM0LjYiTiA3MsKwNTMnNDAuOSJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Sticky WhatsApp Button */}
      <a
        href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20help%20with%20my%20booking%20on%20CuraGo."
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('sticky_button')}
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
        aria-label="Contact on WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Chat with us
        </span>
      </a>

      {/* FAQ Chatbot */}
      <FAQChatbot currentPage="home" />

      {/* Footer */}
      <Footer />
    </div>
  );
}
