export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-900 text-beige-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-beige-300 mb-4">
              Dr Yuvaraj T
            </h3>
            <p className="text-beige-200 mb-4 max-w-md">
              Expert Surgical Gastroenterologist specializing in GI & HPB Surgery, Laparoscopic & GI Oncosurgery in Mumbai.
            </p>
            <div className="flex gap-4">
              <a
                href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20to%20book%20an%20online%20consultation%20with%20Dr.%20Yuvaraj%2C%20please%20guide%20me"
                className="w-10 h-10 bg-primary-800 hover:bg-accent-600 rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-beige-300 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/gbsi" className="hover:text-accent-400 transition-colors">
                  GBSI
                </a>
              </li>
              <li>
                <a href="/myclinic" className="hover:text-accent-400 transition-colors">
                  My Clinic
                </a>
              </li>
              <li>
                <a href="/forum" className="hover:text-accent-400 transition-colors">
                  Forum
                </a>
              </li>
              <li>
                <a href="/priority-connect" className="hover:text-accent-400 transition-colors">
                  Priority Connect
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-accent-400 transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-800">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <p className="text-sm text-beige-200">
              © {currentYear} Dr Yuvaraj T. All rights reserved.
            </p>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-6 pt-6 border-t border-primary-800">
          <p className="text-xs text-beige-200 text-center">
            <strong>Medical Disclaimer:</strong> The information provided on this website is for educational purposes only and is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
    </footer>
  );
}
