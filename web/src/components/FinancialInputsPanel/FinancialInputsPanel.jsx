import React, { useState } from 'react';
import { FiSliders, FiRefreshCw, FiRotateCcw, FiDollarSign, FiPercent, FiTruck, FiTarget, FiCreditCard } from 'react-icons/fi';
import styles from './FinancialInputsPanel.module.css';

// Debe ser obtenido desde el backend.
export const DEFAULT_FINANCIAL_INPUTS = {
    // Modelo Pago Anticipado
    shippingCostPrepaid: 5000,
    cpaPrepaid: 8000,
    desiredProfitPrepaid: 8000,
    commissionPctPrepaid: 6,

    // Modelo Pago Contra Entrega (COD)
    shippingCostCod: 8000,
    cpaCod: 4000,
    desiredProfitCod: 8000,
    deliveryRatePctCod: 70,
    failedShippingCostCod: 8000
};

const FinancialInputsPanel = ({ onApplyParams, initialValues = DEFAULT_FINANCIAL_INPUTS }) => {
    const [inputs, setInputs] = useState({ ...DEFAULT_FINANCIAL_INPUTS, ...initialValues });
    const [isOpen, setIsOpen] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: value === '' ? '' : Number(value)
        }));
    };

    const handleApply = (e) => {
        if (e) e.preventDefault();

        const formattedParams = {
            // Pago Anticipado
            shippingCostPrepaid: Number(inputs.shippingCostPrepaid) || 0,
            cpaPrepaid: Number(inputs.cpaPrepaid) || 0,
            desiredProfitPrepaid: Number(inputs.desiredProfitPrepaid) || 0,
            commissionPctPrepaid: (Number(inputs.commissionPctPrepaid) || 0) / 100,

            // Pago Contra Entrega (COD)
            shippingCostCod: Number(inputs.shippingCostCod) || 0,
            cpaCod: Number(inputs.cpaCod) || 0,
            desiredProfitCod: Number(inputs.desiredProfitCod) || 0,
            deliveryRatePctCod: (Number(inputs.deliveryRatePctCod) || 0) / 100,
            failedShippingCostCod: Number(inputs.failedShippingCostCod) || 0
        };

        if (onApplyParams) {
            onApplyParams(formattedParams);
        }
    };

    const handleReset = () => {
        setInputs(DEFAULT_FINANCIAL_INPUTS);
        const formattedParams = {
            shippingCostPrepaid: DEFAULT_FINANCIAL_INPUTS.shippingCostPrepaid,
            cpaPrepaid: DEFAULT_FINANCIAL_INPUTS.cpaPrepaid,
            desiredProfitPrepaid: DEFAULT_FINANCIAL_INPUTS.desiredProfitPrepaid,
            commissionPctPrepaid: DEFAULT_FINANCIAL_INPUTS.commissionPctPrepaid / 100,

            shippingCostCod: DEFAULT_FINANCIAL_INPUTS.shippingCostCod,
            cpaCod: DEFAULT_FINANCIAL_INPUTS.cpaCod,
            desiredProfitCod: DEFAULT_FINANCIAL_INPUTS.desiredProfitCod,
            deliveryRatePctCod: DEFAULT_FINANCIAL_INPUTS.deliveryRatePctCod / 100,
            failedShippingCostCod: DEFAULT_FINANCIAL_INPUTS.failedShippingCostCod
        };
        if (onApplyParams) {
            onApplyParams(formattedParams);
        }
    };

    return (
        <div className={`${styles.panelContainer} glass-panel`}>
            <div className={styles.panelHeader} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.titleGroup}>
                    <FiSliders className={styles.headerIcon} />
                    <div>
                        <h3 className={styles.title}>Parámetros Financieros Independientes</h3>
                        <p className={styles.subtitle}>Configura las variables específicas para Pago Anticipado y Pago Contra Entrega.</p>
                    </div>
                </div>
                <button type="button" className={styles.toggleBtn}>
                    {isOpen ? 'Ocultar' : 'Configurar'}
                </button>
            </div>

            {isOpen && (
                <form onSubmit={handleApply} className={styles.formContainer}>
                    <div className={styles.modelsGrid}>
                        {/* SECCIÓN 1: PAGO ANTICIPADO */}
                        <div className={styles.modelCard} style={{ borderColor: 'rgba(56, 189, 248, 0.25)' }}>
                            <div className={styles.modelHeader} style={{ color: '#38bdf8' }}>
                                <FiCreditCard className={styles.modelIcon} />
                                <h4>Pago Anticipado (E-commerce Tradicional)</h4>
                            </div>

                            <div className={styles.fieldGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiTruck className={styles.inputIcon} /> Costo Envío ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="shippingCostPrepaid"
                                        className={styles.input}
                                        value={inputs.shippingCostPrepaid}
                                        onChange={handleChange}
                                        placeholder="5000"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiTarget className={styles.inputIcon} /> CPA / Publicidad ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="cpaPrepaid"
                                        className={styles.input}
                                        value={inputs.cpaPrepaid}
                                        onChange={handleChange}
                                        placeholder="8000"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiDollarSign className={styles.inputIcon} /> Ganancia Deseada ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="desiredProfitPrepaid"
                                        className={styles.input}
                                        value={inputs.desiredProfitPrepaid}
                                        onChange={handleChange}
                                        placeholder="8000"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiPercent className={styles.inputIcon} /> Comisión Pasarela (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        name="commissionPctPrepaid"
                                        className={styles.input}
                                        value={inputs.commissionPctPrepaid}
                                        onChange={handleChange}
                                        placeholder="6"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: PAGO CONTRA ENTREGA (COD) */}
                        <div className={styles.modelCard} style={{ borderColor: 'rgba(99, 102, 241, 0.25)' }}>
                            <div className={styles.modelHeader} style={{ color: '#818cf8' }}>
                                <FiTruck className={styles.modelIcon} />
                                <h4>Pago Contra Entrega (COD / Dropi)</h4>
                            </div>

                            <div className={styles.fieldGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiTruck className={styles.inputIcon} /> Costo Envío COD ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="shippingCostCod"
                                        className={styles.input}
                                        value={inputs.shippingCostCod}
                                        onChange={handleChange}
                                        placeholder="8000"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiTarget className={styles.inputIcon} /> CPA / Publicidad ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="cpaCod"
                                        className={styles.input}
                                        value={inputs.cpaCod}
                                        onChange={handleChange}
                                        placeholder="4000"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiDollarSign className={styles.inputIcon} /> Ganancia Deseada ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="desiredProfitCod"
                                        className={styles.input}
                                        value={inputs.desiredProfitCod}
                                        onChange={handleChange}
                                        placeholder="8000"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiPercent className={styles.inputIcon} /> Efectividad Entrega (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        name="deliveryRatePctCod"
                                        className={styles.input}
                                        value={inputs.deliveryRatePctCod}
                                        onChange={handleChange}
                                        placeholder="70"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>
                                        <FiTruck className={styles.inputIcon} /> Flete Devolución ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="failedShippingCostCod"
                                        className={styles.input}
                                        value={inputs.failedShippingCostCod}
                                        onChange={handleChange}
                                        placeholder="8000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actionsRow}>
                        <button type="submit" className={styles.submitBtn}>
                            <FiRefreshCw className={styles.btnIcon} /> Recalcular Precios
                        </button>
                        <button type="button" onClick={handleReset} className={styles.resetBtn}>
                            <FiRotateCcw className={styles.btnIcon} /> Restablecer Defaults
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default FinancialInputsPanel;
