import { statusBadgeClasses } from '../utils/formatters';

const StatusBadge = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeClasses(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
