import clsx from 'clsx'

function Card({ children, className = '' }) {
  return (
    <div
      className={clsx(
        'rounded-[18px] bg-[#f4f7fb] border border-[#d6dde8] shadow-bank px-6 py-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default Card
