"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMyClinicDropdown, setShowMyClinicDropdown] = useState(false);
  const [showMobileMyClinic, setShowMobileMyClinic] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [clinicsLoading, setClinicsLoading] = useState(true);
  const myClinicRef = useRef(null);

  // Fetch clinics from API
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setClinicsLoading(true);
        const response = await fetch('/api/clinics?navbar=true');
        const data = await response.json();
        if (data.success && data.clinics.length > 0) {
          setClinics(data.clinics.map(clinic => ({
            name: clinic.name,
            href: clinic.href,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch clinics for navbar:', error);
      } finally {
        setClinicsLoading(false);
      }
    };
    fetchClinics();
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "My Clinic", href: "/myclinic", hasDropdown: true },
    { name: "GBSI", href: "/gbsi" },
    { name: "Priority Connect", href: "/priority-connect" },
    { name: "Blog", href: "/blog" },
    { name: "Forum", href: "/#community" },
    { name: "About", href: "/about" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (myClinicRef.current && !myClinicRef.current.contains(event.target)) {
        setShowMyClinicDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-beige-300/90 backdrop-blur-xl border-b border-primary-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="Dr. Yuvaraj T Logo"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-lg font-bold text-primary-900">Dr. Yuvaraj T</div>
              <div className="text-xs text-primary-700">Surgical Gastroenterologist</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.hasDropdown ? (
                <div key={link.name} className="relative" ref={myClinicRef}>
                  <button
                    onClick={() => setShowMyClinicDropdown(!showMyClinicDropdown)}
                    className="px-4 py-2 text-primary-800 hover:text-primary-600 font-medium rounded-lg hover:bg-accent-100 transition-all duration-300 flex items-center gap-1"
                  >
                    {link.name}
                    <svg
                      className={`w-4 h-4 transition-transform ${showMyClinicDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showMyClinicDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-primary-200 rounded-lg shadow-xl py-2 min-w-[200px] z-50">
                      <Link
                        href={link.href}
                        onClick={() => setShowMyClinicDropdown(false)}
                        className="block px-4 py-2 text-primary-800 hover:bg-accent-100 font-medium"
                      >
                        All Clinics
                      </Link>
                      {clinics.length > 0 && (
                        <>
                          <div className="border-t border-primary-100 my-1"></div>
                          {clinics.map((clinic) => (
                            <Link
                              key={clinic.href}
                              href={clinic.href}
                              onClick={() => setShowMyClinicDropdown(false)}
                              className="block px-4 py-2 text-primary-700 hover:bg-accent-100 hover:text-primary-900 transition-colors"
                            >
                              {clinic.name}
                            </Link>
                          ))}
                        </>
                      )}
                      {clinicsLoading && (
                        <div className="px-4 py-2 text-primary-500 text-sm">Loading...</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-primary-800 hover:text-primary-600 font-medium rounded-lg hover:bg-accent-100 transition-all duration-300"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20to%20book%20an%20online%20consultation%20with%20Dr.%20Yuvaraj%2C%20please%20guide%20me"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Chat Now
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-primary-800 hover:bg-accent-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary-200">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.hasDropdown ? (
                  <div key={link.name}>
                    <button
                      onClick={() => setShowMobileMyClinic(!showMobileMyClinic)}
                      className="w-full px-4 py-3 text-primary-800 hover:text-primary-600 hover:bg-accent-100 rounded-lg font-medium transition-all duration-300 flex items-center justify-between"
                    >
                      {link.name}
                      <svg
                        className={`w-4 h-4 transition-transform ${showMobileMyClinic ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showMobileMyClinic && (
                      <div className="ml-4 mt-1 space-y-1">
                        <Link
                          href={link.href}
                          onClick={() => { setIsOpen(false); setShowMobileMyClinic(false); }}
                          className="block px-4 py-2 text-primary-700 hover:bg-accent-100 rounded-lg"
                        >
                          All Clinics
                        </Link>
                        {clinics.map((clinic) => (
                          <Link
                            key={clinic.href}
                            href={clinic.href}
                            onClick={() => { setIsOpen(false); setShowMobileMyClinic(false); }}
                            className="block px-4 py-2 text-primary-600 hover:bg-accent-100 rounded-lg"
                          >
                            {clinic.name}
                          </Link>
                        ))}
                        {clinicsLoading && (
                          <div className="px-4 py-2 text-primary-500 text-sm">Loading...</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-primary-800 hover:text-primary-600 hover:bg-accent-100 rounded-lg font-medium transition-all duration-300"
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <a
                href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20to%20book%20an%20online%20consultation%20with%20Dr.%20Yuvaraj%2C%20please%20guide%20me"
                className="mx-4 mt-2 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Chat Now
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
