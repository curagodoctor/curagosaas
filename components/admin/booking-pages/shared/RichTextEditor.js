"use client";

import { useState, useRef } from "react";

export default function RichTextEditor({
  value = "",
  onChange,
  label = "Content",
  placeholder = "Enter your content here...",
  rows = 10,
  showMarkdownHelp = true,
}) {
  const [activeTab, setActiveTab] = useState("edit"); // edit or preview
  const textareaRef = useRef(null);

  const insertText = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const formatBold = () => insertText("**", "**");
  const formatHeading = () => insertText("## ", "");
  const formatList = () => insertText("- ", "");

  // Parse markdown-style formatting for preview
  const renderPreview = () => {
    const lines = value.split("\n");
    const elements = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        return;
      }

      // Headings
      if (trimmedLine.startsWith("### ")) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <h4 key={index} className="text-lg font-bold text-gray-900 mb-2 mt-4">
            {trimmedLine.substring(4)}
          </h4>
        );
      } else if (trimmedLine.startsWith("## ")) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <h3 key={index} className="text-xl font-bold text-gray-900 mb-3 mt-6">
            {trimmedLine.substring(3)}
          </h3>
        );
      } else if (trimmedLine.startsWith("# ")) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <h2 key={index} className="text-2xl font-bold text-gray-900 mb-4 mt-8">
            {trimmedLine.substring(2)}
          </h2>
        );
      }
      // List items
      else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        inList = true;
        const content = trimmedLine.substring(2);
        const parts = content.split(/(\*\*.*?\*\*)/g);
        const formatted = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
        listItems.push(<li key={`li-${index}`}>{formatted}</li>);
      }
      // Regular paragraphs
      else {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-4 space-y-1">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
        const formatted = parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        elements.push(
          <p key={index} className="mb-3 leading-relaxed">
            {formatted}
          </p>
        );
      }
    });

    if (inList) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside mb-4 space-y-1">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex items-center gap-2">
        <button
          type="button"
          onClick={formatBold}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={formatHeading}
          className="p-2 hover:bg-gray-200 rounded transition-colors font-bold text-sm"
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onClick={formatList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="flex-1"></div>

        {/* Tab Buttons */}
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === "edit"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            activeTab === "preview"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Editor / Preview */}
      {activeTab === "edit" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
      ) : (
        <div className="w-full min-h-[200px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg bg-white">
          {value ? (
            <div className="prose prose-sm max-w-none text-gray-800">
              {renderPreview()}
            </div>
          ) : (
            <p className="text-gray-400 italic">No content to preview</p>
          )}
        </div>
      )}

      {/* Markdown Help */}
      {showMarkdownHelp && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
          <strong className="text-gray-700">Formatting tips:</strong> Use{" "}
          <code className="bg-gray-200 px-1 py-0.5 rounded">**bold**</code> for bold text,{" "}
          <code className="bg-gray-200 px-1 py-0.5 rounded">## Heading</code> for headings,{" "}
          <code className="bg-gray-200 px-1 py-0.5 rounded">- item</code> for bullet lists
        </div>
      )}
    </div>
  );
}
