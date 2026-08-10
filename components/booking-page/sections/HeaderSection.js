"use client";

import { useState, useEffect, useMemo } from "react";
import { trackButtonClick } from "@/lib/tracking";

// Section navigation metadata - matches SECTION_TYPES in page builder
const SECTION_NAV_INFO = {
  hero_carousel: { navName: "Home", navGroup: null },
  banner_image: { navName: "Home", navGroup: null },
  benefits_list: { navName: "Benefits", navGroup: "About" },
  doctor_profile: { navName: "About", navGroup: "About" },
  testimonials: { navName: "Testimonials", navGroup: "About" },
  faqs: { navName: "FAQs", navGroup: "Info" },
  location_map: { navName: "Location", navGroup: "Info" },
  disease_icons_scroll: { navName: "Services", navGroup: "Services" },
  custom_text: { navName: "Info", navGroup: "Services" },
  cta_button: { navName: null, navGroup: "hidden" },
  booking_form: { navName: "Book Now", navGroup: null },
  clinic_info: { navName: "Clinic", navGroup: "Info" },
  professional_fees: { navName: "Fees", navGroup: "Info" },
  footer: { navName: null, navGroup: "hidden" },
  header: { navName: null, navGroup: "hidden" },
  whatsapp_sticky: { navName: null, navGroup: "hidden" },
  book_now_sticky: { navName: null, navGroup: "hidden" },
  faq_chatbot: { navName: null, navGroup: "hidden" },
};

