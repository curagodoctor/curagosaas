import Section from "./Section";
import Link from "next/link";

export default function ServicesSection() {
  const services = [
    {
      title: "Advanced Laparoscopic Surgery",
      description: "Minimally invasive procedures for hernia repair, GERD, and colorectal conditions with faster recovery.",
    },
    {
      title: "HPB Surgery",
      description: "Expert care for liver, gallbladder, biliary system, and pancreatic conditions including tumors and stones.",
    },
    {
      title: "GI Oncology",
      description: "Comprehensive surgical management of GI cancers including esophageal, gastric, colorectal, and liver cancers.",
    },
    {
      title: "Hernia Surgery",
      description: "Advanced laparoscopic repair for inguinal, incisional, and umbilical hernias with minimal downtime.",
    },
    {
      title: "Gallbladder Surgery",
      description: "Laparoscopic cholecystectomy for gallstones and gallbladder polyps with quick recovery.",
    },
    {
      title: "Digestive Disorders",
      description: "Treatment for GERD, achalasia, chronic pancreatitis, and other complex GI conditions.",
    },
  ];

  return (
    <Section bgColor="bg-white" id="services">
      <div className="text-center mb-16">
        <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          Specialized Care
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-6">
          Services Offered
        </h2>
        <p className="text-xl text-primary-600 max-w-3xl mx-auto">
          Comprehensive surgical solutions for digestive, liver, and pancreatic conditions using advanced minimally invasive techniques.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-primary-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          View All Services
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </Section>
  );
}
