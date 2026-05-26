function StatusBadge({ value }) {
  const statusClass = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return <span className={`dashboard-status-badge status-${statusClass}`}>{value}</span>;
}

export default StatusBadge;
