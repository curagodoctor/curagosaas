"use client";

import { useState, useRef } from "react";

export default function ImageUploader({
  value = "",
  onChange,
  slug = "default",
  label = "Upload Image",
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  showPreview = true,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      throw new Error(
        `Invalid file type. Accepted formats: ${acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")}`
      );
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setError(null);

      console.log('📤 Starting image upload:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
        slug: slug
      });

      // Validate file
      validateFile(file);
      console.log('✅ File validation passed');

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slug", slug);

      // Upload to API
      console.log('📡 Uploading to /api/admin/upload-image...');
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: formData,
      });

      console.log('📥 Upload response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Upload failed:', data);
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);

      if (!data.success || !data.url) {
        throw new Error('Invalid response from server');
      }

      onChange(data.url);
      console.log('✅ Image URL set:', data.url);
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Upload Area */}
      {!value && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600 hover:text-blue-700">
                  Click to upload
                </span>{" "}
                or drag and drop
              </div>
              <p className="text-xs text-gray-500">
                {acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")} up to{" "}
                {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {value && showPreview && (
        <div className="relative">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain"
              onLoad={() => {
                console.log('✅ Image loaded successfully:', value);
                setError(null);
              }}
              onError={(e) => {
                const errorMsg = `Failed to load image: ${value}`;
                console.error('❌ Image load error:', errorMsg);
                setError(errorMsg);
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='14'%3EImage failed to load%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* Image URL */}
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono break-all">
            {value}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-colors"
            title="Remove image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Change Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Change Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
