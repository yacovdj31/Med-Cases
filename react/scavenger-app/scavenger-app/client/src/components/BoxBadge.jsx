import React from 'react';

export default function BoxBadge({
  label,
  state,            // null | 'pending' | 'completed'  (preferred)
  completed,        // legacy boolean (optional)
  onClick,
  className = '',
}) {
  // Derive a single status value
  const status =
    typeof state !== 'undefined'
      ? state // use tri-state if provided
      : (completed ? 'completed' : null); // legacy fallback

  const classes = colorClasses(status);
  const text = statusLabel(status);

  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border shadow-sm text-left transition ${classes.wrap} ${className}`}
    >
      <div className="text-xs text-gray-500">Box</div>
      <div className="text-xl font-semibold">{label}</div>

      <div className="mt-1 flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${classes.dot}`} />
        <span className={`text-sm font-medium ${classes.text}`}>{text}</span>
      </div>
    </button>
  );
}

function statusLabel(s) {
  if (s === 'completed') return 'Completed';
  if (s === 'pending') return 'Pending';
  return 'Not touched';
}

function colorClasses(s) {
  if (s === 'completed') {
    return {
      wrap: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    };
  }
  if (s === 'pending') {
    return {
      wrap: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500',
    };
  }
  // neutral / not touched
  return {
    wrap: 'bg-white border-gray-200 hover:bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  };
}
