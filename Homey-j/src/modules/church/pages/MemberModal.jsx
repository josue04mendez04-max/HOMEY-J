
import { useState, useEffect } from 'react'
import { getMinistries, addMinistry, getRoles, addRole } from '../../../core/data/superAdminConfigService'

function MemberModal({ open, onClose, onSave, member, editMode }) {
  const [form, setForm] = useState({
    name: '',
    birth: '',
    ministry: '',
    role: '',
    phone: '',
  })
  const [ministries, setMinistries] = useState([])
  const [roles, setRoles] = useState([])
  const [showMinistryInput, setShowMinistryInput] = useState(false)
  const [showRoleInput, setShowRoleInput] = useState(false)
  const [newMinistry, setNewMinistry] = useState('')
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    getMinistries().then(setMinistries)
    getRoles().then(setRoles)
    if (editMode && member) {
      setForm({
        name: member.name || '',
        birth: member.birth || '',
        ministry: member.ministry || '',
        role: member.role || '',
        phone: member.phone || '',
      })
    } else if (open && !editMode) {
      setForm({ name: '', birth: '', ministry: '', role: '', phone: '' })
    }
  }, [open, editMode, member])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleMinistryChange = e => {
    if (e.target.value === 'Otro') {
      setShowMinistryInput(true)
      setForm({ ...form, ministry: '' })
    } else {
      setShowMinistryInput(false)
      setForm({ ...form, ministry: e.target.value })
    }
  }

  const handleRoleChange = e => {
    if (e.target.value === 'Otro') {
      setShowRoleInput(true)
      setForm({ ...form, role: '' })
    } else {
      setShowRoleInput(false)
      setForm({ ...form, role: e.target.value })
    }
  }

  const handleAddMinistry = async () => {
    if (newMinistry.trim()) {
      await addMinistry(newMinistry.trim())
      setMinistries(await getMinistries())
      setForm({ ...form, ministry: newMinistry.trim() })
      setShowMinistryInput(false)
      setNewMinistry('')
    }
  }

  const handleAddRole = async () => {
    if (newRole.trim()) {
      await addRole(newRole.trim())
      setRoles(await getRoles())
      setForm({ ...form, role: newRole.trim() })
      setShowRoleInput(false)
      setNewRole('')
    }
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSave(form)
  }
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-serif mb-4">{editMode ? 'Editar miembro' : 'Agregar miembro'}</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Nombre" className="border rounded px-3 py-2" disabled={editMode} />
          <input name="birth" value={form.birth} onChange={handleChange} required type="date" placeholder="Fecha de nacimiento" className="border rounded px-3 py-2" />
          <div>
            <select name="ministry" value={form.ministry || ''} onChange={handleMinistryChange} required className="border rounded px-3 py-2 w-full">
              <option value="" disabled>Ministerio</option>
              {ministries.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {showMinistryInput && (
              <div className="flex gap-2 mt-2">
                <input value={newMinistry} onChange={e => setNewMinistry(e.target.value)} placeholder="Nuevo ministerio" className="border rounded px-3 py-2 flex-1" />
                <button type="button" onClick={handleAddMinistry} className="bg-hunter text-cream px-3 py-2 rounded">Agregar</button>
              </div>
            )}
          </div>
          <div>
            <select name="role" value={form.role || ''} onChange={handleRoleChange} required className="border rounded px-3 py-2 w-full">
              <option value="" disabled>Rol</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {showRoleInput && (
              <div className="flex gap-2 mt-2">
                <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Nuevo rol" className="border rounded px-3 py-2 flex-1" />
                <button type="button" onClick={handleAddRole} className="bg-hunter text-cream px-3 py-2 rounded">Agregar</button>
              </div>
            )}
          </div>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Número de teléfono (opcional)" className="border rounded px-3 py-2" />
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-navy text-cream">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-hunter text-cream">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MemberModal;
