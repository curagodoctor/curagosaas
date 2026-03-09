import Section from "./Section";

export default function ProblemSection() {
  const problems = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "The Social Anxiety",
      description: "Checking for the nearest restroom before every meeting or dinner out."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "The Mystery Pain",
      description: "Debilitating cramps or bloating that scans can't seem to find."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "The Brain Fog",
      description: "Feeling sluggish and unfocused whenever your gut flares up."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "The PPI Trap",
      description: "Relying on antacids daily, fearing the burn if you miss a single dose."
    }
  ];

  return (
    <Section bgColor="bg-beige-300" id="problems">
      <div className="text-center mb-8 md:mb-12 px-4">
        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-primary-900 mb-4 md:mb-6 leading-tight">
          Are you tired of being told{" "}
          <span className="text-primary-600">'Everything is Normal'?</span>
        </h2>
        <p className="text-base md:text-lg lg:text-xl text-primary-800 max-w-3xl mx-auto mb-6 md:mb-8 leading-relaxed">
          You've had the endoscopies. You've changed your diet. Yet, you still struggle with:
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-5 md:p-8 lg:p-12 rounded-xl md:rounded-2xl shadow-xl border border-primary-100">
        <div className="space-y-5 md:space-y-8">
          {problems.map((problem, index) => (
            <div key={index} className="flex items-start gap-4 md:gap-6">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-accent-100 rounded-lg flex items-center justify-center text-primary-600">
                {problem.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-primary-900 mb-1 md:mb-2 break-words">
                  {problem.title}
                </h3>
                <p className="text-sm md:text-base text-primary-800 leading-relaxed break-words">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
