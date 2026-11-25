import { useState } from 'react';
import {
  Smartphone,
  Shield,
  Server,
  Cpu,
  Database,
  Lock,
  Radio,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ARCH_NODES, SEQUENCE_FLOWS, type ArchNode } from '../data/proposalData';

const NODE_ICONS: Record<string, typeof Server> = {
  android: Smartphone,
  gateway: Shield,
  backend: Server,
  collector: Cpu,
  database: Database,
  vpn: Lock,
  mikrotik: Radio
};

const ZONE_LABELS: Record<ArchNode['zone'], string> = {
  cliente: 'Capa Cliente',
  cloud: 'VPC Privada en la Nube',
  tunel: 'Enlace Cifrado Zero-Exposure',
  campo: 'Infraestructura WISP en Campo'
};

export function ArchitectureSection() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('vpn');
  const [selectedFlowId, setSelectedFlowId] = useState<string>('suspension');

  const activeNode = ARCH_NODES.find((n) => n.id === selectedNodeId) ?? ARCH_NODES[0];
  const activeFlow = SEQUENCE_FLOWS.find((f) => f.id === selectedFlowId) ?? SEQUENCE_FLOWS[0];

  const renderNodeButton = (id: string) => {
    const node = ARCH_NODES.find((n) => n.id === id)!;
    const Icon = NODE_ICONS[id] ?? Server;
    const isSelected = selectedNodeId === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => setSelectedNodeId(id)}
        className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
          isSelected
            ? 'bg-[#EFF6FF] border-[#1D4ED8] text-[#0F172A]'
            : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50/70'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 p-2 rounded-md shrink-0 ${
              isSelected ? 'bg-[#1D4ED8] text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-snug text-slate-900">{node.label}</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{node.sublabel}</div>
            <div className="mt-1.5 text-[11px] font-mono tabular-nums text-slate-600 truncate">
              {node.protocol}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-10">
      {/* Header Summary */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 01 · Topología de Red y Comunicación Segura
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Arquitectura del Sistema WISP sin Exposición Pública de MikroTik
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          El ecosistema separa la operación comercial (CRM, facturación, pasarelas y reportes) del plano de
          control de red mediante un colector concurrente y un túnel VPN WireGuard Hub-and-Spoke. Ningún router
          MikroTik abre puertos administrativos hacia Internet.
        </p>
      </div>

      {/* Key Architectural Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-lg bg-white divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-xs text-slate-500">Puertos WAN en MikroTik</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">0 abiertos</div>
          <div className="mt-0.5 text-xs text-slate-500">Túnel saliente WireGuard</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">SLA Reconexión Automática</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">&lt; 5 seg</div>
          <div className="mt-0.5 text-xs text-slate-500">Tras confirmación de webhook</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Impacto CPU en Router</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">&lt; 2%</div>
          <div className="mt-0.5 text-xs text-slate-500">Monitoreo base por SNMPv3</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Operación en Campo</div>
          <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-slate-900">Offline-First</div>
          <div className="mt-0.5 text-xs text-slate-500">Cola local SQLite cifrada</div>
        </div>
      </div>

      {/* Interactive Topology Diagram + Node Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Topology Map */}
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Diagrama Interactivo de Componentes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona cualquier nodo para inspeccionar puertos, cifrado, responsabilidades y tolerancia a fallos.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500">Subred Gestión: 10.250.0.0/16</div>
          </div>

          <div className="mt-5 space-y-5">
            {/* Layer 1: Client & Edge */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                1. Capa Cliente y Borde Público (TLS 1.3 · HTTPS / WSS)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {renderNodeButton('android')}
                {renderNodeButton('gateway')}
              </div>
            </div>

            <div className="flex items-center justify-center text-xs text-slate-400 gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="font-mono">HTTPS / WebSockets · JWT + RBAC</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Layer 2: Private VPC */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                2. Red Privada Cloud (Sin acceso directo desde Internet)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderNodeButton('backend')}
                {renderNodeButton('database')}
              </div>
              <div className="pt-1">{renderNodeButton('collector')}</div>
            </div>

            <div className="flex items-center justify-center text-xs text-[#1D4ED8] gap-2">
              <div className="h-px flex-1 bg-[#1D4ED8]/30" />
              <span className="font-mono font-medium">
                Túnel Saliente WireGuard (UDP 51820 · Atraviesa CGNAT)
              </span>
              <div className="h-px flex-1 bg-[#1D4ED8]/30" />
            </div>

            {/* Layer 3: Tunnel & MikroTik Fleet */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                3. Plano de Red WISP (Zero Public Exposure)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {renderNodeButton('vpn')}
                {renderNodeButton('mikrotik')}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Selected Node Inspector */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="pb-4 border-b border-slate-200">
            <div className="text-xs font-medium text-[#1D4ED8]">{ZONE_LABELS[activeNode.zone]}</div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{activeNode.label}</h3>
            <div className="text-xs text-slate-500 mt-0.5">{activeNode.sublabel}</div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">{activeNode.summary}</p>

          {/* Technical Parameters Grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 border-y border-slate-200 text-xs">
            <div>
              <dt className="text-slate-500">Protocolo</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5">{activeNode.protocol}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Puerto / Exposición</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5">{activeNode.port}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Cifrado</dt>
              <dd className="font-medium text-slate-900 mt-0.5">{activeNode.encryption}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Latencia Objetivo</dt>
              <dd className="font-mono font-medium text-slate-900 mt-0.5">{activeNode.latencySla}</dd>
            </div>
          </dl>

          {/* Responsibilities */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-900">Responsabilidades Clave</h4>
            <ul className="space-y-2">
              {activeNode.responsibilities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Failure Mode */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Comportamiento ante Fallos (Resiliencia)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{activeNode.failureMode}</p>
          </div>
        </div>
      </div>

      {/* Interactive Sequence Flows */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Flujos Críticos de Comunicación End-to-End
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secuencia operativa de los tres procesos centrales del WISP.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
            {SEQUENCE_FLOWS.map((flow) => (
              <button
                key={flow.id}
                type="button"
                onClick={() => setSelectedFlowId(flow.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedFlowId === flow.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {flow.id === 'suspension'
                  ? 'Suspensión Mora'
                  : flow.id === 'payment'
                  ? 'Pago y Reconexión'
                  : 'Telemetría en Vivo'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{activeFlow.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{activeFlow.subtitle}</p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600">SLA: {activeFlow.sla}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeFlow.steps.map((s) => (
            <div
              key={s.step}
              className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-[#1D4ED8]">Paso 0{s.step}</span>
                  <span className="font-mono text-[11px]">{s.protocol}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 flex-wrap">
                  <span>{s.actor}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{s.target}</span>
                </div>
                <p className="text-xs font-medium text-slate-800">{s.action}</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200/80">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
