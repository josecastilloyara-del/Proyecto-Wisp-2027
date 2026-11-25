import {
  ALL_ENTERPRISE_SPECS,
  THREE_PHASE_ROADMAP
} from './enterpriseData';

export type SectionId =
  | 'arquitectura'
  | 'stack'
  | 'mikrotik'
  | 'modulos'
  | 'mejoras'
  | 'colombia'
  | 'seguridad'
  | 'roadmap'
  | 'prototipo';

export interface ArchNode {
  id: string;
  label: string;
  sublabel: string;
  zone: 'cliente' | 'cloud' | 'tunel' | 'campo';
  protocol: string;
  port: string;
  encryption: string;
  latencySla: string;
  summary: string;
  responsibilities: string[];
  failureMode: string;
}

export interface SequenceFlow {
  id: string;
  title: string;
  subtitle: string;
  sla: string;
  steps: {
    step: number;
    actor: string;
    target: string;
    action: string;
    protocol: string;
    detail: string;
  }[];
}

export interface TechStackItem {
  id: string;
  layer: 'Móvil Android' | 'Backend y Workers' | 'Datos y GIS' | 'Integraciones';
  component: string;
  recommended: string;
  alternative: string;
  justification: string;
  decisionNote: string;
}

export interface MikrotikMethodComparison {
  method: string;
  scaleLimit: string;
  cpuImpact: string;
  cutSpeed: string;
  captiveNotice: string;
  recommendation: string;
}

export interface RoadmapPhase {
  id: string;
  phaseNumber: string;
  name: string;
  timeframe: string;
  goal: string;
  teamProfile: string;
  deliverables: {
    area: string;
    item: string;
    acceptanceCriteria: string;
  }[];
  exitMilestone: string;
}

export interface SecurityControl {
  id: string;
  domain: 'Credenciales MikroTik' | 'Perímetro y Auth' | 'Pagos e Idempotencia' | 'Escalabilidad y HA';
  title: string;
  threatAddressed: string;
  implementation: string;
  metricOrStandard: string;
}

export interface DemoSubscriber {
  id: string;
  name: string;
  plan: string;
  ip: string;
  router: string;
  tower: string;
  cpeModel: string;
  signalDbm: number;
  status: 'Activo' | 'Mora (Aviso)' | 'Suspendido';
  balanceDue: number;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number;
  coords: { x: number; y: number; lat: string; lng: string };
  historyMbps: number[];
  historyLatency: number[];
}

