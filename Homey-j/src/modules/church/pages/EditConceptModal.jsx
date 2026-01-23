import { useState } from 'react'

export default function EditConceptModal({ concept, onSave, onClose, allowExpense, allowSpecialExpense }) {
  const [form, setForm] = useState({
    name: concept.name || '',
    reason: concept.reason || '',
    system_behavior: concept.system_behavior || 'INCOME'
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✖️</button>
        <h2 className="text-xl font-bold mb-4">{concept.id ? 'Editar Concepto' : 'Nuevo Concepto'}</h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nombre del Concepto</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Razón del Concepto</label>
            <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Tipo de Concepto</label>
            <select value={form.system_behavior} onChange={e => setForm(f => ({ ...f, system_behavior: e.target.value }))} className="w-full border rounded px-3 py-2">
              <option value="INCOME">Ingreso</option>
              {allowExpense && <option value="EXPENSE">Gasto</option>}
              {allowSpecialExpense && <option value="SPECIAL_EXPENSE">Gasto Especial</option>}
            </select>
          </div>
          <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold shadow mt-2">Guardar</button>
        </form>
      </div>
    </div>
  )
}
