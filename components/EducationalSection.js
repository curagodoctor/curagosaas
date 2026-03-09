import Section from "./Section";

export default function EducationalSection() {
  const theories = [
    {
      title: "Visceral Hypersensitivity",
      description: "Your brain's 'volume control' for gut pain is turned up too high."
    },
    {
      title: "The Vagus Highway",
      description: "Your brain and gut send 100,000 signals a minute. When this communication is 'noisy,' digestion fails."
    },
    {
      title: "The Enteric Nervous System",
      description: "Your gut has its own brain. We don't just treat the stomach and intestines; we recalibrate the connection."
    }
  ];

  return (
    <Section bgColor="bg-primary-900" id="science">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          It's not in your head.{" "}
          <span className="text-accent-400">It's in your nerves.</span>
        </h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-xl text-beige-200 mb-6 italic">
            "As a Gastrosurgeon, I see the disoriented Gut-Brain Axis everyday"
          </p>
          <p className="text-lg text-beige-300">
            Few theories that explain the GBA (Gut Brain Axis)
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-beige-100 p-8 md:p-12 rounded-2xl shadow-xl border border-beige-300">
        <div className="space-y-6">
          {theories.map((theory, index) => (
            <div key={index} className="flex items-start gap-6">
              <div className="flex-shrink-0 w-6 h-6 mt-1">
                <svg className="w-6 h-6 text-primary-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-primary-900 mb-2">
                  {theory.title}
                </h3>
                <p className="text-primary-800 text-sm leading-relaxed">
                  {theory.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center max-w-4xl mx-auto bg-primary-800 p-8 rounded-xl border border-accent-500">
        <svg className="w-12 h-12 text-accent-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-lg text-white leading-relaxed">
          <strong>The key insight:</strong> We don't just treat the stomach and intestines. We recalibrate the complex bidirectional communication between your gut and brain to restore normal function.
        </p>
      </div>
    </Section>
  );
}
