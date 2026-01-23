

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import MemberModal from './MemberModal'
import ImportMembersModal from './ImportMembersModal'
import { addMember, listMembers, updateMember } from '../../../core/data/membersService'
import { getMinistries, getRoles } from '../../../core/data/superAdminConfigService'

function Membership() {
  const { churchId } = useParams()
  const [members, setMembers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [ministryFilter, setMinistryFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [ministries, setMinistries] = useState([])
  const [roles, setRoles] = useState([])

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      const data = await listMembers(churchId)
      setMembers(data)
      setLoading(false)
    }
    fetchMembers()
    getMinistries().then(setMinistries)
    getRoles().then(setRoles)
  }, [churchId])

  const handleAdd = async (data) => {
    setModalOpen(false)
    setEditingMember(null)
    const saved = await addMember(churchId, data)
    setMembers((prev) => [...prev, saved])
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setModalOpen(true)
  }

  const handleSaveEdit = async (data) => {
    setModalOpen(false)
    if (!editingMember) return
    // Actualizar en Firestore
    await updateMember(churchId, editingMember.id, data)
    // Refrescar lista
    const updatedList = await listMembers(churchId)
    setMembers(updatedList)
    setEditingMember(null)
  }

  // Filtros y búsqueda
  const filtered = members.filter(m => {
    const matchesName = m.name?.toLowerCase().includes(search.toLowerCase())
    const matchesMinistry = !ministryFilter || m.ministry === ministryFilter
    const matchesRole = !roleFilter || m.role === roleFilter
    return matchesName && matchesMinistry && matchesRole
  })

  return (
    <div className="p-6">
      <MemberModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingMember(null) }}
        onSave={editingMember ? handleSaveEdit : handleAdd}
        member={editingMember}
        editMode={!!editingMember}
      />
      <ImportMembersModal open={importOpen} onClose={() => setImportOpen(false)} onImport={async (imported) => {
        if (Array.isArray(imported)) {
          for (const m of imported) {
            await addMember(churchId, m)
          }
          const data = await listMembers(churchId)
          setMembers(data)
        }
      }} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-serif">Lista de miembros</h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 items-stretch sm:items-center w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full sm:w-48"
          />
          <select value={ministryFilter} onChange={e => setMinistryFilter(e.target.value)} className="border rounded px-3 py-2 w-full sm:w-44">
            <option value="">Ministerio (todos)</option>
            {ministries.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded px-3 py-2 w-full sm:w-40">
            <option value="">Rol (todos)</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex flex-1 sm:flex-none gap-2 sm:gap-3">
            <button className="flex-1 sm:flex-none bg-hunter text-cream px-4 py-2 rounded-md font-medium hover:bg-hunter/90" onClick={() => setModalOpen(true)}>Agregar</button>
            <button className="flex-1 sm:flex-none bg-navy text-cream px-4 py-2 rounded-md font-medium hover:bg-navy/90" onClick={() => setImportOpen(true)}>Importar</button>
            <button className="flex-1 sm:flex-none bg-gold text-navy px-4 py-2 rounded-md font-medium hover:bg-gold/80">Exportar</button>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm bg-white rounded-lg shadow">
            <thead>
              <tr className="border-b border-navy/10">
                <th className="py-2 px-4">Nombre</th>
                <th className="py-2 px-4">Fecha de nacimiento</th>
                <th className="py-2 px-4">Ministerio</th>
                <th className="py-2 px-4">Rol</th>
                <th className="py-2 px-4">Teléfono</th>
                <th className="py-2 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-navy/60">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-navy/60">No hay miembros registrados.</td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <tr key={m.id || i} className="border-b border-navy/5">
                    <td className="py-2 px-4 font-medium">{m.name}</td>
                    <td className="py-2 px-4">{m.birth}</td>
                    <td className="py-2 px-4">{m.ministry}</td>
                    <td className="py-2 px-4">{m.role}</td>
                    <td className="py-2 px-4">{m.phone}</td>
                    <td className="py-2 px-4">
                      <button className="text-hunter hover:underline" onClick={() => handleEdit(m)}>Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="text-center text-navy/60">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-navy/60">No hay miembros registrados.</div>
        ) : (
          filtered.map((m, i) => (
            <div key={m.id || i} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-navy">{m.name}</p>
                  <p className="text-sm text-navy/70">{m.role || 'Sin rol'}</p>
                </div>
                <button className="text-sm text-hunter font-semibold" onClick={() => handleEdit(m)}>Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-navy/80">
                <span className="font-medium">Nacimiento:</span><span>{m.birth || '—'}</span>
                <span className="font-medium">Ministerio:</span><span>{m.ministry || '—'}</span>
                <span className="font-medium">Teléfono:</span><span>{m.phone || '—'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Membership;
