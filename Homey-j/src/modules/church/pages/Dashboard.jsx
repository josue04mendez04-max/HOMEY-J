

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listChurches } from '../../../core/data/churchesService';
import { getMinistries } from '../../../core/data/superAdminConfigService';

function Dashboard() {
  const navigate = useNavigate();
  const { churchId } = useParams();
  const [church, setChurch] = useState(null);
  const [ministries, setMinistries] = useState([]);

  const slugify = (name) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

  useEffect(() => {
    async function fetchData() {
      const churches = await listChurches();
      const found = churches.find(c => c.id === churchId);
      setChurch(found);
      const mins = await getMinistries();
      setMinistries(mins);
    }
    fetchData();
  }, [churchId]);

  const goTo = (path) => () => {
    navigate(`/app/${churchId}/${path}`);
  };

  return (
    <div className="flex flex-col items-center min-h-[90vh] px-2 py-6 bg-bank-50">
      <div className="w-full max-w-3xl">
        {/* Estado y bienvenida */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 flex flex-col items-center">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-300">{church?.isLocked ? 'PORTAL ACTIVO' : 'PORTAL INACTIVO'}</span>
          </div>
          <h1 className="text-3xl font-bold mb-1 text-bank-900">Bienvenido a <span className="text-green-600">{church?.name || 'Iglesia'}</span></h1>
          <p className="text-bank-700 text-base">¿Qué deseas hacer hoy? Accede a las herramientas y reporta tus actividades espirituales semanales.</p>
        </div>

        {/* Lo más importante */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-green-500 rounded-2xl p-6 flex flex-col justify-between shadow-lg text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block bg-white/20 rounded-full p-2">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M6 2a1 1 0 0 0-1 1v18a1 1 0 0 0 1.447.894l5.553-2.776 5.553 2.776A1 1 0 0 0 20 21V3a1 1 0 0 0-1-1H6Zm1 2h10v15.382l-4.553-2.276a1 1 0 0 0-.894 0L7 19.382V4Z"/></svg>
              </span>
              <div>
                <div className="font-bold text-lg">Enviar Reporte Semanal</div>
                <div className="text-white/90 text-sm">Llena tu reporte de actividades espirituales para la semana actual. Se debe completar cada lunes.</div>
              </div>
            </div>
            <button className="mt-4 py-3 px-6 rounded-xl bg-white text-green-700 font-bold text-lg shadow hover:bg-green-100 transition" onClick={goTo('reports')}>Iniciar Nuevo Reporte</button>
          </div>
          <button
            type="button"
            className="bg-white rounded-2xl p-6 flex flex-col justify-between shadow border border-bank-100 text-left hover:bg-bank-50 transition cursor-pointer"
            onClick={goTo('')}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block bg-bank-100 rounded-full p-2">
                {/* Icono de panel de control */}
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3 13a9 9 0 1 1 18 0h-2a7 7 0 1 0-14 0H3Zm7-2a2 2 0 1 1 4 0v4a2 2 0 1 1-4 0v-4Zm-4 2a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2Zm10 0a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2Z"/>
                </svg>
              </span>
              <div>
                <div className="font-bold text-base text-bank-900">Panel de Control</div>
                <div className="text-bank-500 text-xs">Estadísticas de la iglesia, miembros y reportes de ministerios.</div>
              </div>
            </div>
            <div className="mt-4 py-2 px-4 rounded-xl bg-bank-900 text-white font-semibold text-base shadow inline-block w-fit">Abrir Panel de Control</div>
          </button>
          <button
            type="button"
            className="bg-white rounded-2xl p-6 flex flex-col justify-between shadow border border-bank-100 text-left hover:bg-bank-50 transition cursor-pointer"
            onClick={goTo('membership')}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block bg-bank-100 rounded-full p-2">
                {/* Icono membresía */}
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5.006 5.006 0 0 0 5 5Zm0 2c-3.337 0-10 1.667-10 5v2h20v-2c0-3.333-6.663-5-10-5Z"/>
                </svg>
              </span>
              <div>
                <div className="font-bold text-base text-bank-900">Membresía</div>
                <div className="text-bank-500 text-xs">Gestiona miembros, roles y ministerios.</div>
              </div>
            </div>
            <div className="mt-4 py-2 px-4 rounded-xl bg-bank-900 text-white font-semibold text-base shadow inline-block w-fit">Abrir Membresía</div>
          </button>
        </div>

        {/* Acceso para líderes de ministerio */}
        <div className="mb-6">
          <div className="font-semibold text-bank-700 mb-2">ACCESO PARA LÍDERES DE MINISTERIO</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ministries.map((ministry, idx) => (
              <button
                key={ministry}
                className="bg-white rounded-xl border border-bank-100 shadow p-4 flex flex-col items-center hover:bg-bank-50 transition"
                onClick={() => navigate(`/app/${churchId}/leadership?sector=${slugify(ministry)}`)}
              >
                <span className="font-bold text-bank-900 text-base mb-1">{ministry}</span>
                <span className="text-xs text-bank-500">Ministerio de {ministry}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secretaría y Tesorería */}
        <div className="mb-6">
          <div className="font-semibold text-bank-700 mb-2">SECRETARÍA Y TESORERÍA</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              className="bg-white rounded-xl border border-bank-100 shadow p-4 flex flex-col items-center hover:bg-bank-50 transition"
              onClick={goTo('treasury')}
            >
              <span className="font-bold text-bank-900 text-base mb-1">Tesorería</span>
              <span className="text-xs text-bank-500">Contabilidad y Finanzas</span>
            </button>
          </div>
        </div>

        {/* Soporte */}
        <div className="bg-green-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between text-white">
          <div>
            <div className="font-bold text-lg mb-1">¿Necesitas Ayuda?</div>
            <div className="text-green-100 text-sm">Si tienes problemas para tu reporte o necesitas actualizar información de la iglesia, da click para contactar al equipo de soporte.</div>
          </div>
          <button className="mt-4 sm:mt-0 py-2 px-6 rounded-xl bg-green-600 text-white font-bold text-base shadow hover:bg-green-700 transition" onClick={() => window.open('mailto:soporte@homeyj.com', '_blank')}>Contactar Soporte</button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
