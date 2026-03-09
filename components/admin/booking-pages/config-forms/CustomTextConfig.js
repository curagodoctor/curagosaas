"use client";

import RichTextEditor from "../shared/RichTextEditor";

export default function CustomTextConfig({ config, onChange, slug }) {
  const handleChange = (field, value) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title (optional)
        </label>
        <input
          type="text"
          value={config.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Leave blank for no title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <RichTextEditor
        value={config.content || ""}
        onChange={(value) => handleChange("content", value)}
        label="Content *"
        placeholder="Enter your content here... Use ## for headings, **bold** for bold text, - for bullet lists"
        rows={12}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Alignment
        </label>
        <select
          value={config.alignment || "left"}
          onChange={(e) => handleChange("alignment", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background Color
        </label>
        <select
          value={config.backgroundColor || "white"}
          onChange={(e) => handleChange("backgroundColor", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="white">White</option>
          <option value="beige">Beige</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Width
        </label>
        <select
          value={config.maxWidth || "4xl"}
          onChange={(e) => handleChange("maxWidth", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="2xl">Extra Small (2XL)</option>
          <option value="3xl">Small (3XL)</option>
          <option value="4xl">Medium (4XL)</option>
          <option value="5xl">Large (5XL)</option>
          <option value="6xl">Extra Large (6XL)</option>
          <option value="full">Full Width</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Padding
        </label>
        <select
          value={config.padding || "normal"}
          onChange={(e) => handleChange("padding", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="small">Small</option>
          <option value="normal">Normal</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );
}
