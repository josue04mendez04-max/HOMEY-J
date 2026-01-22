import clsx from 'clsx'

function Input({ label, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-navy/80">
      {label && <span className="font-medium text-navy">{label}</span>}
      <input
        className={clsx(
          'rounded-md border border-navy/20 bg-white px-3 py-2 text-navy shadow-sm focus:border-hunter focus:outline-none focus:ring-2 focus:ring-hunter/30',
          className,
        )}
        {...props}
      />
    </label>
  )
}

export default Input
