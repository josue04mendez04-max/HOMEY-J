
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { listChurches, toggleLock } from '../../../core/data/churchesService.js'
import { db } from '../../../core/firebase'
import { doc, updateDoc } from 'firebase/firestore'

function Dashboard() {
  const { churchId } = useParams()
  const navigate = useNavigate()
  const [churchName, setChurchName] = useState('')
  const [step, setStep] = useState('welcome') // welcome | loading | form | extra | loading2
  const [locked, setLocked] = useState(false)
  const [loadingTextIdx, setLoadingTextIdx] = useState(0)
  const [pastorName, setPastorName] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [totalMembers, setTotalMembers] = useState('')
  const loadingTexts = [
    'Arreglando las redes...',
    'Buscando frutos...',
    'Contactando a Filadelphia...',
    'Charlando con los Apóstoles...',
    'Terminando de alistar todo...'
  ]
  const loadingTexts2 = [
    'Guardando información...',
    'Sincronizando con la nube...',
    'Preparando tu panel...',
    '¡Listo para comenzar!'
  ]


  useEffect(() => {
    async function fetchName() {
      const churches = await listChurches()
      const found = churches.find(c => c.id === churchId)
      setChurchName(found?.name || 'Iglesia')
      if (found?.isLocked) {
        setLocked(true)
        navigate(`/app/${churchId}`)
      }
    }
    fetchName()
  }, [churchId, navigate])

  // Animación de loading más lenta
  useEffect(() => {
    if (step === 'loading' && loadingTextIdx < loadingTexts.length - 1) {
      const t = setTimeout(() => setLoadingTextIdx(idx => idx + 1), 2200)
      return () => clearTimeout(t)
    }
    if (step === 'loading' && loadingTextIdx === loadingTexts.length - 1) {
      const t = setTimeout(() => setStep('form'), 2500)
      return () => clearTimeout(t)
    }
    if (step === 'loading2' && loadingTextIdx < loadingTexts2.length - 1) {
      const t = setTimeout(() => setLoadingTextIdx(idx => idx + 1), 1800)
      return () => clearTimeout(t)
    }
    if (step === 'loading2' && loadingTextIdx === loadingTexts2.length - 1) {
      const t = setTimeout(() => {
        // Redirigir a Panel de Control
        navigate(`/app/${churchId}`)
      }, 2200)
      return () => clearTimeout(t)
    }
  }, [step, loadingTextIdx, navigate, churchId])

  function handleStart() {
    setStep('loading')
    setLoadingTextIdx(0)
  }


  async function handleFormSubmit(e) {
    e.preventDefault()
    // Guardar nombre y contraseña en /churches_registry
    const ref = doc(db, 'churches_registry', churchId)
    await updateDoc(ref, {
      pastorName,
      password,
      estado: 'Activo',
    })
    // Bloquear dashboard para siempre
    await toggleLock({ id: churchId, isLocked: true })
    setStep('extra')
  }

  async function handleExtraSubmit(e) {
    e.preventDefault()
    // Guardar dirección y total de miembros
    const ref = doc(db, 'churches_registry', churchId)
    await updateDoc(ref, {
      address,
      totalMembers,
    })
    setStep('loading2')
    setLoadingTextIdx(0)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-white/80 rounded-[24px] shadow-bankSoft p-8 max-w-xl w-full text-center">
        {step === 'welcome' && (
          <>
            <h1 className="text-3xl font-serif font-bold mb-2 text-bank-900 drop-shadow">¡Bienvenido a {churchName}!</h1>
            <p className="text-bank-700 text-lg mb-6">Este es tu panel principal de gestión para la iglesia.</p>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-bank-800">¿Qué es Homey'J?</h2>
              <p className="text-bank-600 mb-2">Homey'J es un sistema integral para la administración de iglesias, diseñado para facilitar la gestión de membresía, liderazgo, tesorería y reportes de manera segura y eficiente.</p>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1 text-bank-700">Novedades</h2>
              <ul className="text-bank-600 text-left mx-auto max-w-md list-disc list-inside">
                <li>Nuevo diseño visual moderno y amigable</li>
                <li>Gestión de miembros y liderazgo por sectores</li>
                <li>Panel de tesorería con control de ofrendas y gastos</li>
                <li>Reportes automáticos y acceso seguro</li>
              </ul>
            </div>
            <button
              className="mt-4 px-8 py-3 rounded-full bg-green-500 text-white font-semibold shadow-bankSoft hover:bg-green-600 transition text-lg"
              onClick={handleStart}
            >
              Iniciar
            </button>
          </>
        )}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="80" height="80" className="mx-auto">
                <path fill="#1160FF" stroke="#1160FF" strokeWidth="15" transformOrigin="center" d="m148 84.7 13.8-8-10-17.3-13.8 8a50 50 0 0 0-27.4-15.9v-16h-20v16A50 50 0 0 0 63 67.4l-13.8-8-10 17.3 13.8 8a50 50 0 0 0 0 31.7l-13.8 8 10 17.3 13.8-8a50 50 0 0 0 27.5 15.9v16h20v-16a50 50 0 0 0 27.4-15.9l13.8 8 10-17.3-13.8-8a50 50 0 0 0 0-31.7Zm-47.5 50.8a35 35 0 1 1 0-70 35 35 0 0 1 0 70Z">
                  <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2s" values="0;120" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite" />
                </path>
              </svg>
            </div>
            <div className="text-bank-700 text-lg font-semibold mb-2 min-h-[2.5em]">
              {loadingTexts[loadingTextIdx]}
            </div>
            <div className="text-bank-400 text-sm">Por favor espera un momento...</div>
          </div>
        )}
        {step === 'form' && (
          <form className="flex flex-col items-center gap-4" onSubmit={handleFormSubmit}>
            <h2 className="text-2xl font-bold text-bank-900 mb-2">¡Bienvenido!</h2>
            <p className="text-bank-700 mb-2">Para comenzar, crea una contraseña y registra tu nombre (principalmente el pastor).</p>
            <input
              className="w-full max-w-xs rounded-full border border-bank-200 px-4 py-2 text-bank-900 focus:outline-none focus:ring-2 focus:ring-bank-400"
              type="text"
              placeholder="Nombre del pastor"
              value={pastorName}
              onChange={e => setPastorName(e.target.value)}
              required
            />
            <input
              className="w-full max-w-xs rounded-full border border-bank-200 px-4 py-2 text-bank-900 focus:outline-none focus:ring-2 focus:ring-bank-400"
              type="password"
              placeholder="Crea una contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div className="text-xs text-bank-500 mb-2">Estos datos se pueden editar en el futuro desde la configuración.</div>
            <button
              type="submit"
              className="mt-2 px-6 py-2 rounded-full bg-green-500 text-white font-semibold shadow-bankSoft hover:bg-green-600 transition"
            >
              Continuar
            </button>
          </form>
        )}
        {step === 'extra' && (
          <form className="flex flex-col items-center gap-4" onSubmit={handleExtraSubmit}>
            <h2 className="text-xl font-bold text-bank-900 mb-2">Un par de datos más</h2>
            <input
              className="w-full max-w-xs rounded-full border border-bank-200 px-4 py-2 text-bank-900 focus:outline-none focus:ring-2 focus:ring-bank-400"
              type="text"
              placeholder="Dirección de la iglesia"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
            />
            <input
              className="w-full max-w-xs rounded-full border border-bank-200 px-4 py-2 text-bank-900 focus:outline-none focus:ring-2 focus:ring-bank-400"
              type="number"
              min="1"
              placeholder="Total de miembros"
              value={totalMembers}
              onChange={e => setTotalMembers(e.target.value)}
              required
            />
            <div className="text-xs text-bank-500 mb-2">Estos datos también se pueden editar después.</div>
            <button
              type="submit"
              className="mt-2 px-6 py-2 rounded-full bg-green-500 text-white font-semibold shadow-bankSoft hover:bg-green-600 transition"
            >
              Continuar
            </button>
          </form>
        )}
        {step === 'loading2' && (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="80" height="80" className="mx-auto">
                <path fill="#1160FF" stroke="#1160FF" strokeWidth="15" transformOrigin="center" d="m148 84.7 13.8-8-10-17.3-13.8 8a50 50 0 0 0-27.4-15.9v-16h-20v16A50 50 0 0 0 63 67.4l-13.8-8-10 17.3 13.8 8a50 50 0 0 0 0 31.7l-13.8 8 10 17.3 13.8-8a50 50 0 0 0 27.5 15.9v16h20v-16a50 50 0 0 0 27.4-15.9l13.8 8 10-17.3-13.8-8a50 50 0 0 0 0-31.7Zm-47.5 50.8a35 35 0 1 1 0-70 35 35 0 0 1 0 70Z">
                  <animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2s" values="0;120" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite" />
                </path>
              </svg>
            </div>
            <div className="text-bank-700 text-lg font-semibold mb-2 min-h-[2.5em]">
              {loadingTexts2[loadingTextIdx]}
            </div>
            <div className="text-bank-400 text-sm">Finalizando configuración...</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard;
