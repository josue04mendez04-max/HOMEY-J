import { useState } from 'react'
import Button from '../../../shared/ui/Button'
import Card from '../../../shared/ui/Card'
import Input from '../../../shared/ui/Input'

function LockScreen({ onUnlock, maskedKey }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      onUnlock(value)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6 py-12 text-navy">
      <Card className="w-full max-w-md text-left">
        <p className="text-sm uppercase tracking-[0.2em] text-gold mb-3">SuperAdmin</p>
        <h1 className="text-3xl font-serif mb-6">Bloqueo de seguridad</h1>
        <p className="text-sm text-navy/70 mb-4">
          Ingresa la Master Key de 20 dígitos para acceder al panel. Clave configurada: {maskedKey}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            label="Master Key"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="••••••••••••••••••••"
            inputMode="numeric"
            maxLength={20}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button type="submit">Desbloquear</Button>
        </form>
      </Card>
    </div>
  )
}

export default LockScreen
