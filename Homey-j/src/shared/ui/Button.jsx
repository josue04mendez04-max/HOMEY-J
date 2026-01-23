import clsx from 'clsx'

const base =
  'inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition shadow-bankSoft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const variants = {
  primary: 'bg-[var(--btn-primary,#3a7ca5)] text-white border-transparent hover:bg-[#336b8d] focus-visible:outline-[#3a7ca5]',
  secondary: 'bg-[#f4f7fb] text-[#152032] border-[#d6dde8] hover:bg-[#e9eef5] focus-visible:outline-[#3a7ca5]',
  ghost:
    'bg-transparent text-[#152032] border-[#d6dde8] hover:bg-[#eef2f7] focus-visible:outline-[#3a7ca5]',
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

export default Button
