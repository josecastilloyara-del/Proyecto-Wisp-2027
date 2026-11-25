import { useState } from 'react';
import { Calculator, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ENTERPRISE_MODULES, type PriorityLevel } from '../data/enterpriseData';
import { SpecBlueprintCard } from './SpecBlueprintCard';

type PriorityFilter = 'ALL' | PriorityLevel;

export function EnterpriseModulesSection() {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string>(ENTERPRISE_MODULES[0].id);

  // Interactive Billing Proration & Colombia Tax Simulator state
  const [planCop, setPlanCop] = useState<number>(85000);
  const [estrato, setEstrato] = useState<'1-2' | '3' | '4-6'>('1-2');
  const [activeDays, setActiveDays] = useState<number>(18);
  const [discountPct, setDiscountPct] = useState<number>(10);
  const [daysOverdue, setDaysOverdue] = useState<number>(0);

  // Interactive Automation Rules Simulator state
  const [simLatency, setSimLatency] = useState<number>(118);
  const [simDurationMin, setSimDurationMin] = useState<number>(6);
  const [simUsagePct, setSimUsagePct] = useState<number>(92);

  const visibleModules =
    priorityFilter === 'ALL'
      ? ENTERPRISE_MODULES
      : ENTERPRISE_MODULES.filter((m) => m.priority === priorityFilter);

  const activeModule =
    visibleModules.find((m) => m.id === selectedId) ?? visibleModules[0] ?? ENTERPRISE_MODULES[0];

  // Billing calculation (Colombia IVA rule: Estrato 1 & 2 exempt 0%, Estrato 3 exempt below 1.5 UVT ~74k COP, Estrato 4-6/Biz 19%)
  const proratedBase = Math.round((planCop / 30) * activeDays);
  const discountAmount = Math.round((proratedBase * discountPct) / 100);
  const netSubtotal = Math.max(0, proratedBase - discountAmount);
  const ivaRate = estrato === '1-2' ? 0 : estrato === '3' && planCop <= 75000 ? 0 : 0.19;
  const ivaAmount = Math.round(netSubtotal * ivaRate);
  const lateFee = daysOverdue > 5 ? 8000 : 0;
  const totalInvoiceCop = netSubtotal + ivaAmount + lateFee;

  // Rule evaluations
  const latencyRuleTriggered = simLatency > 100 && simDurationMin >= 5;
  const usageRuleTriggered = simUsagePct >= 90;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 04 · Evolución Funcional Nivel Enterprise
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Módulos Enterprise del Ecosistema WISP
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Diseño detallado de los cinco módulos clave para completar la plataforma: motor de facturación con
          prorrateo, mesa de tickets con SLA, inventario serializado de CPEs/torres, motor de reglas en streaming
          y portal de autogestión para suscriptores.
        </p>
      </div>

      {/* Priority Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {(
            [
              ['ALL', 'Todos (5)'],
              ['P0', 'P0 · Crítico'],
              ['P1', 'P1 · Importante'],
              ['P2', 'P2 · Deseable']
            ] as [PriorityFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPriorityFilter(key);
                const first =
                  key === 'ALL'
                    ? ENTERPRISE_MODULES[0]
                    : ENTERPRISE_MODULES.find((m) => m.priority === key);
                if (first) setSelectedId(first.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                priorityFilter === key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500">
          {visibleModules.length} módulos seleccionados
        </div>
      </div>

      {/* Module Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {visibleModules.map((mod) => {
          const isSelected = mod.id === activeModule.id;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedId(mod.id)}
              className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#EFF6FF] border-[#1D4ED8]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-slate-500">{mod.code}</span>
                <span
                  className={
                    mod.priority === 'P0'
                      ? 'text-[#DC2626] font-semibold'
                      : mod.priority === 'P1'
                      ? 'text-[#D97706] font-semibold'
                      : 'text-[#1D4ED8] font-semibold'
                  }
                >
                  {mod.priority}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{mod.title}</div>
            </button>
          );
        })}
      </div>

      {/* Full 6-Part Specification Card */}
      <SpecBlueprintCard key={activeModule.id} spec={activeModule} />

      {/* Contextual Interactive Simulator: Billing Proration & Colombia IVA */}
      {activeModule.id === 'billing-engine' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="pb-4 border-b border-slate-200 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#1D4ED8]" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Simulador Interactivo del Billing Engine (Prorrateo + IVA Colombia + Mora)
              </h3>
              <p className="text-xs text-slate-500">
                Prueba la lógica de prorrateo por días activos, exención tributaria de Internet fijo (estratos 1 y 2) y recargo por mora.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div className="space-y-1.5">
              <label htmlFor="plan-cop" className="font-medium text-slate-700">Tarifa Mensual (COP)</label>
              <input
                id="plan-cop"
                type="number"
                step={5000}
                min={30000}
                max={600000}
                value={planCop}
                onChange={(e) => setPlanCop(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 font-mono tabular-nums bg-[#F8FAFC] border border-slate-300 rounded-md"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="estrato-select" className="font-medium text-slate-700">Estrato / Tipo (CO)</label>
              <select
                id="estrato-select"
                value={estrato}
                onChange={(e) => setEstrato(e.target.value as '1-2' | '3' | '4-6')}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-md"
              >
                <option value="1-2">Estrato 1 y 2 (IVA 0%)</option>
                <option value="3">Estrato 3 (Tope UVT)</option>
                <option value="4-6">Estrato 4-6 / Empresa (IVA 19%)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="active-days" className="font-medium text-slate-700">
                Días Activos ({activeDays}/30)
              </label>
              <input
                id="active-days"
                type="range"
                min={1}
                max={30}
                value={activeDays}
                onChange={(e) => setActiveDays(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] mt-2 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="discount-pct" className="font-medium text-slate-700">
                Descuento ({discountPct}%)
              </label>
              <input
                id="discount-pct"
                type="range"
                min={0}
                max={50}
                step={5}
                value={discountPct}
                onChange={(e) => setDiscountPct(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] mt-2 cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="overdue-days" className="font-medium text-slate-700">
                Días en Mora ({daysOverdue}d)
              </label>
              <input
                id="overdue-days"
                type="range"
                min={0}
                max={20}
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] mt-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-[#F8FAFC] text-xs">
            <div className="p-3.5">
              <div className="text-slate-500">Prorrateo Base</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900 mt-1">
                ${proratedBase.toLocaleString('es-CO')}
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-slate-500">Descuento</div>
              <div className="font-mono tabular-nums font-semibold text-[#16A34A] mt-1">
                -${discountAmount.toLocaleString('es-CO')}
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-slate-500">IVA ({Math.round(ivaRate * 100)}%)</div>
              <div className="font-mono tabular-nums font-semibold text-slate-900 mt-1">
                ${ivaAmount.toLocaleString('es-CO')}
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-slate-500">Recargo Mora (&gt;5d)</div>
              <div className="font-mono tabular-nums font-semibold text-[#DC2626] mt-1">
                ${lateFee.toLocaleString('es-CO')}
              </div>
            </div>
            <div className="p-3.5">
              <div className="text-slate-500">Total Factura DIAN</div>
              <div className="font-mono tabular-nums text-base font-bold text-[#1D4ED8] mt-0.5">
                ${totalInvoiceCop.toLocaleString('es-CO')} COP
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Interactive Simulator: Automation Rules Engine */}
      {activeModule.id === 'automation-rules' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="pb-4 border-b border-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#1D4ED8]" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Banco de Pruebas del Motor de Reglas (Ventana Deslizante Redis)
              </h3>
              <p className="text-xs text-slate-500">
                Ajusta las métricas simuladas para verificar cuándo disparan las reglas sin generar falsos positivos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="sim-lat" className="font-medium text-slate-700">Latencia Observada</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">{simLatency} ms</span>
              </div>
              <input
                id="sim-lat"
                type="range"
                min={5}
                max={250}
                value={simLatency}
                onChange={(e) => setSimLatency(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="sim-dur" className="font-medium text-slate-700">Duración Sostenida</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">{simDurationMin} min</span>
              </div>
              <input
                id="sim-dur"
                type="range"
                min={1}
                max={15}
                value={simDurationMin}
                onChange={(e) => setSimDurationMin(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label htmlFor="sim-usage" className="font-medium text-slate-700">Consumo vs Plan Contratado</label>
                <span className="font-mono tabular-nums font-semibold text-slate-900">{simUsagePct}%</span>
              </div>
              <input
                id="sim-usage"
                type="range"
                min={10}
                max={100}
                value={simUsagePct}
                onChange={(e) => setSimUsagePct(Number(e.target.value))}
                className="w-full accent-[#1D4ED8] cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Regla A: Latencia &gt; 100 ms por 5 min
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-mono font-semibold ${
                    latencyRuleTriggered ? 'text-[#DC2626]' : 'text-[#16A34A]'
                  }`}
                >
                  {latencyRuleTriggered ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>DISPARADA</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>NOMINAL</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-slate-600">
                {latencyRuleTriggered
                  ? 'Acción encolada: Crear Ticket HIGH en NOC + Enviar Alerta WhatsApp al ingeniero de turno (Cooldown 60m).'
                  : 'Sin disparo: debe superar 100 ms de forma continua al menos 5 minutos para evitar falsos positivos.'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Regla B: Consumo &ge; 90% del Plan
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-mono font-semibold ${
                    usageRuleTriggered ? 'text-[#D97706]' : 'text-[#16A34A]'
                  }`}
                >
                  {usageRuleTriggered ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>DISPARADA</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>NOMINAL</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-slate-600">
                {usageRuleTriggered
                  ? 'Acción encolada: Notificar cliente vía WhatsApp Utility / Portal ofreciendo upgrade al siguiente plan.'
                  : 'Consumo dentro de rango saludable del plan asignado.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
