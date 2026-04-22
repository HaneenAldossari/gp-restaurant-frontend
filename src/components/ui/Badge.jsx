const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    star: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    puzzle: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    plowhorse: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    dog: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400',
    success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400',
    info: 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
  };

  return (
    <span className={`badge ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
