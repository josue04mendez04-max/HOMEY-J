import clsx from 'clsx'

const base =
  'inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const variants = {
  primary: 'bg-hunter text-cream hover:bg-hunter/90 focus-visible:outline-hunter',
  secondary: 'bg-navy text-cream hover:bg-navy/90 focus-visible:outline-navy',
  ghost:
    'border-navy text-navy hover:bg-navy/10 focus-visible:outline-navy focus-visible:outline-2 focus-visible:outline-offset-2',
}

function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

export default Button
