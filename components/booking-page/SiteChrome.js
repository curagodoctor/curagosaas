'use client';

import HeaderSection from './sections/HeaderSection';
import FooterSection from './sections/FooterSection';

// Wraps page content with the doctor's SHARED site header + footer (from the home
// page) so blog pages match the rest of the site's branding, nav, and theme.
export default function SiteChrome({ header, footer, navSections = [], extraNavLinks = [], doctor = null, themeId = 'default', children }) {
  return (
    <div className="min-h-screen flex flex-col" data-theme={themeId}>
      <HeaderSection
        {...(header?.config || {})}
        sectionId="header"
        pageSections={navSections}
        extraNavLinks={extraNavLinks}
        doctor={doctor}
      />
      <main className="flex-1">{children}</main>
      <FooterSection {...(footer?.config || {})} sectionId="footer" doctor={doctor} />
    </div>
  );
}
