// Shared shape + sanitizer for a pack's rich public sales page (Framework.salesPage).
// Used by the admin PATCH route (to validate before saving) and the admin editor
// (to seed empty forms). The public renderer reads the stored object directly.

const str = (v) => (v == null ? '' : String(v).trim());
const strList = (v) =>
  (Array.isArray(v) ? v : String(v || '').split('\n'))
    .map((x) => str(x))
    .filter(Boolean);
const bool = (v, dflt = true) => (v == null ? dflt : !!v);
const clampInt = (v, min, max, dflt) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.round(n)));
};

// Coerce arbitrary input into the known salesPage shape. Unknown keys dropped,
// strings trimmed, empty array entries removed. Never throws.
export function sanitizeSalesPage(input) {
  const sp = input && typeof input === 'object' ? input : {};
  const sec = (k) => (sp[k] && typeof sp[k] === 'object' ? sp[k] : {});

  const hero = sec('hero');
  const problem = sec('problem');
  const bigIdea = sec('bigIdea');
  const videoDemo = sec('videoDemo');
  const honestPromise = sec('honestPromise');
  const curriculum = sec('curriculum');
  const offer = sec('offer');
  const faq = sec('faq');
  const finalCta = sec('finalCta');
  const founder = sec('founder');

  return {
    hero: {
      enabled: bool(hero.enabled),
      badges: strList(hero.badges),
      title: str(hero.title),
      subtitle: str(hero.subtitle),
      description: str(hero.description),
      supportingLine: str(hero.supportingLine),
      specs: (Array.isArray(hero.specs) ? hero.specs : [])
        .map((s) => ({ value: str(s?.value), label: str(s?.label) }))
        .filter((s) => s.value || s.label),
      images: strList(hero.images),
      ticker: strList(hero.ticker),
    },
    problem: {
      enabled: bool(problem.enabled),
      title: str(problem.title),
      subtitle: str(problem.subtitle),
      bullets: strList(problem.bullets),
      conclusion: str(problem.conclusion),
    },
    bigIdea: {
      enabled: bool(bigIdea.enabled),
      title: str(bigIdea.title),
      subtitle1: str(bigIdea.subtitle1),
      subtitle2: str(bigIdea.subtitle2),
      loop: strList(bigIdea.loop),
      bullets: (Array.isArray(bigIdea.bullets) ? bigIdea.bullets : [])
        .map((b) => ({ title: str(b?.title), desc: str(b?.desc) }))
        .filter((b) => b.title || b.desc),
      conclusion: str(bigIdea.conclusion),
      image: str(bigIdea.image),
    },
    videoDemo: {
      enabled: bool(videoDemo.enabled),
      title: str(videoDemo.title),
      videoUrl: str(videoDemo.videoUrl),
      caption: str(videoDemo.caption),
      description: str(videoDemo.description),
      flow: strList(videoDemo.flow),
    },
    honestPromise: {
      enabled: bool(honestPromise.enabled),
      title: str(honestPromise.title),
      intro: str(honestPromise.intro),
      negatives: strList(honestPromise.negatives),
      highlight: str(honestPromise.highlight),
      conclusion: str(honestPromise.conclusion),
    },
    curriculum: {
      enabled: bool(curriculum.enabled),
      title: str(curriculum.title),
      previewCount: clampInt(curriculum.previewCount, 1, 50, 5),
    },
    offer: {
      enabled: bool(offer.enabled),
      title: str(offer.title),
      benefits: strList(offer.benefits),
      ctaLabel: str(offer.ctaLabel),
      supportingLine: str(offer.supportingLine),
    },
    faq: {
      enabled: bool(faq.enabled),
      title: str(faq.title),
      items: (Array.isArray(faq.items) ? faq.items : [])
        .map((f) => ({ q: str(f?.q), a: str(f?.a) }))
        .filter((f) => f.q || f.a),
    },
    finalCta: {
      enabled: bool(finalCta.enabled),
      title: str(finalCta.title),
      subtitle: str(finalCta.subtitle),
      ctaLabel: str(finalCta.ctaLabel),
      supportingLine: str(finalCta.supportingLine),
    },
    founder: {
      enabled: bool(founder.enabled),
      eyebrow: str(founder.eyebrow),
      intro: str(founder.intro),
      body: str(founder.body),
      name: str(founder.name),
      credential: str(founder.credential),
      photo: str(founder.photo),
    },
  };
}

// A fully-empty salesPage (all sections enabled, no content) — used to seed the
// admin editor when a pack has never been edited.
export function emptySalesPage() {
  return sanitizeSalesPage({});
}
