"use client";
import React, { useState, useEffect } from 'react';

interface CasoAsignado {
  id: string;
  cliente: string;
  estado: string;
  formulario: string;
  pdfOriginalPath: string;
  estatus: string;
}

export default function CPADashboardPage() {
  const [email, setEmail] = useState('carlos.mendoza@highub.com'); // Simulación de sesión
  const [cpaData, setCpaData] = useState({
    nombre: 'Carlos Mendoza',
    codigo: 'CPA-NY-12345',
    ptin: 'PTIN-654321',
    estado: 'NY'
  });

  const [casos, setCasos] = useState<CasoAsignado[]>([
    { id: '101', cliente: 'JUAN_PEREZ', estado: 'NY', formulario: '1040', pdfOriginalPath: 'declaracion_juan.pdf', estatus: 'PENDIENTE' },
    { id: '102', cliente: 'ALICE_SMITH', estado: 'NY', formulario: '1040', pdfOriginalPath: 'declaracion_alice.pdf', estatus: 'PENDIENTE' },
    { id: '103', cliente: 'ROBERT_CA', estado: 'CA', formulario: '1040', pdfOriginalPath: 'declaracion_robert.pdf', estatus: 'PENDIENTE' },
  ]);

  const [firmaPng, setFirmaPng] = useState<string>('firma_digitalizada_render.png');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  // Filtrar casos automáticos por el estado asignado del CPA
  const casosFiltrados = casos.filter(caso => caso.estado === cpaData.estado);

  const ejecutarFirma = async (caso: CasoAsignado) => {
    setProcesandoId(caso.id);
    setMensaje(null);

    try {
      const response = await fetch('/api/cpa/firmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfPath: caso.pdfOriginalPath,
          nombreCpa: cpaData.nombre,
          codigoCpa: cpaData.codigo,
          ptin: cpaData.ptin,
          estado: caso.estado,
          cliente: caso.cliente,
          firmaPng: firmaPng
        })
      });

      const resultado = await response.json();

      if (response.ok) {
        setMensaje({ texto: `¡Caso de ${caso.cliente} firmado! Se ha procesado tu comisión de $45.`, tipo: 'success' });
        // Actualizar el estado de la UI localmente (Bloquear preliminar)
        setCasos(prev => prev.map(c => c.id === caso.id ? { ...c, estatus: 'FIRMADO' } : c));
      } else {
        setMensaje({ texto: resultado.error || 'Error al procesar la firma', tipo: 'error' });
      }
    } catch (err) {
      setMensaje({ texto: 'Error de conexión con el motor de firma.', tipo: 'error' });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen text-gray-800">
      {/* Encabezado Perfil */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">CPA Autenticado</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{cpaData.nombre}</h1>
          <p className="text-sm text-gray-500">{email} • Jurisdicción: <span className="font-bold">{cpaData.estado}</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div><span className="text-gray-400">Licencia:</span> <p className="font-bold text-gray-900">{cpaData.codigo}</p></div>
          <div><span className="text-gray-400">PTIN:</span> <p className="font-bold text-gray-900">{cpaData.ptin}</p></div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && (
        <div className={`p-4 mb-6 rounded-lg font-medium text-sm border ${
          mensaje.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      {/* Listado de Casos */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Casos Asignados en tu Estado ({cpaData.estado})</h2>
      <div className="grid grid-cols-1 gap-4">
        {casosFiltrados.map((caso) => (
          <div key={caso.id} className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400">ID: {caso.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-sm font-bold ${
                  caso.estatus === 'FIRMADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>{caso.estatus}</span>
              </div>
              <p className="text-base font-bold text-gray-900 mt-1">Formulario {caso.formulario} — {caso.cliente.replace('_', ' ')}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">Archivo: {caso.pdfOriginalPath}</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              {caso.estatus === 'FIRMADO' ? (
                <div className="text-right">
                  <span className="text-emerald-600 font-bold text-sm block">✓ Completado</span>
                  <span className="text-xs text-gray-400 font-medium">+$45 USD Acumulados</span>
                </div>
              ) : (
                <button
                  onClick={() => ejecutarFirma(caso)}
                  disabled={procesandoId !== null}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-xs"
                >
                  {procesandoId === caso.id ? 'Estampando firma...' : 'Firmar y Ganar $45'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