export const ARCH_NODES: ArchNode[] = [
  {
    id: 'android',
    label: 'App Android (Operación y Campo)',
    sublabel: 'Flutter o Kotlin Compose · Offline-First',
    zone: 'cliente',
    protocol: 'HTTPS REST + WSS (WebSockets)',
    port: '443 (TLS 1.3)',
    encryption: 'TLS 1.3 + Certificate Pinning + Keystore',
    latencySla: '< 250 ms (API CRUD)',
    summary:
      'Aplicación orientada a administradores, cobradores y técnicos de campo. Permite alta de clientes con geolocalización GPS en sitio, diagnóstico de enlace CPE, cobros y consulta de telemetría en vivo sin exponer credenciales de red.',
    responsibilities: [
      'Sincronización offline-first (Drift/Room) para instalaciones en zonas rurales sin señal celular.',
      'Captura de coordenadas GIS de CPEs, fotos de instalación y escaneo de MAC/SN por cámara.',
      'Recepción de alertas push (FCM) ante caída de nodos o pagos confirmados.',
      'Visualización de gráficos de tráfico en tiempo real vía WebSocket autenticado con JWT.'
    ],
    failureMode:
      'Si el técnico pierde conectividad móvil, las órdenes de instalación y cobros se encolan en SQLite local cifrado (SQLCipher) y se sincronizan de forma idempotente al recuperar red.'
  },
  {
    id: 'gateway',
    label: 'Edge WAF y API Gateway',
    sublabel: 'Cloudflare + Nginx / Envoy Reverse Proxy',
    zone: 'cloud',
    protocol: 'HTTPS / HTTP2 + WebSockets',
    port: '443',
    encryption: 'TLS 1.3 Strict + HSTS + Rate Limiting',
    latencySla: '< 25 ms overhead',
    summary:
      'Único punto de entrada público al ecosistema. Absorbe picos de tráfico, filtra ataques de fuerza bruta, valida cabeceras de webhooks de pago y enruta tráfico hacia el backend.',
    responsibilities: [
      'Rate limiting granular por IP, por usuario autenticado y por endpoint sensible (login, webhooks).',
      'Protección DDoS L3/L4/L7 y bloqueo geográfico opcional para endpoints administrativos.',
      'Terminación TLS 1.3 y enrutamiento hacia API REST, WebSockets y endpoints de webhooks.',
      'Aislamiento total: ningún puerto de gestión de routers es alcanzable desde este borde.'
    ],
    failureMode:
      'Balanceo activo-pasivo con health checks cada 5s y failover automático hacia réplica secundaria.'
  },
  {
    id: 'backend',
    label: 'Backend Core + Cola de Trabajos',
    sublabel: 'NestJS (Monolito Modular) + BullMQ / Redis',
    zone: 'cloud',
    protocol: 'REST / BullMQ / Internal gRPC',
    port: '3000 (Privado)',
    encryption: 'mTLS interno + AES-256-GCM (KMS)',
    latencySla: '< 120 ms p95',
    summary:
      'Orquesta CRM, motor de facturación recurrente, conciliación de pasarelas de pago, control de mora, motor de alertas (WhatsApp/SMTP) y generación asíncrona de reportes PDF/Excel.',
    responsibilities: [
      'Facturación programada (cron idempotente) con cálculo de prorrateo, impuestos y fechas de corte.',
      'Procesamiento verificado de webhooks de MercadoPago, Stripe y PayPal con deduplicación.',
      'Despacho de órdenes de aprovisionamiento, corte y reconexión hacia las colas Redis/BullMQ.',
      'Autorización RBAC estricta (SuperAdmin, NOC, Técnico de Campo, Cobrador).'
    ],
    failureMode:
      'Las tareas críticas (cortes, reconexiones, envío de facturas) persisten en Redis con reintentos exponenciales y Dead Letter Queue (DLQ) auditable.'
  },
  {
    id: 'collector',
    label: 'RouterOS Engine & Colector de Telemetría',
    sublabel: 'Worker Dedicado en Go (Alta Concurrencia)',
    zone: 'cloud',
    protocol: 'RouterOS API-SSL / REST v7 + SNMPv3',
    port: '8729 / 443 / UDP 161 (Solo VPN)',
    encryption: 'Túnel WireGuard + TLS sobre API-SSL',
    latencySla: '< 1.5 s ejecución de corte',
    summary:
      'Microservicio ligero en Go encargado de mantener pools de conexión hacia los routers MikroTik, recolectar métricas de interfaces/colas vía SNMPv3 y ejecutar cambios atómicos sin bloquear el backend principal.',
    responsibilities: [
      'Recolección masiva por SNMPv3 (IF-MIB / Queue counters) cada 30–60s con mínimo impacto en CPU del router.',
      'Ejecución de comandos idempotentes vía RouterOS API-SSL / REST v7 (address-list, PPPoE secrets, queues).',
      'Circuit Breaker independiente por router: si un nodo cae, pausa el polling y dispara alerta al NOC.',
      'Streaming selectivo bajo demanda (live torch/queue) únicamente cuando un operador abre la ficha del cliente.'
    ],
    failureMode:
      'Si un MikroTik pierde enlace temporalmente, las órdenes de corte/reconexión se marcan como pendientes y se reconcilian automáticamente al restablecer el túnel WireGuard.'
  },
  {
    id: 'database',
    label: 'Capa de Datos Políglota',
    sublabel: 'PostgreSQL 16 + PostGIS + TimescaleDB + Redis',
    zone: 'cloud',
    protocol: 'PostgreSQL Wire (TLS) / Redis RESP3',
    port: '5432 / 6379 (Red Privada)',
    encryption: 'Cifrado en reposo (AES-256) + TLS en tránsito',
    latencySla: '< 15 ms queries p95',
    summary:
      'Combina integridad transaccional ACID para facturación y CRM, capacidades geoespaciales nativas (PostGIS) para el mapa GIS de torres/CPEs, y compresión de series temporales (TimescaleDB) para tráfico histórico.',
    responsibilities: [
      'PostgreSQL: Clientes, contratos, facturas, libro mayor de pagos, inventario de equipos y auditoría.',
      'PostGIS: Coordenadas GPS de antenas/CPEs, radios de cobertura sectorial y consultas espaciales rápidas.',
      'TimescaleDB: Almacenamiento de ancho de banda, latencia ICMP y pérdida de paquetes con agregación automática.',
      'Redis: Caché de estado de clientes en vivo, locks distribuidos y broker de colas BullMQ.'
    ],
    failureMode:
      'Backups continuos PITR (Point-in-Time Recovery) cifrados en almacenamiento S3/R2 externo con pruebas periódicas de restauración.'
  },
  {
    id: 'vpn',
    label: 'Concentrador VPN WireGuard (Zero-Exposure)',
    sublabel: 'Subred de Gestión Privada 10.250.0.0/16',
    zone: 'tunel',
    protocol: 'WireGuard UDP (ChaCha20-Poly1305)',
    port: 'UDP 51820 (Solo en Servidor Cloud)',
    encryption: 'Curva Elíptica Curve25519 + Claves Precompartidas (PSK)',
    latencySla: '< 5 ms overhead criptográfico',
    summary:
      'Resuelve el requisito crítico de seguridad: ningún router MikroTik expone su API, Winbox ni SSH a Internet. Cada router inicia un túnel saliente autenticado hacia el concentrador en la nube.',
    responsibilities: [
      'Funciona incluso detrás de CGNAT o IPs dinámicas gracias a PersistentKeepalive=25 desde el router.',
      'Aislamiento entre peers: los routers solo ven al servidor colector, nunca pueden comunicarse entre sí.',
      'Rotación auditable de pares de llaves por router y revocación inmediata en caso de robo físico del equipo.',
      'Integrado de forma nativa en RouterOS v7 con aceleración a nivel de kernel y mínimo consumo de RAM.'
    ],
    failureMode:
      'Concentrador redundante (Primary + Secondary WireGuard Hub) configurado en cada router mediante failover de ruta estática o BGP ligero.'
  },
  {
    id: 'mikrotik',
    label: 'Flota de Routers MikroTik (Borde / Torres)',
    sublabel: 'RouterOS v7 (CCR / RB5009 / RB4011)',
    zone: 'campo',
    protocol: 'RouterOS REST API / API-SSL + SNMPv3 (Solo IP VPN)',
    port: '8729 / 443 restringido a 10.250.0.1/32',
    encryption: 'Sin puertos abiertos en WAN pública',
    latencySla: '< 2 ms procesamiento firewall local',
    summary:
      'Ejecutan el control de ancho de banda (Simple Queues / PCQ / PPPoE), enrutamiento, NAT hacia portal de aviso de mora y firewall de corte automático usando listas de direcciones dinámicas.',
    responsibilities: [
      'Usuario dedicado `wisp_api` con permisos restringidos (read, write, api, rest-api; sin permisos ftp/romon/sensitive innecesarios).',
      'Reglas de Firewall vinculadas a address-list `wisp_morosos` para corte instantáneo o redirección a aviso de pago.',
      'Exportación periódica de métricas vía SNMPv3 o NetFlow/IPFIX hacia el colector por el túnel VPN.',
      'Resiliencia local: si se cae Internet hacia la nube, el router sigue operando con su configuración vigente.'
    ],
    failureMode:
      'Reglas `address-list` persistentes en router aseguran que cortes y planes permanezcan activos aun sin conexión al backend.'
  }
];

