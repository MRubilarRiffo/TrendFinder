---
trigger: always_on
description: Reglas matemáticas, fórmulas financieras (COD vs Prepago), cálculo de DropScore y métricas de tendencia.
---

# Regla: DropScore y Dominio Financiero

Esta regla define los estándares de cálculo matemático, modelos financieros y métricas de viabilidad que rigen la lógica de negocio de TrendFinder.

---

## 1. Algoritmo DropScore (Score de Viabilidad)

El **DropScore** evalúa de forma holística si un producto es un "ganador" en una escala de `0` a `100`.

### Fórmula Oficial
$$DropScore = (P_{\text{perf}} \times 0.35) + (P_{\text{vol}} \times 0.35) + (P_{\text{growth}} \times 0.30) + \text{Bono}_{\text{breakout}}$$

1. **Margen Bruto COD ($P_{\text{perf}}$, 35%)**:
   - Margen calculado: $\text{margin}_{\text{cod}} = (\text{suggestedPrice}_{\text{cod}} - \text{costPrice}) / \text{suggestedPrice}_{\text{cod}}$.
   - Normalización lineal:
     $$P_{\text{perf}} = \min\left(100, \max\left(0, \frac{\text{margin}_{\text{cod}} - 0.20}{0.60} \times 100\right)\right)$$
   - Margen $\ge 80\% \to 100$ pts; margen $\le 20\% \to 0$ pts.
2. **Volumen de Ventas Diario ($P_{\text{vol}}$, 35%)**:
   - Basado en el promedio diario de ventas ($\text{dailyAverageSales} = \text{totalQuantitySold} / \text{daysEvaluated}$).
   - Normalización lineal con meta de 15 unidades/día:
     $$P_{\text{vol}} = \min\left(100, \frac{\text{dailyAverageSales}}{15} \times 100\right)$$
3. **Crecimiento de Tendencia ($P_{\text{growth}}$, 30%)**:
   - Compara ventas de la segunda mitad del periodo (`recentSales`) contra la primera mitad (`oldSales`).
   - Si $\text{trendGrowth} \le 0 \to 0$ pts.
   - Si $\text{trendGrowth} > 0$:
     $$P_{\text{growth}} = \min\left(100, \frac{\text{trendGrowth}}{150} \times 100\right)$$
   - Crecimiento sostenido $\ge 150\% \to 100$ pts.
4. **Bono de Despegue ($\text{Bono}_{\text{breakout}}$)**:
   - Si un producto arranca desde 0 ventas anteriores (`oldSales === 0`) y acumula ventas recientes significativas ($\ge 2$ unidades), se activa `isBreakout = true`.
   - Asigna **+15 puntos** adicionales directos.
5. **Acotamiento y Redondeo**:
   - El resultado final debe acotarse estrictamente entre `0` y `100`: `Math.min(100, Math.max(0, Math.round(score)))`.

---

## 2. Aceleración de Tendencia y Suavizado Logarítmico

Al calcular `calculateTrendGrowth(recentSales, oldSales)`:
- Si ambos son 0 $\to 0\%$.
- Si $\text{oldSales} > 0$:
  $$\text{trendGrowth} = \frac{\text{recentSales} - \text{oldSales}}{\text{oldSales}} \times 100$$
- Si $\text{oldSales} = 0$ y $\text{recentSales} > 0$:
  $$\text{trendGrowth} = 100 \times (1 + \log_{10}(\text{recentSales}))$$
  Esto evita porcentajes ficticios infinitos y premia la aceleración real.
- Siempre acotar el porcentaje en el rango seguro `[-99999.99, 99999.99]`.

---

## 3. Modelo Financiero: Pago Contra Entrega (COD) vs Prepago

En `financialCalculations.js`:

### Parámetros por Defecto de la Industria
- Tasa de entrega efectiva (`deliveryRatePct`): `0.75` (75% entregas exitosas, 25% devoluciones).
- Costo de flete promedio (`shippingCost`): `16,000` (moneda local COP).
- Costo de flete por devolución (`returnShippingCost`): `22,000`.
- Comisión plataforma Dropi (`platformFeeRate`): `0.05` (5%).
- Costo por adquisición publicitaria estimado (`cpa`): `25,000`.
- Ganancia neta deseada por venta entregada (`desiredProfit`): `20,000`.

### Fórmula Precio Sugerido COD
Para garantizar la ganancia neta deseada ponderando las entregas fallidas:
$$\text{suggestedPrice}_{\text{cod}} = \frac{\text{desiredProfit} + \text{costPrice} + \text{shippingCost} + \text{cpa} + \left(\frac{1 - \text{deliveryRatePct}}{\text{deliveryRatePct}} \times \text{returnShippingCost}\right)}{1 - \text{platformFeeRate}}$$

### Fórmula Precio Sugerido Prepago (E-commerce Tradicional)
$$\text{suggestedPrice}_{\text{prepaid}} = \frac{\text{costPrice} + \text{desiredProfit} + \text{cpa} + \text{shippingCost}}{1 - \text{platformFeeRate}}$$

---

## 4. Formateo y Manejo de Monedas por País (`formatPrice.js`)

- **Colombia (`Colombia` / `COP`)**: 0 decimales, separador de miles con punto (`$ 65.000`).
- **Chile (`Chile` / `CLP`)**: 0 decimales, separador de miles (`$ 24.990`).
- **México (`México` / `MXN`)**: 2 decimales (`$ 450.00`).
- **Panamá (`Panamá` / `PAB` / `USD`)**: 2 decimales (`$ 25.50`).
- Si el valor no es numérico o falta el país, manejarlo de forma segura sin arrojar excepciones no controladas.

---

## 5. Tratamiento Estadístico de Picos y Winsorización (`winsorizeDailySales`)

Para evitar que picos aislados de ventas (por ejemplo, 1.000 unidades en un solo día frente a una media de 10) o anomalías históricas distorsionen las sparklines, gráficos de evolución temporal y métricas de escala visual en el frontend:

- **Algoritmo de Winsorización (Valla Superior de Tukey)**:
  - Sobre la serie temporal de ventas diarias, se ordenan los valores y se calculan el percentil 25 ($Q1$) y el percentil 75 ($Q3$).
  - Se obtiene el rango intercuartílico ($IQR = Q3 - Q1$).
  - La cota superior de corte (valla de Tukey para valores extremos severos) se define como:
    $$\text{upperFence} = Q3 + (3 \times IQR)$$
  - Con un umbral mínimo de seguridad ($\ge 10$) para no truncar variaciones naturales en productos de baja rotación.
- **Topado Determinista**:
  - Todo valor diario que exceda $\text{upperFence}$ es acotado al valor del límite superior: `Math.min(val, upperFence)`.
  - Es una función 100% pura en `api/src/functions/salesCalculations.js` que no altera la suma total acumulada si no se requiere, pero suaviza la serie gráfica entregada al cliente HTTP.
- **Aplicación**: Integrada tanto en `salesSnapshotRunner.js` (generación de sparklines de 7 y 30 días) como en `ProductPerformanceService.js` (historial diario para gráficos de detalle y `maxDailySales`).
