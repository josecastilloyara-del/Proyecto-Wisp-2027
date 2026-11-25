import { useState } from 'react';
import { Layers, Check } from 'lucide-react';
import { TECH_STACK, type TechStackItem } from '../data/proposalData';

type LayerFilter = 'Todas' | TechStackItem['layer'];

const LAYER_FILTERS: LayerFilter[] = [
  'Todas',
  'Móvil Android',
  'Backend y Workers',
  'Datos y GIS',
  'Integraciones'
];

export function TechStackSection() {
  const [activeLayer, setActiveLayer] = useState<LayerFilter>('Todas');
  const [selectedItemId, setSelectedItemId] = useState<string>(TECH_STACK[0].id);

  const filteredItems =
    activeLayer === 'Todas'
      ? TECH_STACK
      : TECH_STACK.filter((item) => item.layer === activeLayer);

  const selectedItem =
    filteredItems.find((i) => i.id === selectedItemId) ?? filteredItems[0] ?? TECH_STACK[0];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 02 · Decisiones de Ingeniería y Selección Tecnológica
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Stack Tecnológico Recomendado
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Selección optimizada para equilibrar velocidad de desarrollo en el MVP, trabajo offline en campo
          desde Android, precisión contable en facturación y alta concurrencia en comunicación con MikroTik.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {LAYER_FILTERS.map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => {
                setActiveLayer(layer);
                const firstMatch =
                  layer === 'Todas'
                    ? TECH_STACK[0]
                    : TECH_STACK.find((item) => item.layer === layer);
                if (firstMatch) setSelectedItemId(firstMatch.id);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeLayer === layer
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500">
          Mostrando {filteredItems.length} de {TECH_STACK.length} componentes
        </div>
      </div>

      {/* Main Grid: Table + ADR Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Matrix Table */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Componente</th>
                  <th className="py-3 px-4">Opción Recomendada</th>
                  <th className="py-3 px-4">Alternativa Viable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">{item.component}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.layer}</div>
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-medium text-[#1D4ED8]">{item.recommended}</div>
                      </td>
                      <td className="py-3.5 px-4 align-top text-slate-600">{item.alternative}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Component ADR Rationale */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Registro de Decisión (ADR) · {selectedItem.layer}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedItem.component}</h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500">Selección Principal</div>
              <div className="text-sm font-mono font-semibold text-[#1D4ED8] mt-0.5">
                {selectedItem.recommended}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Alternativa Evaluada</div>
              <div className="text-xs font-medium text-slate-700 mt-0.5">
                {selectedItem.alternative}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-semibold text-slate-900">Justificación Técnica</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedItem.justification}</p>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-semibold text-slate-900">Cuándo Evaluar la Alternativa</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedItem.decisionNote}</p>
          </div>
        </div>
      </div>

      {/* Comparative Flutter vs Kotlin Decision Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Decisión Clave en Android: Flutter vs. Kotlin Nativo (Jetpack Compose)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ambas opciones producen aplicaciones Android de alto rendimiento; la elección depende del horizonte de plataformas del WISP.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2.5">
            <div className="font-semibold text-sm text-slate-900">
              Flutter + Riverpod + Drift (Recomendado por defecto)
            </div>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                <span>Un único equipo mantiene Android (técnicos/cobradores) y puede habilitar iOS para gerencia sin reescribir código.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                <span>Motor gráfico Impeller renderiza gráficos de ancho de banda en tiempo real y capas GIS a 60/120 fps constantes.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                <span>Ecosistema maduro para escaneo QR/MAC, GPS de alta precisión, SQLite cifrado (Drift) y Firebase Cloud Messaging.</span>
              </li>
            </ul>
          </div>
          <div className="space-y-2.5 md:border-l md:border-slate-200 md:pl-6">
            <div className="font-semibold text-sm text-slate-900">
              Kotlin Nativo + Jetpack Compose + Room (Alternativa Android-Only)
            </div>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Acceso directo a APIs de bajo nivel de Android (escáner Wi-Fi/RF nativo, impresión térmica Bluetooth de recibos en calle).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Menor tamaño de APK y máxima integración con WorkManager para sincronización en segundo plano con batería limitada.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>Recomendado si el WISP confirma exclusividad Android y ya dispone de desarrolladores Kotlin in-house.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