export const SEQUENCE_FLOWS: SequenceFlow[] = [
  {
    id: 'suspension',
    title: 'Suspensión Automática por Mora (Corte Idempotente)',
    subtitle: 'Desde vencimiento de factura hasta bloqueo en MikroTik y aviso por WhatsApp',
    sla: '< 3 segundos por suscriptor (en lotes regulados)',
    steps: [
      {
        step: 1,
        actor: 'Scheduler Facturación',
        target: 'PostgreSQL',
        action: 'Detecta facturas vencidas fuera de período de gracia',
        protocol: 'SQL Transaccional',
        detail: 'Consulta facturas impagas cuya fecha de corte expiró y que no poseen promesa de pago activa.'
      },
      {
        step: 2,
        actor: 'Backend Core',
        target: 'Redis / BullMQ',
        action: 'Encola trabajo `SUSPEND_SUBSCRIBER` con clave idempotente',
        protocol: 'BullMQ Job',
        detail: 'Agrupa tareas por `router_id` con límite de concurrencia para no saturar un mismo MikroTik.'
      },
      {
        step: 3,
        actor: 'RouterOS Engine (Go)',
        target: 'MikroTik vía WireGuard',
        action: 'Agrega IP del cliente a `address-list=wisp_morosos`',
        protocol: 'REST API v7 / API-SSL',
        detail: 'Si el cliente usa PPPoE, adicionalmente termina la sesión activa o aplica perfil de corte suave (portal de aviso).'
      },
      {
        step: 4,
        actor: 'Backend Core',
        target: 'WhatsApp API + SMTP',
        action: 'Envía aviso de suspensión con enlace directo de pago',
        protocol: 'HTTPS Webhook / Meta Cloud API',
        detail: 'Incluye QR o link de MercadoPago/Stripe para auto-reconexión inmediata tras el abono.'
      }
    ]
  },
  {
    id: 'payment',
    title: 'Pago Online y Reconexión Automática (Zero-Touch)',
    subtitle: 'Conciliación segura de pasarela y restauración del servicio sin intervención humana',
    sla: '< 5 segundos desde confirmación del webhook',
    steps: [
      {
        step: 1,
        actor: 'MercadoPago / Stripe / PayPal',
        target: 'Edge WAF / Backend',
        action: 'Envía notificación Webhook `payment.approved`',
        protocol: 'HTTPS POST + Firma HMAC-SHA256',
        detail: 'El backend valida firma criptográfica, verifica `event_id` en tabla de idempotencia y consulta estado real vía API.'
      },
      {
        step: 2,
        actor: 'Backend Core',
        target: 'PostgreSQL (Ledger)',
        action: 'Registra asiento contable y marca factura como PAGADA',
        protocol: 'Transacción ACID + Lock',
        detail: 'Actualiza el saldo en libro mayor de doble entrada para evitar discrepancias contables o doble acreditación.'
      },
      {
        step: 3,
        actor: 'RouterOS Engine (Go)',
        target: 'MikroTik vía WireGuard',
        action: 'Elimina IP de `wisp_morosos` y restaura plan',
        protocol: 'REST API v7 (DELETE)',
        detail: 'Confirmación atómica de reconexión; registra timestamp y usuario `SYSTEM_AUTORECONNECT` en auditoría.'
      },
      {
        step: 4,
        actor: 'Backend Core',
        target: 'App Android + WhatsApp',
        action: 'Emite recibo PDF y notifica reconexión exitosa',
        protocol: 'WebSocket + Meta Cloud API',
        detail: 'Actualiza el panel de administradores en tiempo real y entrega comprobante descargable al cliente.'
      }
    ]
  },
  {
    id: 'telemetry',
    title: 'Monitoreo de Red y Telemetría en Tiempo Real',
    subtitle: 'Visualización de latencia y consumo sin degradar la CPU de los routers MikroTik',
    sla: 'Muestreo base 30s · Vista en vivo 2s bajo demanda',
    steps: [
      {
        step: 1,
        actor: 'Colector Go (SNMPv3)',
        target: 'Flota MikroTik vía WireGuard',
        action: 'Recolecta contadores de colas/interfaces y ping ICMP',
        protocol: 'SNMPv3 AuthPriv + ICMP',
        detail: 'Consume < 2% CPU en el router frente al 25–40% que provocaría abrir sesiones API continuas.'
      },
      {
        step: 2,
        actor: 'Colector Go',
        target: 'TimescaleDB + Redis',
        action: 'Escribe series temporales en bloque y actualiza estado vivo',
        protocol: 'COPY Batch / Redis HSET',
        detail: 'TimescaleDB comprime datos mayores a 7 días (reducción >85% en disco) manteniendo histórico anual.'
      },
      {
        step: 3,
        actor: 'App Android (NOC / Técnico)',
        target: 'Backend WebSocket',
        action: 'Abre vista detallada de cliente o router específico',
        protocol: 'WSS + JWT',
        detail: 'Al abrir la ficha, el backend activa una suscripción temporal (2s) al tráfico de esa cola específica.'
      },
      {
        step: 4,
        actor: 'Motor de Alertas',
        target: 'Operadores (FCM / WhatsApp)',
        action: 'Dispara alerta automática ante latencia alta o caída de torre',
        protocol: 'Reglas de Umbral + Debounce',
        detail: 'Evita falsos positivos validando 3 ciclos fallidos consecutivos antes de alertar corte de enlace.'
      }
    ]
  }
];

