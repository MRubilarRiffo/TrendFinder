# Algoritmos de Guardrails e Integridad de Inventario

Esta guía documenta los filtros matemáticos y reglas de negocio implementadas en `api/src/domain/InventorySync/` y `api/src/workers/snapshots/salesSnapshotRunner.js` para diferenciar reducciones reales de stock de ajustes manuales o pausas de proveedor en Dropi.

---

## 📌 1. El Problema del Ruido en Inventarios Mayoristas

En plataformas de dropshipping y distribución mayorista (B2B), los proveedores frecuentemente:
- Retiran lotes enteros de productos para atender órdenes de otros canales.
- Pausan publicaciones vaciando el stock a `0`.
- Ajustan discrepancias físicas en bodega.

Si el sistema tratara cada reducción de inventario como una venta de usuario final, un producto con 1.000 unidades que es retirado de golpe registraría 1.000 ventas artificiales, distorsionando el catálogo analítico.

---

## 🛡️ 2. Guardrails Implementados en `InventorySync`

### 2.1 Guardrail 1: Agotamiento Masivo (*Stock Zeroing*)
- **Fórmula de Disparo**:
  $$\text{stock}_{\text{anterior}} \ge 30 \quad \text{y} \quad \text{stock}_{\text{nuevo}} \le 2$$
- **Lógica**: Si un producto con inventario saludable pasa a casi cero en una sola lectura horaria, se cataloga como **vaciado manual o pausa de proveedor**.
- **Acción**: Se actualiza el inventario en la tabla `Stocks`, pero **no se inserta ninguna fila en `ProductSales`**.

---

### 2.2 Guardrail 2: Velocidad Máxima en Escaneos Regulares (*Batch Withdrawal*)
- **Límite de Ventas Orgánicas Creíbles**:
  $$\text{maxAllowedSales} = \max\left(75, \, \lceil \max(1, \text{hoursOffline}) \rceil \times 30\right)$$
- **Lógica**: En una ejecución periódica habitual (cada 1 hora), una caída superior a 75 unidades en un solo producto (sin historial previo de tracción) es un retiro de lote.
- **Acción**: Si $\text{soldAmount} > \text{maxAllowedSales}$, se ajusta el stock sin crear registros de venta falsos.

---

### 2.3 Guardrail 3: Redistribución Retroactiva tras Inactividad Prolongada (`botState.js`)
Si el scraper estuvo inactivo por más de 25 horas (por ejemplo, debido a mantenimiento del servidor o un fallo de red):
- Imputar toda la caída en el minuto de reconexión crearía un pico anómalo artificial.
- **Solución**:
  1. Se calcula el tiempo inactivo con `botState.js` (`getLastRunFinishedAt()`).
  2. Se divide el volumen de ventas equitativamente a lo largo de los días transcurridos (`daysOffline = Math.floor(hoursOffline / 24)`).
  3. Se aplica un techo máximo diario de seguridad (`MAX_DAILY_OFFLINE_SALES = 250` unidades).
  4. Se insertan las ventas con marcas de tiempo retroactivas correspondientes a cada día del corte.

---

## 📈 3. Suavizado Estadístico en Snapshots: Winsorización de Tukey

En `salesSnapshotRunner.js`, al calcular los snapshots analíticos de 7 y 30 días, se aplica la función pura [`winsorizeDailySales()`](../../api/src/functions/salesCalculations.js) sobre la serie temporal que alimenta las mini-gráficas (*sparklines*):

1. **Cuartiles de la Serie Diaria**: Se calculan el percentil 25 ($Q1$) y el percentil 75 ($Q3$) de las ventas de cada día.
2. **Rango Intercuartílico**: $IQR = Q3 - Q1$.
3. **Valla Superior de Tukey para Valores Extremos**:
   $$\text{upperFence} = \max\left(15, \, Q3 + (3 \times \max(1, IQR))\right)$$
4. **Condición de Activación y Acotamiento**:
   - Para no distorsionar productos con ventas bajas u orgánicas, la Winsorización solo actúa sobre días donde `quantitySold > 30` (`minOutlierThreshold = 30`) **y** `quantitySold > upperFence`.
   - Si se cumple la condición, el valor visual se topa a $\text{upperFence}$ para la serie de la gráfica (`dailySales`), preservando el cálculo total de ingresos y profit original intacto.
