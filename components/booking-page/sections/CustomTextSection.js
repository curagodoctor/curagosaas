"use client";

export default function CustomTextSection({
  title,
  content,
  alignment = "left", // left, center, right
  backgroundColor = "white", // white, beige
  maxWidth = "4xl", // 2xl, 3xl, 4xl, 5xl, 6xl, full
  padding = "normal", // small, normal, large
}) {
  if (!content) return null;

  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment] || "text-left";

  const bgClass = {
    white: "bg-white",
    beige: "bg-beige-50",
  }[backgroundColor] || "bg-white";

  const maxWidthClass = {
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    full: "max-w-full",
  }[maxWidth] || "max-w-4xl";

  const paddingClass = {
    small: "py-8 md:py-12",
    normal: "py-12 md:py-16 lg:py-20",
    large: "py-16 md:py-24 lg:py-32",
  }[padding] || "py-12 md:py-16 lg:py-20";

  // Parse content for basic markdown-style formatting
  const formatContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        // Close any open list
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2 text-primary-800">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        return;
      }

      // Headings (###, ##, #)
      if (trimmedLine.startsWith('### ')) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2 text-primary-800">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <h4 key={index} className="text-lg md:text-xl font-bold text-primary-700 mb-4 mt-6">
            {trimmedLine.substring(4)}
          </h4>
        );
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2 text-primary-800">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <h3 key={index} className="text-xl md:text-2xl font-bold text-primary-600 mb-4 mt-8">
            {trimmedLine.substring(3)}
          </h3>
        );
      } else if (trimmedLine.startsWith('# ')) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2 text-primary-800">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <h2 key={index} className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 mt-8">
            {trimmedLine.substring(2)}
          </h2>
        );
      }
      // List items (- or *)
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        inList = true;
        listItems.push(
          <li key={`li-${index}`} className="leading-relaxed">
            {trimmedLine.substring(2)}
          </li>
        );
      }
      // Regular paragraphs
      else {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside mb-6 space-y-2 text-primary-800">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        // Check for bold text (**text**)
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
        const formattedParts = parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        elements.push(
          <p key={index} className="text-base md:text-lg text-primary-800 leading-relaxed mb-4">
            {formattedParts}
          </p>
        );
      }
    });

    // Close any remaining list
    if (inList) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside mb-6 space-y-2 text-primary-800">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  return (
    <section className={`container mx-auto px-4 md:px-6 ${paddingClass} ${bgClass}`}>
      <div className={`${maxWidthClass} mx-auto ${alignmentClass}`}>
        {title && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-600 mb-6 lg:mb-8">
            {title}
          </h2>
        )}

        <div className="prose prose-lg max-w-none">
          {formatContent(content)}
        </div>
      </div>
    </section>
  );
}