export const TECH_STACK: TechStackItem[] = [
  {
    id: 'mobile',
    layer: 'Móvil Android',
    component: 'Framework App Móvil',
    recommended: 'Flutter (Dart) + Riverpod + Drift (SQLite)',
    alternative: 'Kotlin Nativo + Jetpack Compose + Room',
    justification:
      'Flutter ofrece rendimiento compilado nativo (Impeller 60/120 fps), excelente soporte GIS y una única base de código si el WISP decide sumar iOS o Web administrativa en el futuro. Drift permite trabajo 100% offline en campo.',
    decisionNote:
      'Elegir Kotlin + Jetpack Compose solo si el equipo ya es especialista en Android nativo y requiere integraciones profundas de hardware RF/Bluetooth específicas de Android.'
  },
  {
    id: 'gis-mobile',
    layer: 'Móvil Android',
    component: 'Mapas GIS y Geolocalización',
    recommended: 'MapLibre GL / Google Maps SDK + GeoJSON',
    alternative: 'OpenStreetMap (flutter_map)',
    justification:
      'MapLibre permite capas vectoriales personalizadas (sectores de antenas, enlaces punto a punto, zonas de cobertura, pines por estado de mora) y descarga de mapas offline para técnicos rurales sin cargos altos por volumen.',
    decisionNote:
      'Combinar vista satelital (vital para validar línea de vista y techos en WISPs) con capas PostGIS servidas como MVT (Mapbox Vector Tiles).'
  },
  {
    id: 'backend-core',
    layer: 'Backend y Workers',
    component: 'API Core (CRM, Facturación, Webhooks)',
    recommended: 'Node.js 22 LTS + NestJS (TypeScript)',
    alternative: 'Python (FastAPI + Celery)',
    justification:
      'NestJS impone arquitectura modular estricta (ideal para separar CRM, Billing, Payments, GIS y Notifications sin caer en microservicios prematuros), tipado fuerte end-to-end y soporte nativo para WebSockets y BullMQ.',
    decisionNote:
      'Iniciar como Monolito Modular en NestJS reduce drásticamente el tiempo de salida al MVP y los costos de DevOps frente a una malla de microservicios.'
  },
  {
    id: 'mikrotik-worker',
    layer: 'Backend y Workers',
    component: 'Colector MikroTik & Telemetría',
    recommended: 'Go (Golang) — Worker Especializado',
    alternative: 'Worker dedicado en Node.js / Python asyncio',
    justification:
      'Go maneja miles de goroutines concurrentes (sockets SNMPv3, pings ICMP y conexiones RouterOS API-SSL) con menos de 80 MB de RAM y latencia predecible sin pausas de Garbage Collector.',
    decisionNote:
      'En el MVP (hasta 10 routers) puede correr como worker aislado; al crecer a 20+ routers, extraer el colector en Go multiplica la capacidad sin escalar servidores.'
  },
  {
    id: 'queues',
    layer: 'Backend y Workers',
    component: 'Colas Asíncronas y Programador',
    recommended: 'Redis 7 + BullMQ',
    alternative: 'RabbitMQ / Temporal.io',
    justification:
      'BullMQ garantiza reintentos con backoff exponencial, rate limiting por router, trabajos programados de facturación mensual y trazabilidad completa de cortes fallidos o envíos de WhatsApp.',
    decisionNote:
      'Redis se reutiliza además para locks distribuidos (idempotencia de pagos) y pub/sub para streaming de gráficos en vivo.'
  },
  {
    id: 'database',
    layer: 'Datos y GIS',
    component: 'Base de Datos Relacional + GIS + Series Temporales',
    recommended: 'PostgreSQL 16 + PostGIS + TimescaleDB',
    alternative: 'PostgreSQL + InfluxDB separados',
    justification:
      'Consolidar datos transaccionales (facturación ACID), geoespaciales (PostGIS) y métricas de ancho de banda (TimescaleDB) en un único motor PostgreSQL simplifica backups, consultas cruzadas (JOIN cliente-tráfico-torre) y operación.',
    decisionNote:
      'TimescaleDB ofrece compresión columnar >85% y políticas de retención automáticas (ej. detalle cada 1 min por 15 días, promedios horarios por 2 años).'
  },
  {
    id: 'vpn',
    layer: 'Integraciones',
    component: 'Conectividad Segura hacia MikroTik',
    recommended: 'WireGuard Hub-and-Spoke (Nativo RouterOS v7)',
    alternative: 'OpenVPN / SSTP / Tailscale',
    justification:
      'WireGuard corre en espacio de kernel en RouterOS v7, reconecta en milisegundos ante microcortes de enlace, consume mínima CPU y elimina la necesidad de abrir puertos WAN o contratar IPs públicas en cada torre.',
    decisionNote:
      'En equipos antiguos con RouterOS v6 que no soporten actualización a v7, mantener un túnel SSTP/L2TP+IPsec de compatibilidad estrictamente aislado.'
  },
  {
    id: 'payments',
    layer: 'Integraciones',
    component: 'Pasarelas de Pago',
    recommended: 'Patrón Adapter: MercadoPago + Stripe + PayPal',
    alternative: 'Integración acoplada por país',
    justification:
      'Implementar una interfaz común `PaymentGatewayAdapter` permite activar MercadoPago en LATAM, Stripe para tarjetas internacionales y PayPal sin alterar la lógica del libro mayor ni las reglas de reconexión.',
    decisionNote:
      'Todos los webhooks deben validarse mediante firma HMAC-SHA256 y re-confirmarse contra la API oficial de la pasarela antes de reconectar un servicio.'
  },
  {
    id: 'notifications',
    layer: 'Integraciones',
    component: 'Alertas WhatsApp y Correo',
    recommended: 'Meta WhatsApp Cloud API (fallback Twilio) + AWS SES / SendGrid',
    alternative: 'Gateways no oficiales (riesgo de baneo)',
    justification:
      'Usar la API oficial de Meta evita bloqueos de número corporativo y reduce costos frente a intermediarios. Plantillas pre-aprobadas para recordatorio de pago, aviso de corte y mantenimiento programado.',
    decisionNote:
      'Separar colas de alta prioridad (confirmación de pago / corte) de colas masivas (mantenimiento por zona) para respetar los límites de throughput de Meta.'
  },
  {
    id: 'reports',
    layer: 'Integraciones',
    component: 'Motor de Reportes (PDF y Excel)',
    recommended: 'PDFKit / Typst (facturas) + ExcelJS + S3/Cloudflare R2',
    alternative: 'Puppeteer / Chromium Headless',
    justification:
      'PDFKit o plantillas compiladas generan cientos de facturas por segundo sin el alto consumo de RAM de navegadores headless. ExcelJS crea hojas multi-pestaña en streaming para reportes de morosidad e inventario.',
    decisionNote:
      'Los reportes pesados se generan de forma asíncrona en background y se entregan al usuario vía URL pre-firmada temporal (expiración 15 minutos).'
  }
];

