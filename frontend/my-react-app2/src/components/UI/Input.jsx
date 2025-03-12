export const Input = ({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
