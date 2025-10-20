# FM Portfolio

Aplicación web tipo TradingView para uso personal, construida con Next.js 14, Tailwind y SQLite mediante Drizzle ORM. Usa Financial Modeling Prep (FMP) como proveedor de datos por defecto.

## Requisitos

- Node.js 18+
- Clave de API de [Financial Modeling Prep](https://financialmodelingprep.com/developer/docs/) (gratuita para uso personal).

## Instalación

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de entorno y configura tu clave (no lo publiques):

   ```bash
   cp .env.example .env
   # Edita .env y establece FMP_API_KEY=tu_clave
   ```

3. Ejecuta migraciones y datos iniciales:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. Inicia el entorno de desarrollo:

   ```bash
   npm run dev
   ```

   La app estará disponible en `http://localhost:3000`. Asegúrate de que el archivo `.env` no se sube al repositorio (`.gitignore` ya lo cubre).

## Rutas clave

- `/chart`: gráfico de velas, indicadores configurables (EMA, RSI, MACD, VWAP anclado, Supertrend), herramientas de dibujo ligeras (Lightweight Charts) y watchlist editable.
- `/portfolio`: posiciones, PnL y registro de operaciones.
- `/alerts`: CRUD de alertas con entrega por WebSocket (`ws://localhost:3000/ws`) y log en `alerts.log`.
- `/backtest`: backtest simple de cruce de medias + RSI con métricas resumidas.

## API Resumen

- `GET /api/symbols`
- `POST /api/symbols/refresh`
- `GET /api/quotes`
- `POST /api/indicators`
- `GET /api/portfolio/positions`
- `GET /api/portfolio/pnl`
- `POST /api/trades/import`
- `GET|POST /api/alerts`, `PATCH /api/alerts/:id`
- `POST /api/backtest/run`

Validadas con Zod y con rate limiting suave (60 req/min) para endpoints sensibles.

## WebSocket

Con la app en ejecución (`npm run dev`), conéctate a `ws://localhost:3000/ws` para recibir alertas:

```js
const socket = new WebSocket('ws://localhost:3000/ws');
socket.onmessage = (event) => console.log(JSON.parse(event.data));
```

## Scheduler de alertas

Lanza el evaluador cada minuto:

```bash
npm run alerts:run
```

Registra alertas en consola y en `alerts.log`.

## Importación de operaciones

Ejemplo de CSV disponible en `scripts/import_trades_example.csv` con columnas:
symbol,side,qty,price,ts,fees
Sube el archivo vía `POST /api/trades/import` (cuerpo en texto plano) para actualizar operaciones y posiciones.

## Tests

Ejecuta las pruebas de indicadores (Vitest) con:

```bash
npm test
```

Los indicadores mantienen >=80% de cobertura en `lib/indicators`.

## Notas de seguridad

- Mantén tu `.env` fuera de control de versiones.
- El uso de la API de FMP debe cumplir sus términos y límites de rate.
- El email de alertas se simula mediante logs en consola/archivo para evitar enviar correos reales.
