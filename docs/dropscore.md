# 🚀 DropScore: Score de Viabilidad de Producto

El **DropScore** es una métrica calculada dinámicamente por la API (de 1 a 100) que determina la viabilidad y rentabilidad general de un producto en base a su rendimiento de ventas reciente, rentabilidad bruta y aceleración de tendencia.

Esta métrica tiene como objetivo reducir la sobrecarga cognitiva al elegir productos, permitiendo al vendedor identificar de un solo vistazo productos "ganadores" sin necesidad de analizar múltiples columnas financieras de forma aislada.

---

## 📊 Fórmula de Ponderación

El Score final se calcula a partir de tres componentes normalizados a un rango de 0 a 100, más un bono de aceleración por despegue:

$$DropScore = (P_{\text{perf}} \times 0.35) + (P_{\text{vol}} \times 0.35) + (P_{\text{growth}} \times 0.30) + \text{Bono}_{\text{breakout}}$$

> [!NOTE]
> El resultado final siempre está limitado al rango de `[0, 100]` y se redondea al entero más cercano.

---

## 🔍 Detalles de los Componentes

### 1. Rentabilidad / Margen ($P_{\text{perf}}$) - Peso: 35%
Evalúa el porcentaje de ganancia bruta proyectado para el modelo de **Pago Contra Entrega (COD)**.
- **Cálculo de Margen:** 
  $$\text{margin}_{\text{cod}} = \frac{\text{suggestedPrice}_{\text{cod}} - \text{costPrice}}{\text{suggestedPrice}_{\text{cod}}}$$
- **Normalización (0 a 100):**
  $$P_{\text{perf}} = \min\left(100, \max\left(0, \frac{\text{margin}_{\text{cod}} - 0.2}{0.6} \times 100\right)\right)$$
  - Un margen COD del **80% o más** otorga **100 puntos** en este componente.
  - Un margen de **20% o menos** otorga **0 puntos**.

---

### 2. Volumen de Ventas ($P_{\text{vol}}$) - Peso: 35%
Mide la tracción y consistencia del volumen de ventas del producto según los días del periodo evaluado.
- **Promedio de Ventas Diarias:** 
  $$\text{dailyAverageSales} = \frac{\text{totalQuantitySold}}{\text{periodDays}}$$
- **Normalización (0 a 100):**
  $$P_{\text{vol}} = \min\left(100, \frac{\text{dailyAverageSales}}{15} \times 100\right)$$
  - Un promedio diario de **15 o más unidades** otorga **100 puntos**.
  - Si el promedio es menor, se escala de forma lineal en base a la meta de 15.

---

### 3. Crecimiento de Tendencia ($P_{\text{growth}}$) - Peso: 30%
Evalúa la aceleración del producto en la segunda mitad del periodo comparada con la primera mitad.
- **Normalización (0 a 100):**
  - Si $\text{trendGrowth} \le 0$, entonces $P_{\text{growth}} = 0$.
  - Si $\text{trendGrowth} > 0$:
    $$P_{\text{growth}} = \min\left(100, \frac{\text{trendGrowth}}{150} \times 100\right)$$
  - Un crecimiento sostenido del **150% o superior** otorga **100 puntos**.

---

### 4. Bono de Despegue ($\text{Bono}_{\text{breakout}}$)
Para aquellos productos nuevos o previamente inactivos que están despegando rápidamente desde 0 ventas, el sistema asigna un bono de aceleración:
- Si $\text{isBreakout} = \text{true}$:
  $$\text{Bono}_{\text{breakout}} = +15\text{ puntos}$$
- Si $\text{isBreakout} = \text{false}$:
  $$\text{Bono}_{\text{breakout}} = 0$$

---

## 🟢 Rangos de Viabilidad y Frontend

En la interfaz web, el DropScore se visualiza dentro de un anillo de color y se complementa con un distintivo visual según su rango:

| Rango de Score | Clasificación | Color | Insignia Especial |
| :------------ | :------------ | :---- | :---------------- |
| **85 - 100**  | Excelente     | Verde (`#10b981`) | 🔥 **GANADOR** (Con animación de pulso) |
| **80 - 84**   | Alto          | Verde (`#10b981`) | Ninguna |
| **50 - 79**   | Medio         | Amarillo/Naranja (`#f59e0b`) | Ninguna |
| **0 - 49**    | Bajo          | Rojo (`#ef4444`)  | Ninguna |
