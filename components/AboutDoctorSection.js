import Section from "./Section";
import Image from "next/image";

export default function AboutDoctorSection() {
  const credentials = [
    {
      title: "Qualification",
      value: "MS, MCh, FMAS, FACRSI",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      )
    },
    {
      title: "Specialization",
      value: "Surgical Gastroenterology",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Expertise",
      value: "Advanced Laparoscopic & GI Surgery",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "Location",
      value: "Based in Mumbai",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <Section bgColor="bg-beige-300" id="about-doctor">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Doctor Image */}
        <div className="order-2 lg:order-1">
          <div className="relative">
            <div className="aspect-[4/5] bg-beige-200 rounded-2xl overflow-hidden shadow-2xl border border-primary-200">
              <Image
                src="/profile.svg"
                alt="Dr. Yuvaraj T - Surgical Gastroenterologist"
                width={600}
                height={750}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent-400 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="order-1 lg:order-2">
          <div className="inline-block bg-accent-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            About Your Doctor
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-6">
            Dr. Yuvaraj T
          </h2>

          <div className="space-y-4 mb-8">
            <p className="text-lg text-primary-800 leading-relaxed">
              I am Dr Yuvaraj T, a <strong>Surgical Gastroenterologist</strong> currently based in Mumbai.
            </p>

            <p className="text-lg text-primary-800 leading-relaxed">
              While I specialize in advanced laparoscopic and GI surgeries, I realized that many patients don't need surgery—they need <strong>continuity of care</strong>.
            </p>

            <p className="text-lg text-primary-800 leading-relaxed">
              I created this system to bridge the gap between 'normal' reports and a better quality of life. Because your symptoms deserve answers, not dismissal.
            </p>
          </div>

          {/* Credentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {credentials.map((credential, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-primary-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-primary-600">
                    {credential.icon}
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 mb-1">{credential.title}</p>
                    <p className="font-semibold text-primary-900">{credential.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="bg-accent-50 border-l-4 border-primary-600 p-6 rounded-r-lg">
            <p className="text-primary-800 italic">
              "Your gut health journey deserves more than just scans and medications. It deserves understanding, partnership, and continuous expert support."
            </p>
            <p className="text-primary-700 font-semibold mt-2">— Dr. Yuvaraj T</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
