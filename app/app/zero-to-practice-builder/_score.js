// Client-safe copy of the Visibility Score weights/labels (the model version
// imports mongoose and can't be used in a client component). Keep in sync.
export const SCORE_WEIGHTS = { gbp: 25, reviews: 20, website: 20, systems: 20, social: 15 };
export const SCORE_LABELS = {
  gbp: 'Google Business Profile',
  reviews: 'Reviews',
  website: 'Website',
  systems: 'Systems',
  social: 'Social presence',
};