export const MIKROTIK_METHODS: MikrotikMethodComparison[] = [
  {
    method: 'Firewall Address-List (wisp_morosos) + Simple Queues / PCQ',
    scaleLimit: 'Hasta ~2,500 clientes por router',
    cpuImpact: 'Muy bajo (regla única en Firewall)',
    cutSpeed: 'Inmediato (< 1 seg)',
    captiveNotice: 'Excelente (NAT redirect a portal de aviso)',
    recommendation: 'Ideal para MVP y WISPs con IP Estática / DHCP Lease.'
  },
  {
    method: 'PPPoE Secrets + Address-List / Profile',
    scaleLimit: 'Hasta ~3,500 clientes por CCR',
    cpuImpact: 'Bajo–Medio (túnel PPPoE)',
    cutSpeed: 'Inmediato al cerrar sesión activa',
    captiveNotice: 'Excelente (perfil moroso con pool dedicado)',
    recommendation: 'Estándar recomendado para control estricto por usuario/sesión.'
  },
  {
    method: 'FreeRADIUS + CoA (RFC 5176) + MikroTik NAS',
    scaleLimit: '10,000+ clientes multi-router',
    cpuImpact: 'Óptimo (autenticación centralizada)',
    cutSpeed: 'Inmediato vía paquete CoA / PoD',
    captiveNotice: 'Excelente (Mikrotik-Address-List por RADIUS)',
    recommendation: 'Arquitectura objetivo en Fase 4 para WISPs en alta escala.'
  }
];

export const ROUTEROS_SCRIPTS: Record<
  'wireguard' | 'firewall' | 'rest_suspend' | 'rest_restore',
  { title: string; subtitle: string; language: string; code: string }
