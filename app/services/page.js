import Section from "@/components/Section";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Core GI & HPB Services | Dr. Yuvaraj T - Surgical Gastroenterologist",
  description: "Advanced Laparoscopic & GI Surgery, HPB Center, and GI Oncology services by Dr. Yuvaraj T in Mumbai. Expert surgical care for digestive and liver conditions.",
};

export default function ServicesPage() {
  const laparoscopicServices = [
    {
      category: "Esophagus & Stomach",
      services: [
        "Hiatal Hernia Repair",
        "GERD surgery (Fundoplication)",
        "Achalasia Cardia (Heller's Myotomy)",
        "Corrosive Ingestion Management"
      ]
    },
    {
      category: "Small & Large Intestine",
      services: [
        "Colorectal surgery for Diverticulitis",
        "Rectal Prolapse repair",
        "Complex Fistula management"
      ]
    },
    {
      category: "Abdominal Wall",
      services: [
        "Advanced Laparoscopic Hernia repairs (Inguinal)",
        "Incisional Hernia repair",
        "Umbilical Hernia repair"
      ]
    }
  ];

  const hpbServices = [
    {
      organ: "Liver",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      services: ["Management of Liver Cysts", "Liver Tumor treatment", "Portal Hypertension Management"]
    },
    {
      organ: "Gallbladder",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      services: ["Laparoscopic Cholecystectomy for Stones", "Gallbladder Polyps treatment"]
    },
    {
      organ: "Biliary System",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      services: ["Laparoscopic surgery for bile duct stones", "Bile duct cysts treatment", "Biliary tumors management"]
    },
    {
      organ: "Pancreas",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      services: ["Surgery for Chronic Pancreatitis", "Pancreatic tumor management"]
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Core GI & HPB Services
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
            Advanced surgical solutions for digestive, liver, and pancreatic conditions with minimally invasive techniques.
          </p>
        </div>
      </section>

      {/* Section 1: Advanced Laparoscopic & GI Surgery */}
      <Section bgColor="bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Advanced Laparoscopic & GI Surgery
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            State-of-the-art minimally invasive surgical techniques for comprehensive gastrointestinal care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {laparoscopicServices.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-primary-600">
                {item.category}
              </h3>
              <ul className="space-y-4">
                {item.services.map((service, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-accent-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 2: HPB Center */}
      <Section bgColor="bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            HPB (Hepato-Pancreato-Biliary) Center
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Specialized care for liver, gallbladder, biliary system, and pancreatic conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {hpbServices.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{item.organ}</h3>
              </div>
              <ul className="space-y-3">
                {item.services.map((service, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 3: GI Oncology */}
      <Section bgColor="bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            GI Oncology (Cancer Care)
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive surgical management of GI cancers with a multidisciplinary approach.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-3xl p-12 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Multidisciplinary Approach</h3>
                <p className="text-gray-600">Collaborative care with oncologists, radiologists, and pathologists</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Early Detection Protocols</h3>
                <p className="text-gray-600">Advanced screening and diagnostic techniques for better outcomes</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Specialized Cancer Surgeries:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Esophageal Cancer",
                  "Gastric (Stomach) Cancer",
                  "Colorectal Cancer",
                  "Liver Cancer",
                  "Pancreatic Cancer",
                  "Gallbladder Cancer"
                ].map((cancer, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {cancer}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section bgColor="bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Need Expert Surgical Care?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Schedule a consultation to discuss your condition and treatment options.
          </p>
          <a
            href="https://wa.me/917021227203?text=Hi%2C%20I%20need%20to%20book%20an%20online%20consultation%20with%20Dr.%20Yuvaraj%2C%20please%20guide%20me"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xl px-12 py-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>Book Consultation on WhatsApp</span>
          </a>
        </div>
      </Section>

      <Footer />
    </main>
  );
}
