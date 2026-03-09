export default function Button({ children, variant = "primary", size = "default", className = "", onClick, href }) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4";

  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-300",
    secondary: "bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent-300",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-300",
  };

  const sizes = {
    small: "px-6 py-3 text-sm",
    default: "px-8 py-4 text-base",
    large: "px-10 py-5 text-lg",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