> = {
  wireguard: {
    title: '1. Túnel WireGuard Saliente (RouterOS v7)',
    subtitle: 'El MikroTik inicia la conexión hacia la nube; cero puertos expuestos en la WAN',
    language: 'RouterOS Script',
    code: `# 1. Crear interfaz WireGuard en el router MikroTik
/interface/wireguard/add name=wg-wisp-mgmt listen-port=51820 comment="Gestion Cloud WISP"

# 2. Configurar Peer apuntando al concentrador Cloud (Keepalive atraviesa CGNAT)
/interface/wireguard/peers/add interface=wg-wisp-mgmt \\
  public-key="<CLOUD_HUB_PUBLIC_KEY>" \\
  preshared-key="<ROUTER_UNIQUE_PSK>" \\
  endpoint-address=vpn.wisp-core.example.com \\
  endpoint-port=51820 \\
  allowed-address=10.250.0.1/32 \\
  persistent-keepalive=25s

# 3. Asignar IP fija de gestion al router dentro de la VPN
/ip/address/add address=10.250.10.24/24 interface=wg-wisp-mgmt

# 4. Restringir API-SSL y REST API EXCLUSIVAMENTE a la IP del Colector en la VPN
/ip/service/set www-ssl address=10.250.0.1/32 certificate=wisp-api-cert disabled=no
/ip/service/set api-ssl address=10.250.0.1/32 certificate=wisp-api-cert disabled=no
/ip/service/set api,www,telnet,ftp disabled=yes`
  },
  firewall: {
    title: '2. Reglas Base de Corte y Portal de Aviso de Pago',
    subtitle: 'Permite acceso solo a pasarelas de pago y muestra aviso en navegador sin cortar DNS',
    language: 'RouterOS Script',
    code: `# 1. Lista blanca de dominios/IPs de pago (MercadoPago, Stripe, Portal WISP)
/ip/firewall/address-list/add list=wisp_pagos_permitidos address=pagos.miwisp.com
/ip/firewall/address-list/add list=wisp_pagos_permitidos address=api.mercadopago.com

# 2. Permitir DNS y tráfico hacia pasarelas de pago para clientes en mora
/ip/firewall/filter/add chain=forward src-address-list=wisp_morosos \\
  dst-address-list=wisp_pagos_permitidos action=accept \\
  comment="WISP: Permitir pago online a morosos"

/ip/firewall/filter/add chain=forward src-address-list=wisp_morosos \\
  protocol=udp dst-port=53 action=accept comment="WISP: Permitir DNS a morosos"

# 3. Bloquear el resto de trafico de clientes en lista wisp_morosos
/ip/firewall/filter/add chain=forward src-address-list=wisp_morosos \\
  action=drop comment="WISP: Bloqueo trafico clientes suspendidos"

# 4. Redireccion opcional HTTP (puerto 80) al aviso de suspension
/ip/firewall/nat/add chain=dstnat src-address-list=wisp_morosos \\
  dst-address-list=!wisp_pagos_permitidos protocol=tcp dst-port=80 \\
  action=dst-nat to-addresses=10.250.0.10 to-ports=8080 \\
  comment="WISP: Redirect portal aviso de mora"`
  },
  rest_suspend: {
    title: '3. Ejecución Idempotente de Suspensión (REST API v7)',
    subtitle: 'Llamada desde el RouterOS Engine (Go) sobre el túnel WireGuard (10.250.10.24)',
    language: 'HTTP / JSON',
    code: `PUT https://10.250.10.24/rest/ip/firewall/address-list
Authorization: Basic <DECRYPTED_FROM_KMS_IN_MEMORY>
Content-Type: application/json

{
  "list": "wisp_morosos",
  "address": "100.64.12.48",
  "comment": "CLI-1042 | Factura #FAC-2026-0891 | AutoCorte"
}

// Paso adicional solo si el cliente usa PPPoE:
// 1) Actualizar perfil PPPoE a "perfil-mora" (opcional)
// 2) Desconectar sesion activa en /rest/ppp/active/remove para forzar reconexion`
  },
  rest_restore: {
    title: '4. Reconexión Automática tras Webhook Verificado',
    subtitle: 'Remoción atómica del bloqueo en menos de 1.5 segundos tras pago confirmado',
    language: 'HTTP / JSON',
    code: `// 1. Buscar entrada exacta por lista y direccion (evita errores si ya fue removida)
GET https://10.250.10.24/rest/ip/firewall/address-list?list=wisp_morosos&address=100.64.12.48

// 2. Eliminar por .id interno devuelto por RouterOS
DELETE https://10.250.10.24/rest/ip/firewall/address-list/*1A4F

// Resultado esperado: HTTP 204 No Content
// El backend persiste el evento en audit_logs y envia recibo PDF por WhatsApp.`
  }
};

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'fase1',
    phaseNumber: 'Fase 1 · MVP Operativo',
    name: 'Core MikroTik, CRM Base y App Android Inicial',
    timeframe: 'Semanas 1 – 8 (2 meses)',
    goal: 'Operar los primeros routers MikroTik de forma segura sin exponerlos a Internet, administrar clientes y ejecutar cortes/reconexiones manuales desde el Backend y Android.',
    teamProfile: '1 Arquitecto/Backend Sr · 1 Mobile Dev (Flutter/Kotlin) · 1 DevOps/Redes (part-time)',
    deliverables: [
      {
        area: 'Infraestructura Segura',
        item: 'Concentrador WireGuard Hub-and-Spoke y script de onboarding para MikroTik v7',
        acceptanceCriteria: 'Conexión de múltiples routers detrás de NAT sin puertos públicos abiertos.'
      },
      {
        area: 'Backend Core',
        item: 'API NestJS + PostgreSQL + bóveda cifrada de credenciales (AES-256-GCM) y RBAC',
        acceptanceCriteria: 'CRUD de routers, planes de velocidad, clientes e inventario básico de CPEs.'
      },
      {
        area: 'Motor MikroTik',
        item: 'Aprovisionamiento de colas/PPPoE y bloqueo/desbloqueo por address-list',
        acceptanceCriteria: 'Suspensión y reconexión idempotente con log de auditoría < 2 seg.'
      },
      {
        area: 'App Android v1',
        item: 'Login seguro, listado/búsqueda de clientes, estado de enlace y corte/reconexión',
        acceptanceCriteria: 'Permite a técnicos y administradores operar en campo desde Android.'
      }
    ],
    exitMilestone: 'Piloto en producción con 1–3 routers MikroTik y primeros 200 suscriptores reales.'
  },
  {
    id: 'fase2',
    phaseNumber: 'Fase 2 · Automatización Financiera',
    name: 'Facturación Recurrente, Pasarelas, Corte por Mora y Alertas',
    timeframe: 'Semanas 9 – 14 (1.5 meses)',
    goal: 'Eliminar la cobranza manual: facturación automática mensual, conciliación instantánea con pasarelas de pago, corte automático por mora y notificaciones WhatsApp/Email.',
    teamProfile: '2 Backend Devs · 1 Mobile Dev · 1 QA (part-time)',
    deliverables: [
      {
        area: 'Facturación y Ledger',
        item: 'Motor recurrente con prorrateo, períodos de gracia, promesas de pago y recibos PDF',
        acceptanceCriteria: 'Generación mensual idempotente sin facturas duplicadas y saldo contable exacto.'
      },
      {
        area: 'Pasarelas de Pago',
        item: 'Adaptadores para MercadoPago, Stripe y PayPal con webhooks firmados',
        acceptanceCriteria: 'Pago aprobado reconecta automáticamente al cliente en MikroTik en < 5 seg.'
      },
      {
        area: 'Control de Mora',
        item: 'Cola BullMQ de cortes programados y portal cautivo de aviso de pago',
        acceptanceCriteria: 'Procesamiento por lotes controlados que nunca saturan el CPU del router.'
      },
      {
        area: 'Notificaciones',
        item: 'Integración Meta WhatsApp Cloud API + SendGrid/SES con plantillas aprobadas',
        acceptanceCriteria: 'Envío automático de factura, recordatorio 3 días antes, aviso de corte y recibo.'
      }
    ],
    exitMilestone: 'Reducción >70% en carga administrativa de cobranza y reconexión 24/7 desatendida.'
  },
  {
    id: 'fase3',
    phaseNumber: 'Fase 3 · Visibilidad Total y Campo',
    name: 'Telemetría en Vivo, GIS Interactivo, Modo Offline y Reportes',
    timeframe: 'Semanas 15 – 20 (1.5 meses)',
    goal: 'Brindar visibilidad proactiva de la red en tiempo real, mapa GIS completo de torres y CPEs, modo offline para técnicos rurales y exportación de reportes gerenciales.',
    teamProfile: '1 Backend/Go Dev · 1 Mobile Dev · 1 Frontend/BI Dev',
    deliverables: [
      {
        area: 'Telemetría y Gráficos',
        item: 'Colector Go (SNMPv3 + ICMP) + TimescaleDB + gráficos dinámicos en tiempo real',
        acceptanceCriteria: 'Histórico de ancho de banda y latencia por cliente y alertas de caída de torre.'
      },
      {
        area: 'Mapa GIS (PostGIS)',
        item: 'Gestión visual de torres, sectores con azimut, CPEs por estado y cálculo de distancia',
        acceptanceCriteria: 'El técnico registra ubicación exacta GPS y fotos del CPE desde Android.'
      },
      {
        area: 'App Offline-First',
        item: 'Cola local cifrada (Drift/SQLite) para órdenes de instalación y cobros sin cobertura',
        acceptanceCriteria: 'Sincronización automática sin pérdida ni duplicación al recuperar señal.'
      },
      {
        area: 'Reportes Exportables',
        item: 'Exportador asíncrono PDF/Excel de morosidad, estado de red, inventario e instalaciones',
        acceptanceCriteria: 'Descarga directa desde Android y panel web mediante URLs firmadas.'
      }
    ],
    exitMilestone: 'Operación integral de campo y NOC con trazabilidad geográfica y reportería financiera.'
  },
  {
    id: 'fase4',
    phaseNumber: 'Fase 4 · Alta Escala y Resiliencia',
    name: 'FreeRADIUS + CoA, Alta Disponibilidad y Multi-Zona',
    timeframe: 'Semanas 21 – 26 (1.5 meses)',
    goal: 'Preparar la plataforma para crecer de 2,000 a más de 15,000 clientes, soportar múltiples nodos redundantes y opcionalmente operar múltiples sucursales o tenants.',
    teamProfile: '1 Arquitecto Sr · 1 Go/Infra Dev · 1 DevOps SRE',
    deliverables: [
      {
        area: 'AAA Centralizado',
        item: 'Despliegue de FreeRADIUS + soporte CoA (RFC 5176) para PPPoE/Hotspot masivo',
        acceptanceCriteria: 'Autenticación y cambios de velocidad en caliente sin modificar reglas estáticas.'
      },
      {
        area: 'Alta Disponibilidad',
        item: 'Concentrador WireGuard redundante (Primary/Backup) + Réplica PostgreSQL',
        acceptanceCriteria: 'Disponibilidad objetivo 99.9% y failover automático ante falla de región.'
      },
      {
        area: 'Observabilidad',
        item: 'Prometheus + Grafana + OpenTelemetry para métricas de negocio e infraestructura',
        acceptanceCriteria: 'Detección temprana de degradación de enlaces o saturación de colas.'
      },
      {
        area: 'Portal Autogestión',
        item: 'App o Web ligera para suscriptores finales (descarga de facturas, pago y tickets)',
        acceptanceCriteria: 'Disminución de consultas de soporte por WhatsApp en >40%.'
      }
    ],
    exitMilestone: 'Plataforma grado carrier lista para expansión regional y miles de suscriptores.'
  }
];

