# Catálogo y Especificación de Componentes UI

Esta guía describe los componentes reutilizables de TrendFinder ubicados en `web/src/components/`, sus propiedades (*props*), responsabilidades y comportamiento visual.

---

## 📌 1. `SmartBadges` (Insignias de Estado de Producto)

- **Ubicación**: `web/src/components/SmartBadges/`
- **Propósito**: Muestra visualmente las etiquetas dinámicas de estado del producto en base a cuatro banderas booleanas recibidas como props:
  ```jsx
  <SmartBadges
    isBreakout={product.isBreakout}
    isHighTicket={product.isHighTicket}
    isDeclining={product.isDeclining}
    hasLowStock={product.hasLowStock}
  />
  ```

### Insignias Renderizadas:
- 🔥 **Despegue (`isBreakout: true`)**: Producto emergente con tracción rápida reciente sin ventas previas.
- 💎 **High Ticket (`isHighTicket: true`)**: Producto con costo significativo que deja mayor margen nominal.
- 🧊 **En Declive (`isDeclining: true`)**: Alerta de desaceleración de ventas en la segunda mitad del periodo.
- ⚠️ **Poco Stock (`hasLowStock: true`)**: Inventario crítico ($\le 10$ unidades disponibles en bodega).

> [!NOTE]
> **Insignia Numérica de DropScore**: El círculo con el puntaje numérico (0 a 100) y la insignia animada con pulso `🔥 GANADOR` (para scores $\ge 85$) se renderizan directamente en las tarjetas de producto de `Home.jsx` y en la cabecera de `ProductDetails.jsx`.

---

## 💰 2. `FinancialInputsPanel` (Simulador de Márgenes)

- **Ubicación**: `web/src/components/FinancialInputsPanel/`
- **Propósito**: Permite al usuario personalizar los costos logísticos y publicitarios en dos modelos desacoplados.

### Modelos y Parámetros Configurables:
1. **Pago Anticipado (Prepago / E-commerce tradicional)**:
   - `shippingCostPrepaid`: Costo de flete promedio (defecto: $5.000).
   - `cpaPrepaid`: Costo de adquisición publicitaria estimado (defecto: $8.000).
   - `desiredProfitPrepaid`: Ganancia neta deseada por venta entregada (defecto: $8.000).
   - `commissionPctPrepaid`: Comisión porcentual de plataforma (defecto: 6%).
2. **Pago Contra Entrega (COD / Dropi)**:
   - `shippingCostCod`: Costo de flete de ida (defecto: $8.000).
   - `cpaCod`: Costo de adquisición publicitaria estimado (defecto: $4.000).
   - `desiredProfitCod`: Ganancia neta deseada (defecto: $8.000).
   - `deliveryRatePctCod`: Tasa de entrega efectiva (defecto: 70%).
   - `failedShippingCostCod`: Costo de flete por devolución (defecto: $8.000).

Al pulsar el botón **"Recalcular Precios"**, el componente emite los parámetros normalizados a la vista padre para disparar una nueva cotización hacia la API REST.

---

## 📊 3. Gráficas de Tendencias: `SimpleLineChart` y `DualLineChart`

- **`SimpleLineChart`**:
  - Dibuja la evolución de ventas diarias (1, 7 o 30 días) en formato SVG responsivo tanto en las tarjetas del catálogo como en la ficha técnica de `ProductDetails`.
  - Se beneficia del suavizado de picos (Winsorización de Tukey) pre-procesado en el backend.
- **`DualLineChart`**:
  - Componente de visualización con doble eje (volumen de unidades vs ingresos) disponible en el catálogo de componentes para futuros análisis comparativos avanzados.

---

## 🔍 4. `ProductSearch` (Buscador y Filtros)

- **Ubicación**: `web/src/components/ProductSearch/`
- **Propósito**: Barra de búsqueda reactiva con selección de país y ordenamiento.
- **Validaciones**: Requiere un término mínimo de 2 caracteres útiles antes de disparar la consulta al backend. Muestra sugerencias y estados de carga no invasivos (*spinners*).
