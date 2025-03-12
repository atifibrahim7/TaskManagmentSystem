export const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};
