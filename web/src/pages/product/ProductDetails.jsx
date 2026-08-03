import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductStats } from '../../services/trendFinder';
import { FiArrowLeft, FiTrendingUp, FiBox, FiDollarSign, FiActivity, FiShoppingCart } from 'react-icons/fi';
import SimpleLineChart from '../../components/SimpleLineChart/SimpleLineChart';
import DualLineChart from '../../components/DualLineChart/DualLineChart';
import styles from './ProductDetails.module.css';

const ProductDetails = () => {
    const { id } = useParams();
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30); // Default to 30 days history

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                // Calculate date range for the request based on days
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - days);
                
                const startStr = start.toISOString().split('T')[0];
                const endStr = end.toISOString().split('T')[0];
                
                const res = await getProductStats(id, startStr, endStr, null);
                
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
    }, [id, days]);

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
                        </div>
                        <h1 className={styles.productName}>{productData.name}</h1>
                        <div className={styles.priceRow}>
                            <div className={styles.priceItem}>
                                <span className={styles.priceLabel}>Precio de Venta</span>
                                <span className={styles.priceValue}>{productData.price}</span>
                            </div>
                            <div className={styles.priceItem}>
                                <span className={styles.priceLabel}>Precio Sugerido</span>
                                <span className={styles.priceValue}>{productData.suggestedPrice}</span>
                            </div>
                            <div className={styles.priceItem}>
                                <span className={styles.priceLabel}>Ganancia Est.</span>
                                <span className={`${styles.priceValue} ${styles.textSuccess}`}>
                                    {(() => {
                                        // The API returns pre-formatted string (e.g. "$9.000")
                                        // We parse it back to a number to calculate the profit difference
                                        const parsePrice = (p) => {
                                            if (!p) return 0;
                                            if (typeof p === 'number') return p;
                                            const num = Number(p.replace(/[^0-9,-]+/g, '').replace(',', '.'));
                                            return isNaN(num) ? 0 : num;
                                        };
                                        const pPrice = parsePrice(productData.price);
                                        const pSugg = parsePrice(productData.suggestedPrice);
                                        const profit = pSugg - pPrice;
                                        // Simple formatting to add a + and avoid NaN
                                        return profit > 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString();
                                    })()}
                                </span>
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