export const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: 'sec-1',
    domain: 'Credenciales MikroTik',
    title: 'Envelope Encryption (AES-256-GCM + KMS)',
    threatAddressed: 'Exfiltración de contraseñas de routers si se compromete un backup de base de datos.',
    implementation:
      'Las credenciales API de cada MikroTik nunca se guardan en texto plano. Se cifran con una Data Encryption Key (DEK) única envuelta por una llave maestra en AWS KMS / GCP KMS o HashiCorp Vault; solo el Worker en Go descifra en memoria durante el handshake.',
    metricOrStandard: 'AES-256-GCM · Rotación cada 90 días'
  },
  {
    id: 'sec-2',
    domain: 'Credenciales MikroTik',
    title: 'Principio de Mínimo Privilegio en RouterOS y Zero-WAN',
    threatAddressed: 'Escaneo masivo de puertos 8728/8291 en Internet y secuestro de routers.',
    implementation:
      'Todos los servicios de gestión (Winbox, SSH, API, WWW) se deshabilitan en la interfaz WAN. El acceso API-SSL/REST solo se permite desde `10.250.0.1/32` dentro del túnel WireGuard y con un usuario `wisp_api` sin privilegios de lectura de llaves privadas ni FTP.',
    metricOrStandard: '0 puertos públicos en MikroTik'
  },
  {
    id: 'sec-3',
    domain: 'Perímetro y Auth',
    title: 'Defensa Multicapa contra Fuerza Bruta y Credential Stuffing',
    threatAddressed: 'Intentos automatizados de acceso a cuentas de administradores o cobradores.',
    implementation:
      'Rate limiting progresivo en Edge (Cloudflare WAF + Nginx), bloqueo exponencial por cuenta+IP en Redis, hash de contraseñas con Argon2id, MFA obligatorio (TOTP) para roles Admin/NOC y alertas de inicio de sesión anómalo.',
    metricOrStandard: 'Argon2id · 5 intentos / 15 min lock'
  },
  {
    id: 'sec-4',
    domain: 'Perímetro y Auth',
    title: 'JWT de Vida Corta, Refresh Rotation y Certificate Pinning',
    threatAddressed: 'Interceptación MITM en redes Wi-Fi de campo o robo de sesión móvil.',
    implementation:
      'La App Android almacena tokens en Android Keystore cifrado, usa Access Tokens de 15 min con Refresh Token Rotation (detección de reuso revoca toda la familia de sesión) y TLS 1.3 con Certificate Pinning contra el dominio de la API.',
    metricOrStandard: 'JWT 15m · RBAC granular (4 roles)'
  },
  {
    id: 'sec-5',
    domain: 'Pagos e Idempotencia',
    title: 'Verificación Criptográfica de Webhooks y Libro Mayor ACID',
    threatAddressed: 'Webhooks falsificados para reconectar servicios sin pagar o doble cobro/facturación.',
    implementation:
      'Validación estricta de firmas HMAC-SHA256 (Stripe/MercadoPago) + consulta de verificación al endpoint oficial antes de acreditar. Claves de idempotencia en PostgreSQL + locks en Redis impiden doble aplicación de pagos o facturas repetidas.',
    metricOrStandard: '0% pagos fantasma · PCI-DSS SAQ-A'
  },
  {
    id: 'sec-6',
    domain: 'Pagos e Idempotencia',
    title: 'Protección de PII de Clientes y Auditoría Inmutable',
    threatAddressed: 'Acceso indebido a datos personales, direcciones GPS o historial financiero.',
    implementation:
      'Cifrado en reposo de discos y backups, enmascaramiento de datos sensibles en logs (Pino redaction) y tabla `audit_logs` append-only que registra quién ejecutó cada corte, reconexión, ajuste de saldo o exportación.',
    metricOrStandard: 'Trazabilidad 100% de acciones NOC'
  },
  {
    id: 'sec-7',
    domain: 'Escalabilidad y HA',
    title: 'Aislamiento de Fallos con Circuit Breaker y Rate Limit por Router',
    threatAddressed: 'Caída de una torre remota que bloquea hilos del backend y degrada todo el WISP.',
    implementation:
      'Cada router MikroTik cuenta con su propia cola lógica y estado de Circuit Breaker en el Worker Go. Si un enlace satelital/radio presenta 40% packet loss, el sistema limita ráfagas a 2 comandos simultáneos y protege el resto de la red.',
    metricOrStandard: 'SLA latencia API < 150 ms p95'
  },
  {
    id: 'sec-8',
    domain: 'Escalabilidad y HA',
    title: 'Baja Latencia con SNMPv3, Compresión TimescaleDB y Caching',
    threatAddressed: 'Saturación de CPU en routers MikroTik y crecimiento descontrolado de disco por telemetría.',
    implementation:
      'El monitoreo base utiliza SNMPv3 en batch (no polling constante de API), las métricas se escriben por lotes en TimescaleDB con compresión columnar automática y el dashboard móvil lee snapshots pre-agregados en Redis.',
    metricOrStandard: '>85% compresión · <2% CPU en router'
  }
];

