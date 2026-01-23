import clsx from 'clsx'

function Input({ label, className = '', ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-navy/80">
      {label && <span className="font-medium text-[#152032]">{label}</span>}
      <input
        className={clsx(
          'rounded-[14px] border border-[#d6dde8] bg-[#eef2f7] px-3 py-2 text-[#152032] shadow-inner focus:border-[#3a7ca5] focus:outline-none focus:ring-2 focus:ring-[#3a7ca5]/20',
          className,
        )}
        {...props}
      />
    </label>
  )
}

export default Input
