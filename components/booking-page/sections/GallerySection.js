"use client";

function youtubeEmbed(url) {
  const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function GallerySection({ sectionId, title = "Gallery", subtitle, items = [] }) {
  const list = (items || []).filter((it) => it && it.url);
  if (!list.length) return null;

  return (
    <section id={sectionId} className="container mx-auto px-4 md:px-6 py-12 md:py-16 lg:py-20 bg-beige-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-3">{title}</h2>
          {subtitle && <p className="text-base md:text-lg text-primary-700 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((it, i) => {
            const isVideo = it.type === "video";
            const isGs = typeof it.url === "string" && it.url.startsWith("gs://");
            const embed = isVideo && !isGs ? youtubeEmbed(it.url) : null;
            // Uploaded videos (gs://) stream same-origin via the signed-URL redirect.
            const videoSrc = isGs ? `/api/site/media?ref=${encodeURIComponent(it.url)}` : it.url;
            return (
              <figure key={i} className="rounded-xl overflow-hidden bg-white shadow-sm">
                {isVideo ? (
                  embed ? (
                    <div className="aspect-video"><iframe src={embed} title={it.alt || it.caption || "Video"} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
                  ) : (
                    <video src={videoSrc} controls playsInline preload="metadata" className="w-full aspect-video object-cover bg-black" aria-label={it.alt || it.caption || "Video"} />
                  )
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.alt || it.caption || "Gallery image"} className="w-full aspect-square object-cover" loading="lazy" />
                )}
                {it.caption && <figcaption className="text-xs text-primary-800 p-2.5">{it.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
