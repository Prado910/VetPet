import React, { useEffect, useState } from 'react';
import { Database, Table2, Key, Zap, Eye, GitBranch, Activity, Server } from 'lucide-react';

const API = 'http://localhost:3000/api/diccionario';

const TIPO_COLOR: Record<string, string> = {
  TABLE:        'bg-blue-100 text-blue-800',
  'PACKAGE':    'bg-purple-100 text-purple-800',
  'PACKAGE BODY':'bg-purple-50 text-purple-700',
  SEQUENCE:     'bg-amber-100 text-amber-800',
  TRIGGER:      'bg-red-100 text-red-800',
  VIEW:         'bg-green-100 text-green-800',
  TYPE:         'bg-gray-100 text-gray-700',
  INDEX:        'bg-sky-100 text-sky-800',
};

const CONSTRAINT_TIPO: Record<string, string> = {
  P: 'PRIMARY KEY',
  R: 'FOREIGN KEY',
  C: 'CHECK / NOT NULL',
  U: 'UNIQUE',
};

function Badge({ text, cls }: { text: string; cls?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls ?? 'bg-gray-100 text-gray-700'}`}>
      {text}
    </span>
  );
}

type Tab = 'objetos' | 'tablas' | 'secuencias' | 'triggers' | 'vistas' | 'rendimiento';

export function DiccDatos() {
  const [tab, setTab] = useState<Tab>('objetos');

  // ── objetos ──────────────────────────────────────────────────────────────
  const [objetos, setObjetos] = useState<any[]>([]);
  const [loadObjetos, setLoadObjetos] = useState(false);

  // ── tablas ───────────────────────────────────────────────────────────────
  const [tablas, setTablas] = useState<any[]>([]);
  const [tablaSelec, setTablaSelec] = useState('');
  const [columnas, setColumnas] = useState<any[]>([]);
  const [restricciones, setRestricciones] = useState<any[]>([]);
  const [loadTablas, setLoadTablas] = useState(false);

  // ── secuencias ───────────────────────────────────────────────────────────
  const [secuencias, setSecuencias] = useState<any[]>([]);

  // ── triggers ─────────────────────────────────────────────────────────────
  const [triggers, setTriggers] = useState<any[]>([]);
  const [triggerAbierto, setTriggerAbierto] = useState('');

  // ── vistas ───────────────────────────────────────────────────────────────
  const [vistas, setVistas] = useState<any[]>([]);

  // ── rendimiento ──────────────────────────────────────────────────────────
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [sqlCostosos, setSqlCostosos] = useState<any[]>([]);
  const [version, setVersion] = useState<any[]>([]);
  const [loadRend, setLoadRend] = useState(false);

  // ── fetchers ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'objetos' && objetos.length === 0) {
      setLoadObjetos(true);
      fetch(`${API}/objetos`).then(r => r.json()).then(setObjetos).finally(() => setLoadObjetos(false));
    }
    if (tab === 'tablas' && tablas.length === 0) {
      setLoadTablas(true);
      fetch(`${API}/tablas`).then(r => r.json()).then(setTablas).finally(() => setLoadTablas(false));
    }
    if (tab === 'secuencias' && secuencias.length === 0) {
      fetch(`${API}/secuencias`).then(r => r.json()).then(setSecuencias);
    }
    if (tab === 'triggers' && triggers.length === 0) {
      fetch(`${API}/triggers`).then(r => r.json()).then(setTriggers);
    }
    if (tab === 'vistas' && vistas.length === 0) {
      fetch(`${API}/vistas`).then(r => r.json()).then(setVistas);
    }
    if (tab === 'rendimiento' && sesiones.length === 0) {
      setLoadRend(true);
      Promise.all([
        fetch(`${API}/rendimiento/sesiones`).then(r => r.json()),
        fetch(`${API}/rendimiento/sql-costosos`).then(r => r.json()),
        fetch(`${API}/rendimiento/version`).then(r => r.json()),
      ]).then(([s, sq, v]) => { setSesiones(s); setSqlCostosos(sq); setVersion(v); })
        .finally(() => setLoadRend(false));
    }
  }, [tab]);

  const cargarTabla = (tabla: string) => {
    setTablaSelec(tabla);
    setColumnas([]);
    setRestricciones([]);
    Promise.all([
      fetch(`${API}/columnas/${tabla}`).then(r => r.json()),
      fetch(`${API}/restricciones/${tabla}`).then(r => r.json()),
    ]).then(([cols, rest]) => { setColumnas(cols); setRestricciones(rest); });
  };

  // ── tabs config ──────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'objetos',      label: 'Objetos del Esquema', icon: <Database className="w-4 h-4" /> },
    { id: 'tablas',       label: 'Tablas y Columnas',   icon: <Table2 className="w-4 h-4" /> },
    { id: 'secuencias',   label: 'Secuencias',           icon: <GitBranch className="w-4 h-4" /> },
    { id: 'triggers',     label: 'Triggers',             icon: <Zap className="w-4 h-4" /> },
    { id: 'vistas',       label: 'Vistas',               icon: <Eye className="w-4 h-4" /> },
    { id: 'rendimiento',  label: 'Rendimiento (V$)',     icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diccionario de Datos</h1>
          <p className="text-sm text-gray-500">Metadatos del esquema VetPet — USER_ y V$</p>
        </div>
      </div>

      {/* tab bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── OBJETOS ─────────────────────────────────────────────────────── */}
      {tab === 'objetos' && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Vista <code className="bg-gray-100 px-1 rounded">USER_OBJECTS</code> — todos los objetos creados en el esquema VetPet.
          </p>
          {loadObjetos ? <p className="text-gray-400">Cargando…</p> : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Nombre','Tipo','Fecha creación','Estado'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {objetos.map((o, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-800">{o.nombre}</td>
                      <td className="px-4 py-2"><Badge text={o.tipo} cls={TIPO_COLOR[o.tipo]} /></td>
                      <td className="px-4 py-2 text-gray-500">{o.fechaCreacion}</td>
                      <td className="px-4 py-2">
                        <Badge text={o.estado} cls={o.estado === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TABLAS ──────────────────────────────────────────────────────── */}
      {tab === 'tablas' && (
        <div className="grid grid-cols-3 gap-4">
          {/* lista tablas */}
          <div className="col-span-1 space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
              USER_TABLES ({tablas.length})
            </p>
            {loadTablas ? <p className="text-gray-400 text-sm">Cargando…</p> : (
              <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-[60vh]">
                {tablas.map((t: any) => (
                  <button
                    key={t.tabla}
                    onClick={() => cargarTabla(t.tabla)}
                    className={`w-full text-left px-3 py-2 text-sm font-mono border-b border-gray-100 last:border-0 transition-colors ${
                      tablaSelec === t.tabla ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    {t.tabla}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* detalle */}
          <div className="col-span-2 space-y-4">
            {!tablaSelec && (
              <p className="text-gray-400 text-sm mt-4">← Selecciona una tabla para ver sus columnas y restricciones</p>
            )}

            {tablaSelec && columnas.length > 0 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Columnas — USER_TAB_COLUMNS
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['#','Columna','Tipo','Long.','Nulo','Default'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {columnas.map((c: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 text-gray-400">{c.orden}</td>
                            <td className="px-3 py-1.5 font-mono text-gray-800">{c.columna}</td>
                            <td className="px-3 py-1.5"><Badge text={c.tipo} cls="bg-blue-50 text-blue-700" /></td>
                            <td className="px-3 py-1.5 text-gray-500">{c.longitud}</td>
                            <td className="px-3 py-1.5">
                              <Badge text={c.nulo === 'Y' ? 'NULL' : 'NOT NULL'} cls={c.nulo === 'Y' ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-orange-700'} />
                            </td>
                            <td className="px-3 py-1.5 text-gray-400 font-mono text-xs">{c.valorDefault ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Restricciones — USER_CONSTRAINTS
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['Nombre','Tipo','Columna','Condición / Referencia','Estado'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {restricciones.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 font-mono text-xs text-gray-700">{r.nombre}</td>
                            <td className="px-3 py-1.5">
                              <Badge text={CONSTRAINT_TIPO[r.tipo] ?? r.tipo}
                                cls={r.tipo==='P'?'bg-yellow-100 text-yellow-800':r.tipo==='R'?'bg-blue-100 text-blue-800':r.tipo==='U'?'bg-purple-100 text-purple-800':'bg-gray-100 text-gray-700'} />
                            </td>
                            <td className="px-3 py-1.5 font-mono text-xs">{r.columna ?? '—'}</td>
                            <td className="px-3 py-1.5 text-xs text-gray-500">{r.condicion ?? r.referenciaA ?? '—'}</td>
                            <td className="px-3 py-1.5">
                              <Badge text={r.estado} cls={r.estado==='ENABLED'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SECUENCIAS ──────────────────────────────────────────────────── */}
      {tab === 'secuencias' && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Vista <code className="bg-gray-100 px-1 rounded">USER_SEQUENCES</code> — ambas con NOCACHE para persistir LAST_NUMBER.
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Nombre','Min','Max','Incremento','Cache','Ciclo','Siguiente disponible'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {secuencias.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono font-semibold text-amber-700">{s.nombre}</td>
                    <td className="px-4 py-2">{s.minValor}</td>
                    <td className="px-4 py-2">{s.maxValor}</td>
                    <td className="px-4 py-2">{s.incremento}</td>
                    <td className="px-4 py-2"><Badge text={String(s.cache)} /></td>
                    <td className="px-4 py-2"><Badge text={s.ciclo} /></td>
                    <td className="px-4 py-2 font-mono font-bold text-indigo-700">{s.siguienteDisponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRIGGERS ────────────────────────────────────────────────────── */}
      {tab === 'triggers' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Vista <code className="bg-gray-100 px-1 rounded">USER_TRIGGERS</code> — haz clic en un trigger para ver su cuerpo.
          </p>
          {triggers.map((t: any, i: number) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setTriggerAbierto(triggerAbierto === t.nombre ? '' : t.nombre)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="font-mono font-semibold text-sm text-gray-800">{t.nombre}</span>
                  <Badge text={t.tipo} cls="bg-red-50 text-red-700" />
                  <Badge text={t.evento} cls="bg-orange-50 text-orange-700" />
                  <span className="text-xs text-gray-500">→ {t.tabla}</span>
                </div>
                <Badge text={t.estado} cls={t.estado==='ENABLED'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'} />
              </button>
              {triggerAbierto === t.nombre && (
                <pre className="bg-gray-900 text-green-400 text-xs p-4 overflow-x-auto whitespace-pre-wrap">
                  {t.cuerpo}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── VISTAS ──────────────────────────────────────────────────────── */}
      {tab === 'vistas' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Vista <code className="bg-gray-100 px-1 rounded">USER_VIEWS</code> — definición SQL almacenada en el Diccionario de Datos.
          </p>
          {vistas.map((v: any, i: number) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="font-mono font-semibold text-green-800">{v.nombre}</span>
                <span className="text-xs text-gray-500">{v.longitudTexto} caracteres</span>
              </div>
              <pre className="bg-gray-900 text-green-400 text-xs p-4 overflow-x-auto whitespace-pre-wrap">
                {v.definicion}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* ── RENDIMIENTO ─────────────────────────────────────────────────── */}
      {tab === 'rendimiento' && (
        <div className="space-y-6">
          {loadRend && <p className="text-gray-400">Cargando vistas V$…</p>}

          {/* V$VERSION */}
          {version.length > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
              <Server className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs text-indigo-500 font-semibold">V$VERSION</p>
                <p className="text-sm font-mono text-indigo-900">{version[0]?.banner}</p>
              </div>
            </div>
          )}

          {/* V$SESSION */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              V$SESSION — Sesiones activas ({sesiones.length})
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['SID','Usuario','Estado','Programa','Hora conexión','Máquina'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sesiones.length === 0 && !loadRend && (
                    <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-400">Sin sesiones activas o sin privilegio en V$SESSION</td></tr>
                  )}
                  {sesiones.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono">{s.sid}</td>
                      <td className="px-3 py-1.5 font-semibold">{s.usuario}</td>
                      <td className="px-3 py-1.5"><Badge text={s.estado} cls={s.estado==='ACTIVE'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'} /></td>
                      <td className="px-3 py-1.5 text-xs text-gray-500">{s.programa}</td>
                      <td className="px-3 py-1.5 text-xs">{s.horaConexion}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-400">{s.maquina}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* V$SQL */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              V$SQL — Top 10 sentencias más costosas del esquema
            </p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['SQL','Ejecuciones','Seg. totales','Seg./ejecución','Lecturas'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sqlCostosos.length === 0 && !loadRend && (
                    <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">Sin datos en V$SQL o sin privilegio</td></tr>
                  )}
                  {sqlCostosos.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-700 max-w-xs truncate" title={s.sqlTexto}>{s.sqlTexto}</td>
                      <td className="px-3 py-1.5">{s.ejecuciones}</td>
                      <td className="px-3 py-1.5 font-semibold text-red-600">{s.segundosTotales}</td>
                      <td className="px-3 py-1.5">{s.segundosPorEjecucion}</td>
                      <td className="px-3 py-1.5">{s.lecturas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}