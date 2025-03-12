// src/components/UI/Button.jsx
export const Button = ({
  children,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`py-2 px-4 rounded text-white font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