export default function HeaderSection({
  sectionId,
  logoUrl = "",
  logoText = "",
  showNavigation = true,
  navLinks = [
    { text: "Home", url: "#" },
    { text: "About", url: "#about" },
    { text: "Book Now", url: "#booking" },
  ],
  navMode = "auto",
  autoNavConfig = { useSmartGroups: true, excludeSections: [], customLabels: {} },
  pageSections = [],
  extraNavLinks = [],
  ctaButton = { text: "Book Appointment", url: "#booking_form", show: true },
  backgroundColor = "white",
  sticky = true,
  doctor = null,
  trackingContext = { pageSlug: "page" },
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sticky]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".nav-dropdown")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Build navigation items based on mode
  const navItems = useMemo(() => {
    // Cross-page links (e.g. Resources/Blog) that live outside the section list.
    // These are real routes, not #anchors, so handleNavClick lets them navigate.
    const extraItems = (extraNavLinks || []).map((link) => ({
      type: "link",
      text: link.text,
      url: link.url,
    }));

    // Collapse repeated labels — e.g. a hero_carousel AND a banner_image both map
    // to "Home", which would otherwise show "Home" twice in the navbar.
    const dedupeByLabel = (arr) => {
      const seen = new Set();
      return arr.filter((it) => {
        const key = (it.text || it.label || "").trim().toLowerCase();
        if (!key) return true;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    if (navMode === "manual") {
      return dedupeByLabel([
        ...navLinks.map((link) => ({
          type: "link",
          text: link.text,
          url: link.url,
        })),
        ...extraItems,
      ]);
    }

    // Auto mode: build from pageSections
    const { useSmartGroups = true, excludeSections = [], customLabels = {} } = autoNavConfig;

    // Filter visible sections and exclude hidden ones
    const visibleSections = pageSections.filter((section) => {
      if (section.visible === false) return false;
      if (excludeSections.includes(section.type)) return false;
      const navInfo = SECTION_NAV_INFO[section.type];
      if (!navInfo || navInfo.navGroup === "hidden" || !navInfo.navName) return false;
      return true;
    });

    if (!useSmartGroups) {
      // Simple flat list
      return dedupeByLabel([
        ...visibleSections.map((section) => {
          const navInfo = SECTION_NAV_INFO[section.type];
          return {
            type: "link",
            text: customLabels[section.type] || navInfo.navName,
            url: `#${section.type}`,
          };
        }),
        ...extraItems,
      ]);
    }

    // Smart grouping
    const groups = {};
    const topLevel = [];

    visibleSections.forEach((section) => {
      const navInfo = SECTION_NAV_INFO[section.type];
      const label = customLabels[section.type] || navInfo.navName;

      if (!navInfo.navGroup) {
        // Top-level item
        topLevel.push({
          type: "link",
          text: label,
          url: `#${section.type}`,
          sectionType: section.type,
        });
      } else {
        // Grouped item
        if (!groups[navInfo.navGroup]) {
          groups[navInfo.navGroup] = [];
        }
        groups[navInfo.navGroup].push({
          type: "link",
          text: label,
          url: `#${section.type}`,
          sectionType: section.type,
        });
      }
    });

    // Build final nav items
    const items = [];

    // Add first top-level item (usually Home)
    const homeItem = topLevel.find(
      (item) => item.sectionType === "hero_carousel" || item.sectionType === "banner_image"
    );
    if (homeItem) {
      items.push(homeItem);
    }

    // Add groups (convert single-item groups to links)
    const groupOrder = ["About", "Services", "Info"];
    groupOrder.forEach((groupName) => {
      const groupItems = groups[groupName];
      if (!groupItems || groupItems.length === 0) return;

      if (groupItems.length === 1) {
        // Single item - show as top-level link
        items.push(groupItems[0]);
      } else {
        // Multiple items - show as dropdown
        items.push({
          type: "dropdown",
          label: groupName,
          items: groupItems,
        });
      }
    });

    // Add remaining top-level items (like Book Now)
    topLevel.forEach((item) => {
      if (item !== homeItem) {
        items.push(item);
      }
    });

    return dedupeByLabel([...items, ...extraItems]);
  }, [navMode, navLinks, pageSections, autoNavConfig, extraNavLinks]);

  // Smooth scroll handler
  const handleNavClick = (e, url) => {
    if (url.startsWith("#")) {
      e.preventDefault();
      const targetId = url.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        const headerHeight = sticky ? 80 : 0;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: "smooth",
        });
      }
      setMobileMenuOpen(false);
      setOpenDropdown(null);
    }
  };

  // Use doctor data for logo if not provided
  const displayLogo = logoUrl || doctor?.profileImage;
  const displayLogoText = logoText || doctor?.displayName || doctor?.name || "Doctor";

  const bgClass = {
    white: isScrolled ? "bg-white shadow-md" : "bg-white",
    primary: isScrolled ? "bg-primary-700 shadow-md" : "bg-primary-600",
    transparent: isScrolled ? "bg-white shadow-md" : "bg-transparent",
  }[backgroundColor] || "bg-white";

  const textClass = {
    white: "text-gray-900",
    primary: "text-white",
    transparent: isScrolled ? "text-gray-900" : "text-white",
  }[backgroundColor] || "text-gray-900";

  const linkHoverClass = {
    white: "hover:text-primary-600",
    primary: "hover:text-primary-200",
    transparent: isScrolled ? "hover:text-primary-600" : "hover:text-primary-200",
  }[backgroundColor] || "hover:text-primary-600";

  const dropdownBgClass = {
    white: "bg-white border border-gray-200",
    primary: "bg-primary-700 border border-primary-600",
    transparent: isScrolled ? "bg-white border border-gray-200" : "bg-white/95 backdrop-blur border border-gray-200",
  }[backgroundColor] || "bg-white border border-gray-200";

  const dropdownItemHoverClass = {
    white: "hover:bg-gray-100",
    primary: "hover:bg-primary-600",
    transparent: isScrolled ? "hover:bg-gray-100" : "hover:bg-gray-100",
  }[backgroundColor] || "hover:bg-gray-100";

  return (
    <>
      <header
        id={sectionId}
        className={`${sticky ? "fixed top-0 left-0 right-0 z-50" : "relative"} ${bgClass} transition-all duration-300`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a
              href="#"
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                trackButtonClick("Logo", `${trackingContext.pageSlug}_header`);
              }}
            >
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt={displayLogoText}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
                />
              ) : (
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary-100 flex items-center justify-center ${textClass}`}>
                  <span className="text-lg font-bold">{displayLogoText.charAt(0)}</span>
                </div>
              )}
              <span className={`text-base sm:text-lg md:text-xl font-bold ${textClass} block truncate max-w-[150px] sm:max-w-none`}>
                {displayLogoText}
              </span>
            </a>

            {/* Desktop Navigation */}
            {showNavigation && navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item, index) =>
                  item.type === "dropdown" ? (
                    <div key={index} className="relative nav-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === item.label ? null : item.label);
                        }}
                        className={`flex items-center gap-1 ${textClass} ${linkHoverClass} font-medium transition-colors`}
                      >
                        {item.label}
                        <svg
                          className={`w-4 h-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.label && (
                        <div className={`absolute top-full left-0 mt-2 py-2 min-w-[160px] rounded-lg shadow-lg ${dropdownBgClass}`}>
                          {item.items.map((subItem, subIndex) => (
                            <a
                              key={subIndex}
                              href={subItem.url}
                              onClick={(e) => {
                                handleNavClick(e, subItem.url);
                                trackButtonClick(subItem.text, `${trackingContext.pageSlug}_header_nav`);
                              }}
                              className={`block px-4 py-2 ${textClass} ${dropdownItemHoverClass} font-medium transition-colors`}
                            >
                              {subItem.text}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      key={index}
                      href={item.url}
                      onClick={(e) => {
                        handleNavClick(e, item.url);
                        trackButtonClick(item.text, `${trackingContext.pageSlug}_header_nav`);
                      }}
                      className={`${textClass} ${linkHoverClass} font-medium transition-colors`}
                    >
                      {item.text}
                    </a>
                  )
                )}
              </nav>
            )}

            {/* CTA Button & Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              {ctaButton.show && (
                <a
                  href={ctaButton.url}
                  onClick={(e) => {
                    handleNavClick(e, ctaButton.url);
                    trackButtonClick(ctaButton.text, `${trackingContext.pageSlug}_header_cta`);
                  }}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-full transition-colors"
                >
                  {ctaButton.text}
                </a>
              )}

              {/* Mobile Menu Button */}
              {showNavigation && navItems.length > 0 && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`md:hidden p-2 ${textClass}`}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {showNavigation && mobileMenuOpen && navItems.length > 0 && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-2">
                {navItems.map((item, index) =>
                  item.type === "dropdown" ? (
                    <div key={index}>
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className={`w-full flex items-center justify-between ${textClass} ${linkHoverClass} font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors`}
                      >
                        {item.label}
                        <svg
                          className={`w-4 h-4 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openDropdown === item.label && (
                        <div className="pl-4 mt-1 space-y-1">
                          {item.items.map((subItem, subIndex) => (
                            <a
                              key={subIndex}
                              href={subItem.url}
                              onClick={(e) => {
                                handleNavClick(e, subItem.url);
                                trackButtonClick(subItem.text, `${trackingContext.pageSlug}_header_nav_mobile`);
                              }}
                              className={`block ${textClass} ${linkHoverClass} font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors`}
                            >
                              {subItem.text}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      key={index}
                      href={item.url}
                      onClick={(e) => {
                        handleNavClick(e, item.url);
                        trackButtonClick(item.text, `${trackingContext.pageSlug}_header_nav_mobile`);
                      }}
                      className={`${textClass} ${linkHoverClass} font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors`}
                    >
                      {item.text}
                    </a>
                  )
                )}
                {ctaButton.show && (
                  <a
                    href={ctaButton.url}
                    onClick={(e) => {
                      handleNavClick(e, ctaButton.url);
                      trackButtonClick(ctaButton.text, `${trackingContext.pageSlug}_header_cta_mobile`);
                    }}
                    className="mt-2 text-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-full transition-colors"
                  >
                    {ctaButton.text}
                  </a>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
