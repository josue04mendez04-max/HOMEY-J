

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
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-8 py-8 text-[#0f172a]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#94a3b8]">Membresía</p>
        <h1 className="text-3xl font-semibold mt-1">Gestión de miembros</h1>
        <p className="text-sm text-[#475569] mt-1">Busca, filtra y administra la base de miembros de la iglesia.</p>
      </div>
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
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0f172a]">Lista de miembros</h2>
            <p className="text-sm text-[#475569]">Filtra por ministerio o rol y gestiona altas y ediciones.</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 items-stretch sm:items-center w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-[#cbd5e1] rounded-lg px-3 py-2 w-full sm:w-48 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition"
              autoComplete="off"
            />
            <select value={ministryFilter} onChange={e => setMinistryFilter(e.target.value)} className="border border-[#cbd5e1] rounded-lg px-3 py-2 w-full sm:w-44 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition">
              <option value="">Ministerio (todos)</option>
              {ministries.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-[#cbd5e1] rounded-lg px-3 py-2 w-full sm:w-40 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/30 focus:border-[#0ea5e9] transition">
              <option value="">Rol (todos)</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex flex-1 sm:flex-none gap-2 sm:gap-3">
              <button className="flex-1 sm:flex-none bg-[#0ea5e9] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-[#0284c7] transition" onClick={() => setModalOpen(true)}>Agregar</button>
              <button className="flex-1 sm:flex-none bg-[#0f172a] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-black transition" onClick={() => setImportOpen(true)}>Importar</button>
              <button className="flex-1 sm:flex-none bg-[#f59e0b] text-[#0f172a] px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg hover:bg-[#d97706] transition">Exportar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="overflow-x-auto bg-white rounded-xl shadow fade-in-up">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[#94a3b8] bg-[#f8fafc]">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Fecha de nacimiento</th>
                <th className="py-3 px-4">Ministerio</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-6 text-center text-[#94a3b8]">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#94a3b8]">No hay miembros registrados.</td>
                </tr>
              ) : (
                filtered.map((m, i) => (
                  <tr key={m.id || i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition duration-150 ease-out">
                    <td className="py-3 px-4 font-medium text-[#0f172a]">{m.name}</td>
                    <td className="py-3 px-4 text-[#334155]">{m.birth}</td>
                    <td className="py-3 px-4 text-[#334155]">{m.ministry}</td>
                    <td className="py-3 px-4 text-[#334155]">{m.role}</td>
                    <td className="py-3 px-4 text-[#334155]">{m.phone}</td>
                    <td className="py-3 px-4">
                      <button className="text-[#0ea5e9] font-semibold hover:underline" onClick={() => handleEdit(m)}>Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-3 md:hidden mt-4 fade-in-up-delayed">
        {loading ? (
          <div className="text-center text-[#94a3b8]">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#94a3b8]">No hay miembros registrados.</div>
        ) : (
          filtered.map((m, i) => (
            <div key={m.id || i} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-[#0f172a]">{m.name}</p>
                  <p className="text-sm text-[#475569]">{m.role || 'Sin rol'}</p>
                </div>
                <button className="text-sm text-[#0ea5e9] font-semibold" onClick={() => handleEdit(m)}>Editar</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-[#475569]">
                <span className="font-medium text-[#0f172a]">Nacimiento:</span><span>{m.birth || '—'}</span>
                <span className="font-medium text-[#0f172a]">Ministerio:</span><span>{m.ministry || '—'}</span>
                <span className="font-medium text-[#0f172a]">Teléfono:</span><span>{m.phone || '—'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Membership;
