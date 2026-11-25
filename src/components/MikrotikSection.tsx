import { useState } from 'react';
import { Copy, Check, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { MIKROTIK_METHODS, ROUTEROS_SCRIPTS } from '../data/proposalData';

type ScriptKey = keyof typeof ROUTEROS_SCRIPTS;
type SimState = 'activo' | 'aviso' | 'suspendido';

export function MikrotikSection() {
  const [activeScript, setActiveScript] = useState<ScriptKey>('wireguard');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simState, setSimState] = useState<SimState>('activo');

  const currentScript = ROUTEROS_SCRIPTS[activeScript];

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setCopiedKey(null);
    }
  };

  const simDetails: Record<
    SimState,
    {
      label: string;
      addressList: string;
      firewallAction: string;
      httpBehavior: string;
      command: string;
      statusColor: string;
    }
  > = {
    activo: {
      label: 'Servicio Activo (Nominal)',
      addressList: 'Sin pertenencia a wisp_morosos',
      firewallAction: 'FORWARD ACCEPT · Simple Queue 50M/20M activa',
      httpBehavior: 'Navegación normal sin restricciones',
      command: 'DELETE /rest/ip/firewall/address-list/*1A4F  ->  HTTP 204 No Content',
      statusColor: 'text-[#16A34A]'
    },
    aviso: {
      label: 'Mora — Corte Suave con Portal de Aviso',
      addressList: 'list=wisp_morosos · address=100.64.12.48',
      firewallAction: 'Permitido DNS (:53) y wisp_pagos_permitidos · Drop resto',
      httpBehavior: 'DST-NAT puerto 80 redirige a Portal de Pago Online (MercadoPago/Stripe)',
      command:
        'PUT /rest/ip/firewall/address-list {"list":"wisp_morosos","address":"100.64.12.48","comment":"Mora | Aviso"}',
      statusColor: 'text-[#D97706]'
    },
    suspendido: {
      label: 'Suspensión Total (Desconexión PPPoE + Drop)',
      addressList: 'list=wisp_morosos + PPPoE Secret disabled=yes',
      firewallAction: 'Sesión PPPoE terminada vía /rest/ppp/active/remove',
      httpBehavior: 'Sin salida a Internet hasta liquidar factura vencida',
      command:
        'PATCH /rest/ppp/secret/*B2 {"disabled":"true"}  +  POST /rest/ppp/active/remove {".id":"*8F12"}',
      statusColor: 'text-[#DC2626]'
    }
  };

  const currentSim = simDetails[simState];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 03 · Plano de Red e Integración con RouterOS v7
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Estrategia de Integración Segura con MikroTik
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Conectar múltiples MikroTik de forma confiable exige resolver tres problemas reales de operación WISP:
          eliminar la exposición en WAN, ejecutar cortes idempotentes sin bloquear hilos y monitorear tráfico sin
          saturar el CPU del router.
        </p>
      </div>

      {/* Three Engineering Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
            <span>1. Túnel WireGuard Saliente</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cada router establece un túnel cifrado saliente (<span className="font-mono">PersistentKeepalive=25s</span>)
            hacia el concentrador en la nube. Opera detrás de CGNAT o IPs dinámicas y mantiene Winbox, SSH y API
            completamente cerrados en la interfaz WAN.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Terminal className="w-4 h-4 text-[#1D4ED8]" />
            <span>2. API-SSL / REST v7 Idempotente</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            El Worker en Go usa la API REST nativa de RouterOS v7 sobre HTTPS interno (o API-SSL :8729 en v6),
            con <span className="font-medium text-slate-800">Circuit Breaker</span> por router y validación previa
            para garantizar que reintentos nunca dupliquen reglas ni colas.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Activity className="w-4 h-4 text-[#1D4ED8]" />
            <span>3. Monitoreo sin Saturar CPU</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nunca se hace polling continuo de <span className="font-mono">/tool/torch</span>. Las métricas históricas
            se recolectan por <span className="font-medium text-slate-800">SNMPv3</span> cada 30–60s (&lt;2% CPU).
            El gráfico en vivo cada 2s se activa únicamente mientras un operador mira la ficha del cliente.
          </p>
        </div>
      </div>

      {/* Interactive Suspension State Simulator */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Simulador de Reglas de Corte y Reconexión en RouterOS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cambia el estado de cuenta de un suscriptor de ejemplo (<span className="font-mono">100.64.12.48</span>)
              para inspeccionar el efecto exacto en Firewall, NAT y la llamada REST API.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSimState('activo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                simState === 'activo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activo
            </button>
            <button
              type="button"
              onClick={() => setSimState('aviso')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                simState === 'aviso'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mora (Aviso)
            </button>
            <button
              type="button"
              onClick={() => setSimState('suspendido')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                simState === 'suspendido'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Suspendido
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-md">
            <div className="text-slate-500">Estado Resultante</div>
            <div className={`font-semibold mt-1 ${currentSim.statusColor}`}>{currentSim.label}</div>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-md">
            <div className="text-slate-500">Estado en Firewall / Address-List</div>
            <div className="font-mono text-slate-900 mt-1">{currentSim.addressList}</div>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-md">
            <div className="text-slate-500">Experiencia del Cliente</div>
            <div className="text-slate-800 mt-1">{currentSim.httpBehavior}</div>
          </div>
        </div>

        <div className="bg-[#0F172A] text-slate-100 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Llamada ejecutada por RouterOS Engine (Go) sobre túnel WireGuard</span>
            <span className="font-mono">{currentSim.firewallAction}</span>
          </div>
          <pre className="text-xs font-mono text-sky-300 overflow-x-auto whitespace-pre-wrap">
            {currentSim.command}
          </pre>
        </div>
      </div>

      {/* Real RouterOS v7 Script Explorer */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Plantillas de Configuración y API RouterOS v7
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comandos listos para producción para aprovisionar el túnel WireGuard, firewall de mora y llamadas REST.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
            {(
              [
                ['wireguard', 'WireGuard VPN'],
                ['firewall', 'Firewall Mora'],
                ['rest_suspend', 'REST Corte'],
                ['rest_restore', 'REST Reconexión']
              ] as [ScriptKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveScript(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeScript === key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{currentScript.title}</h3>
              <p className="text-xs text-slate-500">{currentScript.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(currentScript.code, activeScript)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedKey === activeScript ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar script</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-[#0F172A] text-slate-100 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
            <code>{currentScript.code}</code>
          </pre>
        </div>
      </div>

      {/* Comparison Table of Control Methods */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Comparativa de Métodos de Control de Ancho de Banda y Bloqueo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ruta de evolución desde un WISP inicial hasta una operación carrier-grade con miles de abonados.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Mecanismo</th>
                <th className="py-3 px-4">Escala Óptima</th>
                <th className="py-3 px-4">Impacto CPU</th>
                <th className="py-3 px-4">Velocidad de Corte</th>
                <th className="py-3 px-4">Recomendación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {MIKROTIK_METHODS.map((row) => (
                <tr key={row.method} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{row.method}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">{row.scaleLimit}</td>
                  <td className="py-3.5 px-4 text-slate-700">{row.cpuImpact}</td>
                  <td className="py-3.5 px-4 text-slate-700">{row.cutSpeed}</td>
                  <td className="py-3.5 px-4 text-slate-600">{row.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
