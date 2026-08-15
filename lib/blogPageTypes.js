// Modular blog structure by page intent. The author picks a page type; each type
// suggests a set of H2 headings (as editable content blocks) so every article
// isn't forced into one rigid "what → symptoms → causes → treatment → FAQ" shape.
// Headings are only defaults — the author can edit, add, remove or reorder them.
// {{doctor_name}} / {{city}} tokens are filled from the doctor's profile at render.

export const BLOG_PAGE_TYPES = [
  {
    id: 'disease',
    label: 'Disease / Condition',
    description: 'Explains a condition end to end.',
    headings: [
      'What Is It?',
      'Symptoms',
      'Causes and Risk Factors',
      'Diagnosis',
      'Treatment Options',
      'When to See a Specialist',
    ],
  },
  {
    id: 'treatment',
    label: 'Treatment',
    description: 'Focuses on how a condition is treated.',
    headings: [
      'What Determines Treatment?',
      'When Treatment May Not Be Needed',
      'Medical Management',
      'When a Procedure Is Considered',
      'The Procedure Explained',
      'Recovery and Follow-Up',
    ],
  },
  {
    id: 'procedure',
    label: 'Procedure / Surgery',
    description: 'Explains a specific procedure.',
    headings: [
      'What Is the Procedure?',
      'Why It Is Performed',
      'Who May Be Considered',
      'How the Procedure Is Performed',
      'Recovery After the Procedure',
      'Possible Risks and Complications',
    ],
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Targets patients searching in a city/area.',
    headings: [
      'Understanding the Condition',
      'When It Needs Treatment',
      'Treatment Options',
      'Treatment in {{city}}',
      'When to Consult a Specialist',
      'About Dr. {{doctor_name}}',
    ],
  },
  {
    id: 'symptom',
    label: 'Symptom',
    description: 'Answers a symptom question.',
    headings: [
      'Why This Happens',
      'What It Usually Feels Like',
      'Other Possible Causes',
      'When to Seek Medical Evaluation',
      'How It Is Diagnosed',
      'Treatment Options',
    ],
  },
];

export function getPageType(id) {
  return BLOG_PAGE_TYPES.find((t) => t.id === id) || null;
}

// The suggested blocks (heading + empty content) for a page type.
export function blocksForType(id) {
  const t = getPageType(id);
  if (!t) return [];
  return t.headings.map((heading) => ({ heading, content: '' }));
}

// Default heading for the clinic-location block (shown on every article that
// opts into it; especially useful for Location pages).
export const LOCATION_BLOCK_HEADING = 'Clinic Location & Consultation Information';
