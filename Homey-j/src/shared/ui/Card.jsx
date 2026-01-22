import clsx from 'clsx'

function Card({ children, className = '' }) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-white/80 backdrop-blur shadow-[0_20px_60px_-30px_rgba(11,37,69,0.45)] border border-gold/30 px-6 py-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default Card
