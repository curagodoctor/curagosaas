"use client";

import { useState } from "react";
import ImageUploader from "../shared/ImageUploader";

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";

export default function GalleryConfig({ config, onChange, slug }) {
  const [upBusy, setUpBusy] = useState({}); // { [index]: percent }
  const items = config.items || [];
  const set = (k, v) => onChange({ ...config, [k]: v });
  const setItem = (i, k, v) => onChange({ ...config, items: items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) });
  const addImage = () => onChange({ ...config, items: [...items, { type: "image", url: "", alt: "", caption: "" }] });
  const addVideo = () => onChange({ ...config, items: [...items, { type: "video", url: "", alt: "", caption: "" }] });
  const remove = (i) => onChange({ ...config, items: items.filter((_, j) => j !== i) });

  // Upload a video file straight to GCS; stores the gs:// ref on the item.
  const uploadVideo = async (i, file) => {
    if (!file) return;
    setUpBusy((s) => ({ ...s, [i]: 0 }));
    try {
      const res = await fetch("/api/doctor/media/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }) });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Upload could not start");
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", d.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUpBusy((s) => ({ ...s, [i]: Math.round((e.loaded / e.total) * 100) })); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });
      setItem(i, "url", d.gsUri);
    } catch (e) { alert(e.message); }
    finally { setUpBusy((s) => { const n = { ...s }; delete n[i]; return n; }); }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
        <input className={INPUT} value={config.title ?? "Gallery"} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (optional)</label>
        <input className={INPUT} value={config.subtitle || ""} onChange={(e) => set("subtitle", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos &amp; videos ({items.length})</label>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">{it.type === "video" ? "Video" : "Photo"} {i + 1}</span>
                <button type="button" onClick={() => remove(i)} className="text-red-600 text-xs hover:underline">Remove</button>
              </div>
              {it.type === "video" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm cursor-pointer hover:bg-white">
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => uploadVideo(i, e.target.files?.[0])} disabled={upBusy[i] !== undefined} />
                      {upBusy[i] !== undefined ? `Uploading ${upBusy[i]}%` : ((it.url || "").startsWith("gs://") ? "Replace video" : "Upload video")}
                    </label>
                    {(it.url || "").startsWith("gs://") && upBusy[i] === undefined && <span className="text-xs text-green-700">✓ uploaded</span>}
                  </div>
                  <input className={INPUT} placeholder="…or paste a YouTube / direct video link" value={(it.url || "").startsWith("gs://") ? "" : (it.url || "")} onChange={(e) => setItem(i, "url", e.target.value)} />
                </div>
              ) : (
                <ImageUploader value={it.url || ""} onChange={(url) => setItem(i, "url", url)} slug={slug || "gallery"} label="Photo" compact />
              )}
              <input className={INPUT} placeholder="Alt text (describe the photo/video for accessibility & SEO)" value={it.alt || ""} onChange={(e) => setItem(i, "alt", e.target.value)} />
              <input className={INPUT} placeholder="Caption (optional)" value={it.caption || ""} onChange={(e) => setItem(i, "caption", e.target.value)} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={addImage} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add photo</button>
          <button type="button" onClick={addVideo} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">+ Add video</button>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">Videos: paste a YouTube link or a direct video URL. Always add alt text.</p>
      </div>
    </div>
  );
}
