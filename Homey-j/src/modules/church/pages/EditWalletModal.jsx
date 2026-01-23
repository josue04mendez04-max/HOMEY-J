import { useState } from 'react'

export default function EditWalletModal({ wallet, onSave, onClose }) {
  const [form, setForm] = useState({
    name: wallet.name || '',
    type: wallet.type || 'CASH',
    is_default: wallet.is_default || false,
    balance: wallet.balance || 0
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✖️</button>
        <h2 className="text-xl font-bold mb-4">Editar Caja</h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre de la Caja</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded px-3 py-2">
              <option value="CASH">Efectivo</option>
              <option value="BANK">Banco/Digital</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Balance Actual</label>
            <input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) }))} className="w-full border rounded px-3 py-2" min="0" />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} />
            <span>Marcar como principal</span>
          </label>
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow mt-2">Guardar Cambios</button>
        </form>
      </div>
    </div>
  )
}
