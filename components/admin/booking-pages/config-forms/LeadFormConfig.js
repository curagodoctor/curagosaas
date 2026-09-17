"use client";

// Config for the Lead Form section — a lightweight enquiry form (the alternative
// to the booking system). Submissions land as Contacts tagged "lead" in the
// doctor's dashboard.
export default function LeadFormConfig({ config, onChange }) {
  const set = (field, value) => onChange({ ...config, [field]: value });

  const input =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <p className="font-semibold mb-1">How this works</p>
        <p>Visitors leave their name and phone (email/message optional). Each submission appears in your <span className="font-medium">Contacts</span> dashboard tagged “lead”.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
        <input
          className={input}
          value={config.title || ""}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Request a call back"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
        <input
          className={input}
          value={config.subtitle || ""}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="Leave your details and the clinic will get in touch."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Button text</label>
        <input
          className={input}
          value={config.buttonText || ""}
          onChange={(e) => set("buttonText", e.target.value)}
          placeholder="Send my details"
        />
      </div>
    </div>
  );
}
