import { useState } from 'react';
import {
  Activity,
  MapPin,
  Smartphone,
  Wifi,
  Ban,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Radio,
  CreditCard
} from 'lucide-react';
import { INITIAL_DEMO_SUBSCRIBERS, type DemoSubscriber } from '../data/proposalData';

type DemoTab = 'noc' | 'gis' | 'android';

interface AuditEntry {
  id: string;
  time: string;
  message: string;
}

export function OperationalDemoSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>('noc');
  const [subscribers, setSubscribers] = useState<DemoSubscriber[]>(INITIAL_DEMO_SUBSCRIBERS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_DEMO_SUBSCRIBERS[0].id);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [queuedOfflineActions, setQueuedOfflineActions] = useState<number>(0);
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    {
      id: 'init-1',
      time: '10:18:04',
      message: 'Colector Go (SNMPv3) sincronizó 4 CPEs activos vía túnel WireGuard 10.250.0.0/16.'
    },
    {
      id: 'init-2',
      time: '10:22:31',
      message: 'CLI-1089 agregado automáticamente a address-list=wisp_morosos (aviso de pago).'
    }
  ]);

  const selected = subscribers.find((s) => s.id === selectedId) ?? subscribers[0];

  const appendLog = (message: string) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    setAuditLogs((prev) => [{ id: `${Date.now()}-${Math.random()}`, time, message }, ...prev].slice(0, 6));
  };

  const applySubscriberStatus = (targetId: string, nextStatus: DemoSubscriber['status'], reason: string) => {
    setSubscribers((prev) =>
      prev.map((sub) => {
        if (sub.id !== targetId) return sub;
        if (nextStatus === 'Activo') {
          const restoredDown = sub.id === 'CLI-1124' ? 118.5 : sub.id === 'CLI-1042' ? 74.2 : 44.8;
          const restoredUp = Math.round(restoredDown * 0.42 * 10) / 10;
          return {
            ...sub,
            status: 'Activo',
            balanceDue: 0,
            downloadMbps: restoredDown,
            uploadMbps: restoredUp,
            historyMbps: [...sub.historyMbps.slice(1), restoredDown]
          };
        }
        if (nextStatus === 'Mora (Aviso)') {
          return {
            ...sub,
            status: 'Mora (Aviso)',
            balanceDue: sub.balanceDue > 0 ? sub.balanceDue : 45.0,
            downloadMbps: 0.4,
            uploadMbps: 0.2,
            historyMbps: [...sub.historyMbps.slice(1), 0.4]
          };
        }
        return {
          ...sub,
          status: 'Suspendido',
          balanceDue: sub.balanceDue > 0 ? sub.balanceDue : 45.0,
          downloadMbps: 0,
          uploadMbps: 0,
          historyMbps: [...sub.historyMbps.slice(1), 0]
        };
      })
    );
    appendLog(`${targetId}: ${reason}`);
  };

  const handleFieldPing = () => {
    const jitter = (Math.random() * 1.4 - 0.5).toFixed(1);
    const measured = Math.max(2.1, Number((selected.latencyMs + Number(jitter)).toFixed(1)));
    setPingResult(`4/4 paquetes · Promedio ${measured} ms · Señal ${selected.signalDbm} dBm`);
    appendLog(`App Android ejecutó diagnóstico ICMP hacia ${selected.ip} (${measured} ms).`);
  };

  const handleOfflineAction = () => {
    if (offlineMode) {
      setQueuedOfflineActions((c) => c + 1);
      appendLog(
        `App Android (Modo Offline): orden de instalación/cobro para ${selected.id} guardada en SQLite cifrado.`
      );
    } else {
      applySubscriberStatus(
        selected.id,
        'Activo',
        'Cobro en sitio sincronizado desde App Android -> Reconexión automática en MikroTik.'
      );
    }
  };

  const handleToggleOffline = () => {
    if (offlineMode && queuedOfflineActions > 0) {
      appendLog(
        `Sincronización automática completada: ${queuedOfflineActions} operaciones offline enviadas con clave idempotente.`
      );
      setQueuedOfflineActions(0);
    }
    setOfflineMode((prev) => !prev);
  };

  // Build SVG polyline path for throughput
  const maxMbps = Math.max(120, ...selected.historyMbps);
  const throughputPoints = selected.historyMbps
    .map((val, idx) => {
      const x = (idx / (selected.historyMbps.length - 1)) * 320;
      const y = 92 - (val / maxMbps) * 76;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const statusTextStyle = (status: DemoSubscriber['status']) => {
    if (status === 'Activo') return 'text-[#16A34A]';
    if (status === 'Mora (Aviso)') return 'text-[#D97706]';
    return 'text-[#DC2626]';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-500">
            Sección 06 · Prototipo Interactivo de Referencia
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Simulación Operativa del Ecosistema WISP
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Prueba en vivo cómo interactúan el panel NOC de telemetría MikroTik, el mapa GIS de torres y CPEs
            y la aplicación Android de técnicos de campo sobre el mismo estado de clientes.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('noc')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'noc' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Panel NOC y MikroTik</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gis')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'gis' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Mapa GIS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Android Campo</span>
          </button>
        </div>
      </div>

      {/* TAB 1: NOC & Telemetry */}
      {activeTab === 'noc' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Subscriber Table */}
          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Suscriptores Monitoreados (SNMPv3 + RouterOS v7)
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {subscribers.filter((s) => s.status === 'Activo').length}/{subscribers.length} activos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Cliente / IP</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Descarga</th>
                    <th className="py-2.5 px-4 text-right">Latencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscribers.map((sub) => {
                    const isSelected = sub.id === selected.id;
                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedId(sub.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{sub.name}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {sub.id} · {sub.ip}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`font-semibold ${statusTextStyle(sub.status)}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                          {sub.downloadMbps.toFixed(1)} Mbps
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {sub.latencyMs.toFixed(1)} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Subscriber Telemetry + Live MikroTik Action Controls */}
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <div className="pb-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  {selected.id} · {selected.router}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selected.name}</h3>
                <div className="text-xs text-slate-600 mt-0.5">{selected.plan}</div>
              </div>
              <div className={`text-xs font-semibold shrink-0 ${statusTextStyle(selected.status)}`}>
                {selected.status}
              </div>
            </div>

            {/* SVG Live Bandwidth Graph */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">Consumo de Ancho de Banda (Tiempo Real)</span>
                <span className="font-mono tabular-nums text-[#1D4ED8] font-semibold">
                  ↓ {selected.downloadMbps.toFixed(1)} / ↑ {selected.uploadMbps.toFixed(1)} Mbps
                </span>
              </div>
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-md p-3">
                <svg viewBox="0 0 320 100" className="w-full h-28 overflow-visible" aria-label="Gráfico de ancho de banda">
                  <line x1="0" y1="20" x2="320" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="0" y1="56" x2="320" y2="56" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="0" y1="92" x2="320" y2="92" stroke="#CBD5E1" />
                  <polyline
                    fill="none"
                    stroke={
                      selected.status === 'Activo'
                        ? '#1D4ED8'
                        : selected.status === 'Mora (Aviso)'
                        ? '#D97706'
                        : '#DC2626'
                    }
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={throughputPoints}
                  />
                </svg>
                <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1">
                  <span>Señal CPE: {selected.signalDbm} dBm</span>
                  <span>Latencia: {selected.latencyMs} ms</span>
                  <span>Saldo: ${selected.balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons simulating RouterOS API */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-900">
                Acciones Remotas MikroTik (vía WireGuard REST v7)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applySubscriberStatus(
                      selected.id,
                      'Activo',
                      'Webhook de pago verificado -> DELETE wisp_morosos (Reconexión < 2s).'
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reconectar</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applySubscriberStatus(
                      selected.id,
                      'Mora (Aviso)',
                      'PUT address-list=wisp_morosos + NAT portal aviso de pago + WhatsApp enviado.'
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Aviso Mora</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applySubscriberStatus(
                      selected.id,
                      'Suspendido',
                      'PPPoE Secret deshabilitado + sesión activa terminada por impago.'
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#DC2626] bg-white border border-slate-300 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Suspender</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GIS Map */}
      {activeTab === 'gis' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Mapa GIS de Cobertura Sectorial y CPEs (PostGIS + MapLibre)
                </h2>
                <p className="text-xs text-slate-500">
                  Haz clic en cualquier CPE para inspeccionar su enlace, nivel de señal y estado de facturación.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="font-medium text-[#16A34A]">● Activo</span>
                <span className="font-medium text-[#D97706]">● Mora</span>
                <span className="font-medium text-[#DC2626]">● Suspendido</span>
              </div>
            </div>

            <div className="relative bg-[#F1F5F9] border border-slate-200 rounded-lg overflow-hidden aspect-[16/10]">
              {/* Subtle topographic grid */}
              <svg viewBox="0 0 100 62" className="w-full h-full">
                <defs>
                  <pattern id="gisGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#CBD5E1" strokeWidth="0.25" />
                  </pattern>
                </defs>
                <rect width="100" height="62" fill="url(#gisGrid)" />

                {/* Sector Coverage Cones */}
                <path d="M 46 22 L 16 14 A 32 32 0 0 0 22 44 Z" fill="#1D4ED8" fillOpacity="0.08" stroke="#1D4ED8" strokeOpacity="0.25" strokeWidth="0.3" />
                <path d="M 46 22 L 78 12 A 34 34 0 0 1 76 38 Z" fill="#1D4ED8" fillOpacity="0.08" stroke="#1D4ED8" strokeOpacity="0.25" strokeWidth="0.3" />
                <path d="M 52 50 L 84 42 A 34 34 0 0 1 78 60 Z" fill="#0F172A" fillOpacity="0.06" stroke="#475569" strokeOpacity="0.25" strokeWidth="0.3" />
                <path d="M 52 50 L 18 42 A 34 34 0 0 0 20 58 Z" fill="#0F172A" fillOpacity="0.06" stroke="#475569" strokeOpacity="0.25" strokeWidth="0.3" />

                {/* Radio Backhaul Link between Towers */}
                <line x1="46" y1="22" x2="52" y2="50" stroke="#1D4ED8" strokeWidth="0.6" strokeDasharray="1.5 1" />

                {/* Links from Towers to CPEs */}
                {subscribers.map((sub) => {
                  const isNorth = sub.tower.includes('Norte');
                  const tx = isNorth ? 46 : 52;
                  const ty = isNorth ? 22 : 50;
                  const cx = sub.coords.x;
                  const cy = sub.coords.y * 0.62;
                  return (
                    <line
                      key={`link-${sub.id}`}
                      x1={tx}
                      y1={ty}
                      x2={cx}
                      y2={cy}
                      stroke={
                        sub.status === 'Activo'
                          ? '#16A34A'
                          : sub.status === 'Mora (Aviso)'
                          ? '#D97706'
                          : '#DC2626'
                      }
                      strokeOpacity={selected.id === sub.id ? 0.9 : 0.35}
                      strokeWidth={selected.id === sub.id ? 0.7 : 0.4}
                    />
                  );
                })}

                {/* Towers */}
                <g transform="translate(46, 22)">
                  <rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx="0.8" fill="#0F172A" />
                  <text x="3.5" y="1" fontSize="2.4" fontWeight="600" fill="#0F172A">
                    Torre Norte (CCR2004)
                  </text>
                </g>
                <g transform="translate(52, 50)">
                  <rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx="0.8" fill="#0F172A" />
                  <text x="3.5" y="1" fontSize="2.4" fontWeight="600" fill="#0F172A">
                    Cerro Sur (RB5009)
                  </text>
                </g>

                {/* Interactive CPE Nodes */}
                {subscribers.map((sub) => {
                  const cx = sub.coords.x;
                  const cy = sub.coords.y * 0.62;
                  const isSel = selected.id === sub.id;
                  const fill =
                    sub.status === 'Activo'
                      ? '#16A34A'
                      : sub.status === 'Mora (Aviso)'
                      ? '#D97706'
                      : '#DC2626';
                  return (
                    <g
                      key={sub.id}
                      transform={`translate(${cx}, ${cy})`}
                      onClick={() => setSelectedId(sub.id)}
                      className="cursor-pointer"
                    >
                      {isSel && (
                        <circle r="3.6" fill="none" stroke="#1D4ED8" strokeWidth="0.6" />
                      )}
                      <circle r="2" fill={fill} stroke="#FFFFFF" strokeWidth="0.5" />
                      <text
                        x="3"
                        y="0.8"
                        fontSize="2.2"
                        fontWeight={isSel ? '700' : '500'}
                        fill="#0F172A"
                      >
                        {sub.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Radio className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Ficha Geográfica de Instalación</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{selected.name}</h3>
            </div>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Coordenadas GPS</dt>
                <dd className="font-mono text-slate-900">
                  {selected.coords.lat}, {selected.coords.lng}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Torre / Sector</dt>
                <dd className="font-medium text-slate-900">{selected.tower}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Equipo CPE Instalado</dt>
                <dd className="font-mono text-slate-900">{selected.cpeModel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Potencia de Señal</dt>
                <dd className="font-mono font-semibold text-slate-900">{selected.signalDbm} dBm</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Estado del Servicio</dt>
                <dd className={`font-semibold ${statusTextStyle(selected.status)}`}>{selected.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* TAB 3: Android Field App Preview */}
      {activeTab === 'android' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-900">App Android · Técnico de Campo</div>
                <div className="text-[11px] text-slate-500">
                  Rol: Técnico Instalador · {offlineMode ? 'Sin señal celular (Offline)' : 'Conectado TLS 1.3'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleOffline}
                className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                {offlineMode ? 'Reconectar Red' : 'Simular Offline'}
              </button>
            </div>

            {/* Client Picker inside mobile view */}
            <div className="space-y-1.5">
              <label htmlFor="mobile-client-select" className="text-xs font-medium text-slate-600">
                Orden de Trabajo / Cliente en Sitio
              </label>
              <select
                id="mobile-client-select"
                value={selected.id}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setPingResult(null);
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-md text-slate-900"
              >
                {subscribers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-md space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">CPE / IP</span>
                <span className="font-mono text-slate-900">{selected.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GPS Capturado</span>
                <span className="font-mono text-slate-900">{selected.coords.lat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cola Offline Pendiente</span>
                <span className="font-mono font-semibold text-slate-900">
                  {queuedOfflineActions} {queuedOfflineActions === 1 ? 'evento' : 'eventos'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleFieldPing}
                disabled={offlineMode}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <Wifi className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Test Ping / Señal</span>
              </button>
              <button
                type="button"
                onClick={handleOfflineAction}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{offlineMode ? 'Guardar Cobro Offline' : 'Registrar Cobro'}</span>
              </button>
            </div>

            {pingResult && (
              <div className="p-3 bg-[#0F172A] text-sky-300 rounded-md text-xs font-mono">
                {pingResult}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">
                Flujo Offline-First en Zonas Rurales (Drift / Room)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Diseñado para técnicos que instalan antenas en cerros o zonas rurales sin cobertura celular.
              </p>
            </div>
            <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">Operaciones Idempotentes:</strong> Cada cobro en efectivo o alta
                  de CPE genera un <span className="font-mono">UUID v7</span> en Android antes de enviarse, evitando
                  duplicados si el técnico atraviesa zonas con señal intermitente.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">Seguridad en Dispositivo:</strong> La App Android nunca guarda
                  contraseñas de MikroTik; el diagnóstico de señal se solicita al Backend Core, que consulta al
                  router por WireGuard y devuelve únicamente el resultado autorizado.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Shared Live Audit Trail of Demo Interactions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-slate-900">
          Registro de Auditoría del Prototipo (Eventos Ejecutados)
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2 flex items-baseline gap-3">
              <span className="font-mono tabular-nums text-slate-400 shrink-0">{log.time}</span>
              <span className="text-slate-700">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