export const INITIAL_DEMO_SUBSCRIBERS: DemoSubscriber[] = [
  {
    id: 'CLI-1042',
    name: 'Comercializadora El Mirador S.A.',
    plan: 'Plan Empresarial 100/50 Mbps',
    ip: '100.64.12.48',
    router: 'MK-TORRE-NORTE (CCR2004)',
    tower: 'Torre Norte · Sector 120°',
    cpeModel: 'MikroTik LHG 5 ac',
    signalDbm: -56,
    status: 'Activo',
    balanceDue: 0,
    downloadMbps: 74.2,
    uploadMbps: 28.6,
    latencyMs: 6.4,
    coords: { x: 28, y: 30, lat: '19.4421° N', lng: '99.1382° O' },
    historyMbps: [58, 62, 71, 69, 76, 72, 74, 81, 77, 74],
    historyLatency: [6.1, 6.5, 6.2, 7.0, 6.4, 6.3, 6.2, 6.8, 6.5, 6.4]
  },
  {
    id: 'CLI-1089',
    name: 'Residencial Familia Mendoza',
    plan: 'Plan Hogar Fibra/Radio 50/20 Mbps',
    ip: '100.64.14.112',
    router: 'MK-TORRE-NORTE (CCR2004)',
    tower: 'Torre Norte · Sector 240°',
    cpeModel: 'Ubiquiti LiteBeam 5AC Gen2',
    signalDbm: -63,
    status: 'Mora (Aviso)',
    balanceDue: 42.5,
    downloadMbps: 0.4,
    uploadMbps: 0.2,
    latencyMs: 9.8,
    coords: { x: 64, y: 24, lat: '19.4485° N', lng: '99.1219° O' },
    historyMbps: [32, 29, 34, 28, 12, 0.5, 0.3, 0.4, 0.2, 0.4],
    historyLatency: [9.2, 9.5, 10.1, 9.8, 9.6, 9.7, 9.9, 9.8, 9.7, 9.8]
  },
  {
    id: 'CLI-1124',
    name: 'Agrícola Valle Verde',
    plan: 'Enlace Dedicado 150/150 Mbps',
    ip: '100.64.18.20',
    router: 'MK-CERRO-SUR (RB5009)',
    tower: 'Cerro Sur · Sector 45°',
    cpeModel: 'Mimosa C5x + Dish 25dBi',
    signalDbm: -52,
    status: 'Activo',
    balanceDue: 0,
    downloadMbps: 118.5,
    uploadMbps: 94.1,
    latencyMs: 4.1,
    coords: { x: 74, y: 72, lat: '19.4192° N', lng: '99.1154° O' },
    historyMbps: [95, 104, 112, 108, 119, 124, 116, 121, 115, 118],
    historyLatency: [4.2, 4.0, 4.3, 4.1, 4.0, 4.2, 4.1, 4.0, 4.1, 4.1]
  },
  {
    id: 'CLI-1157',
    name: 'Taller Mecánico Los Pinos',
    plan: 'Plan PyME 30/15 Mbps',
    ip: '100.64.19.87',
    router: 'MK-CERRO-SUR (RB5009)',
    tower: 'Cerro Sur · Sector 300°',
    cpeModel: 'MikroTik SXTsq 5 ac',
    signalDbm: -71,
    status: 'Suspendido',
    balanceDue: 78.0,
    downloadMbps: 0,
    uploadMbps: 0,
    latencyMs: 14.2,
    coords: { x: 24, y: 74, lat: '19.4208° N', lng: '99.1440° O' },
    historyMbps: [22, 18, 25, 0, 0, 0, 0, 0, 0, 0],
    historyLatency: [13.8, 14.5, 14.1, 14.2, 14.0, 14.3, 14.2, 14.1, 14.2, 14.2]
  }
];

export function generateFullMarkdownProposal(): string {
  const enterpriseBlocks = ALL_ENTERPRISE_SPECS.map(
    (spec) => `### [${spec.code}] ${spec.title} (${spec.priorityLabel} · ${spec.targetPhase})
- **Descripción Funcional:** ${spec.functionalDescription}
- **Valor de Negocio:** ${spec.businessValue}
- **Endpoints REST:**
${spec.endpoints.map((ep) => `  - \`${ep.method} ${ep.path}\` — ${ep.description}`).join('\n')}
- **Flujo de Usuario / Sistema:**
${spec.userFlow.map((step) => `  - ${step}`).join('\n')}
- **Dependencias con Módulos Existentes:**
${spec.dependencies.map((d) => `  - **${d.module}:** ${d.integration}`).join('\n')}

\`\`\`sql
${spec.dataModelSql}
\`\`\`
`
  ).join('\n---\n\n');

  const roadmapBlocks = THREE_PHASE_ROADMAP.map(
    (p) => `### ${p.phaseTag}: ${p.title} (${p.duration})
- **Escala Objetivo:** ${p.scaleTarget}
- **Objetivo:** ${p.objective}
- **Equipo Sugerido:** ${p.team}
- **Módulos Priorizados:**
${p.modulesIncluded
  .map((m) => `  - **[${m.priority}] [${m.area}] ${m.name}:** ${m.deliverable}`)
  .join('\n')}
- **Criterio Go-Live:** ${p.complianceGate}
`
  ).join('\n');

  return `# Arquitectura WISP Core — Especificación Enterprise (Colombia Legal + Alta Escala)

## 1. Arquitectura Base (Zero-Exposure MikroTik)

- **App Android (Flutter + Drift/SQLite o Kotlin Jetpack Compose + Room):** Cliente offline-first para técnicos de campo, cobradores y NOC vía HTTPS TLS 1.3 + Certificate Pinning + WebSockets.
- **Edge WAF y API Gateway (Cloudflare + Nginx):** Terminación TLS 1.3, rate limiting contra fuerza bruta, CDN para Portal de Clientes y validación de webhooks.
- **Backend Core (NestJS) + Colas (Redis / BullMQ):** CRM, Billing Engine, DIAN UBL 2.1, pasarelas locales (Wompi/PayU/Nequi/Daviplata), Tickets SLA, Inventario y Auditoría.
- **RouterOS Engine & Colector (Go):** Polling SNMPv3 cada 60s, ICMP cada 30s, REST API v7 / API-SSL bajo demanda, Circuit Breaker y reconciliación automática.
- **Datos (PostgreSQL 16 + PostGIS + TimescaleDB + Redis):** Integridad ACID, RLS multi-tenant, GIS, retención 30 días crudos / 1 año agregados y caché NOC.
- **WireGuard Hub-and-Spoke (10.250.0.0/16):** Cero puertos WAN expuestos en MikroTik.

---

## 2. Especificaciones Enterprise, Arquitectura, Seguridad y Colombia Legal

${enterpriseBlocks}

---

## 3. Roadmap Priorizado en 3 Fases (Colombia Legal → Escalamiento → Enterprise)

${roadmapBlocks}
`;
}
