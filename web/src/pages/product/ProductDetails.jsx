import styles from './ProductDetails.module.css';
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductStats } from '../../services/trendFinder';
import { FiArrowLeft, FiTrendingUp, FiDollarSign, FiActivity, FiShoppingCart, FiTruck, FiCreditCard } from 'react-icons/fi';
import SimpleLineChart from '../../components/SimpleLineChart/SimpleLineChart';
import FinancialInputsPanel from '../../components/FinancialInputsPanel/FinancialInputsPanel';

const ProductDetails = () => {
    const { id } = useParams();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30); // Default to 30 days history
    const [financialParams, setFinancialParams] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                // Formatear fechas locales YYYY-MM-DD
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - days);

                const formatDate = (d) => {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                const startStr = formatDate(start);
                const endStr = formatDate(end);

                const res = await getProductStats(id, startStr, endStr, null, financialParams);

                if (res && res.success && res.data) {
                    setProductData(res.data);
                } else {
                    setError('No se encontraron datos para este producto.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al obtener los detalles del producto.');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id, days, financialParams]);

    const handleApplyFinancialParams = (newParams) => {
        setFinancialParams(newParams);
    };

    // Prepare chart data using useMemo to avoid recalculating on every render
    const chartData = useMemo(() => {
        if (!productData || !productData.salesHistory) return { values: [], labels: [] };

        const history = productData.salesHistory;
        const values = history.map(item => item.quantity);
        const labels = history.map(item => item.date);

        return { values, labels };
    }, [productData]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loader}>Cargando estadísticas del producto...</div>
            </div>
        );
    }

    if (error || !productData) {
        return (
            <div className={styles.container}>
                <div className={styles.errorContainer}>
                    <h2>Error</h2>
                    <p>{error}</p>
                    <Link to="/" className={styles.backBtn}><FiArrowLeft /> Volver al Inicio</Link>
                </div>
            </div>
        );
    }

    const { salesInfo } = productData;
    const isTrendingPositive = (salesInfo?.trendGrowthPercentage || 0) >= 0;

    return (
        <main className={styles.container}>
            {/* Header & Navigation */}
            <header className={styles.header}>
                <Link to="/" className={styles.backBtn}>
                    <FiArrowLeft /> Inicio
                </Link>
                <div className={styles.periodFilter}>
                    <label>Periodo (Días):</label>
                    <select className={styles.selectInput} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                        <option value={7}>7 Días</option>
                        <option value={15}>15 Días</option>
                        <option value={30}>30 Días</option>
                    </select>
                </div>
            </header>

            {/* Componente de Inputs Financieros Variables */}
            <FinancialInputsPanel onApplyParams={handleApplyFinancialParams} />

            {/* Product Profile */}
            <section className={`${styles.profileSection} glass-panel`}>
                <div className={styles.productIdentity}>
                    <div className={styles.imageWrapper}>
                        <img src={productData.image || `https://via.placeholder.com/200/1e293b/FFFFFF?text=Product`} alt={productData.name} />
                    </div>
                    <div className={styles.productDetails}>
                        <div className={styles.badges}>
                            <span className={styles.badgeCountry}>{productData.country || 'Global'}</span>
                            <span className={styles.badgeId}>Dropi ID: {productData.dropiId}</span>
                            {salesInfo?.isBreakout && (
                                <span className={styles.breakoutBadge || ''} style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#f97316', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>🔥 Despegue</span>
                            )}
                        </div>
                        <h1 className={styles.productName}>{productData.name}</h1>

                        <div className={styles.priceRow} style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div className={styles.priceItem}>
                                <span className={styles.priceLabel}>Costo Producto Base</span>
                                <span className={styles.priceValue}>{productData.price}</span>
                            </div>

                            {/* Bloque Contra Entrega */}
                            <div className={styles.priceItem} style={{ borderLeft: '2px solid rgba(99, 102, 241, 0.4)', paddingLeft: '1rem' }}>
                                <span className={styles.priceLabel} style={{ color: '#818cf8', fontWeight: '600' }}>
                                    <FiTruck style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Sugerido Contra Entrega
                                </span>
                                <span className={styles.priceValue} style={{ fontSize: '1.4rem' }}>{productData.suggestedPriceCod}</span>

                                <div style={{ marginTop: '0.3rem' }}>
                                    <span className={styles.priceLabel}>Ganancia Real Limpia COD:</span>
                                    <span className={`${styles.priceValue} ${styles.textSuccess}`} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        {productData.unitProfitCod}
                                    </span>
                                </div>
                            </div>

                            {/* Bloque Pago Anticipado */}
                            <div className={styles.priceItem} style={{ borderLeft: '2px solid rgba(56, 189, 248, 0.4)', paddingLeft: '1rem' }}>
                                <span className={styles.priceLabel} style={{ color: '#38bdf8', fontWeight: '600' }}>
                                    <FiCreditCard style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Sugerido Pago Anticipado
                                </span>
                                <span className={styles.priceValue} style={{ fontSize: '1.4rem' }}>{productData.suggestedPricePrepaid}</span>
                                <div style={{ marginTop: '0.3rem' }}>
                                    <span className={styles.priceLabel}>Ganancia Neta Pago Anticipado:</span>
                                    <span className={`${styles.priceValue} ${styles.textSuccess}`} style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        {productData.unitProfitPrepaid}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* KPIs Grid */}
            <section className={styles.kpiGrid}>
                <div className={`${styles.kpiCard} glass-panel`}>
                    <div className={styles.kpiHeader}>
                        <FiShoppingCart className={styles.kpiIcon} />
                        <h3>Total Ventas</h3>
                    </div>
                    <div className={styles.kpiValue}>{salesInfo?.totalQuantitySold?.toLocaleString() || 0} <small>uds</small></div>
                </div>

                <div className={`${styles.kpiCard} glass-panel`}>
                    <div className={styles.kpiHeader}>
                        <FiDollarSign className={styles.kpiIcon} />
                        <h3>Ingresos Totales</h3>
                    </div>
                    <div className={styles.kpiValue}>{salesInfo?.totalRevenue || '$0'}</div>
                </div>

                <div className={`${styles.kpiCard} glass-panel`}>
                    <div className={styles.kpiHeader}>
                        <FiActivity className={styles.kpiIcon} />
                        <h3>Promedio Diario</h3>
                    </div>
                    <div className={styles.kpiValue}>{salesInfo?.salesAverage?.toFixed(1) || 0} <small>uds/día</small></div>
                </div>

                <div className={`${styles.kpiCard} glass-panel`}>
                    <div className={styles.kpiHeader}>
                        <FiTrendingUp className={styles.kpiIcon} style={{ color: isTrendingPositive ? '#10b981' : '#ef4444' }} />
                        <h3>Crecimiento Tendencia</h3>
                    </div>
                    <div className={`${styles.kpiValue} ${isTrendingPositive ? styles.textSuccess : styles.textDanger}`}>
                        {isTrendingPositive ? '+' : ''}{salesInfo?.trendGrowthPercentage || 0}%
                    </div>
                </div>
            </section>

            {/* Sales Chart */}
            <section className={`${styles.chartSection} glass-panel`}>
                <div className={styles.sectionHeader}>
                    <h2>Historial de Ventas ({days} Días)</h2>
                    <span className={styles.maxSalesBadge}>
                        Día Récord: {salesInfo?.maxDailySales || 0} uds.
                    </span>
                </div>

                {chartData.values.length > 0 ? (
                    <div className={styles.chartWrapper}>
                        {/* We use DualLineChart purely for its design here, only passing 1 dataset, 
                            or we can use SimpleLineChart. We will use SimpleLineChart for consistency with the area fill. */}
                        <SimpleLineChart
                            data={chartData.values}
                            labels={chartData.labels}
                            color="var(--accent-primary)"
                            height={300}
                        />
                    </div>
                ) : (
                    <div className={styles.emptyChart}>No hay historial de ventas en este periodo.</div>
                )}
            </section>
        </main>
    );
};

export default ProductDetails;
