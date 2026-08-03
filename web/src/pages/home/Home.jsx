import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLatestProducts, getTrendingProducts } from '../../services/trendFinder';
import { FiTrendingUp, FiClock, FiArrowRight, FiEye } from 'react-icons/fi';
import SimpleLineChart from '../../components/SimpleLineChart/SimpleLineChart';
import styles from './Home.module.css';

const Home = () => {
    const [latestProducts, setLatestProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);

    // UI states
    const [loadingLatest, setLoadingLatest] = useState(true);
    const [loadingTrending, setLoadingTrending] = useState(true);

    // Filter & Pagination states
    const [days, setDays] = useState(7);
    const [sortBy, setSortBy] = useState('profit');
    const [cursor, setCursor] = useState(null);
    const [pagination, setPagination] = useState({ prevCursor: null, nextCursor: null });

    // Fetch Latest once
    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const latestData = await getLatestProducts();
                if (latestData && Array.isArray(latestData.data)) {
                    setLatestProducts(latestData.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingLatest(false);
            }
        };
        fetchLatest();
    }, []);

    // Fetch Trending when dependencies change
    useEffect(() => {
        const fetchTrending = async () => {
            setLoadingTrending(true);
            try {
                const trendingData = await getTrendingProducts(days, null, sortBy, cursor);
                if (trendingData) {
                    setTrendingProducts(trendingData.data || []);
                    setPagination(trendingData.pagination || { prevCursor: null, nextCursor: null });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingTrending(false);
            }
        };
        fetchTrending();
    }, [days, sortBy, cursor]);

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setCursor(null); // Reset pagination on new filter
    };

    const handleDaysChange = (e) => {
        setDays(Number(e.target.value));
        setCursor(null); // Reset pagination on new filter
    };

    const handleNextPage = () => {
        if (pagination.nextCursor) setCursor(pagination.nextCursor);
    };

    const handlePrevPage = () => {
        if (pagination.prevCursor) setCursor(pagination.prevCursor);
        // If we want to go back to page 1 and the API logic requires dropping the cursor, we handle it if prevCursor is valid
    };

    return (
        <main className={styles.container}>
            <header className={styles.hero}>
                <h1 className="text-gradient">TrendFinder Dashboard</h1>
                <p className={styles.subtitle}>Descubre los productos con mejor rendimiento en tiempo real.</p>
            </header>

            {/* Latest Products Carousel */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <FiClock className={styles.icon} />
                    <h2>Últimos Productos</h2>
                </div>

                {loadingLatest ? (
                    <div className={styles.loader}>Cargando últimos productos...</div>
                ) : (
                    <div className={styles.carouselContainer}>
                        <div className={styles.carouselTrack}>
                            {latestProducts.map((product, idx) => (
                                <Link to={`/product/${product.productId}`} key={product.productId || idx} className={`${styles.card} glass-panel`} style={{ textDecoration: 'none' }}>
                                    <div className={styles.cardImagePlaceholder}>
                                        <img src={product.image || `https://via.placeholder.com/200/1e293b/FFFFFF?text=Product+${idx}`} alt={product.name || 'Product'} />
                                    </div>
                                    <div className={styles.cardContent}>
                                        <div className={styles.cardHeader}>
                                            <h3 className={styles.cardTitle}>{product.name || 'Producto Sin Nombre'}</h3>
                                            {product.country && <span className={styles.cardCountry}>{product.country}</span>}
                                        </div>
                                        <div className={styles.cardFooter}>
                                            <p className={styles.cardPrice}>{product.price?.toLocaleString() || '0.00'}</p>
                                            {product.stock > 0 && <span className={styles.cardStock}>Stock: {product.stock}</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {latestProducts.length === 0 && <p className={styles.emptyText}>No hay productos recientes.</p>}
                        </div>
                    </div>
                )}
            </section>

            {/* Trending Products Table */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <FiTrendingUp className={styles.icon} />
                    <h2>Productos en Tendencia</h2>
                    <div className={styles.controlsRow}>
                        <select className={styles.selectInput} value={days} onChange={handleDaysChange}>
                            <option value={1}>Último Día</option>
                            <option value={7}>Últimos 7 Días</option>
                            <option value={30}>Últimos 30 Días</option>
                        </select>
                        <select className={styles.selectInput} value={sortBy} onChange={handleSortChange}>
                            <option value="profit">Ordenar por: Ganancia</option>
                            <option value="sales">Ordenar por: Ventas</option>
                            <option value="revenue">Ordenar por: Ingresos</option>
                            <option value="performance">Ordenar por: Rendimiento</option>
                            <option value="trend">Ordenar por: Tendencia</option>
                        </select>
                    </div>
                </div>

                {loadingTrending ? (
                    <div className={styles.loader}>Cargando tendencias...</div>
                ) : (
                    <>
                        <div className={`${styles.tableWrapper} glass-panel`}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Precio & Margen</th>
                                        <th>Métricas de Venta</th>
                                        <th>Tendencia</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trendingProducts.map((product, idx) => (
                                        <tr key={product.productId || idx}>
                                            <td className={styles.productCell}>
                                                <div className={styles.productInfo}>
                                                    <img className={styles.tableThumb} src={product.image || `https://via.placeholder.com/60/1e293b/FFFFFF?text=P`} alt={product.name || 'Producto'} />
                                                    <div className={styles.productText}>
                                                        <span className={styles.productTitle}>{product.name || `Producto ${idx + 1}`}</span>
                                                        <span className={styles.productSubtitle}>País: {product.country || 'N/A'}</span>
                                                        <span className={styles.productMeta}>Actualizado: {product.calculatedAt ? new Date(product.calculatedAt).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.priceCell}>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Precio Venta:</span>
                                                    <span className={styles.metricValue}>{product.price?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Sugerido:</span>
                                                    <span className={styles.metricValue}>{product.suggestedPrice?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Ganancia:</span>
                                                    <span className={`${styles.metricValue} ${styles.textSuccess}`}>{product.unitProfit?.toLocaleString() || 0}</span>
                                                </div>
                                            </td>
                                            <td className={styles.salesCell}>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Ventas:</span>
                                                    <span className={styles.salesBadge}>{product.totalQuantitySold?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Ingresos:</span>
                                                    <span className={styles.metricValue}>{product.totalRevenue?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Ganancia Total:</span>
                                                    <span className={`${styles.metricValue} ${styles.textSuccess}`}>{product.totalProfit?.toLocaleString() || 0}</span>
                                                </div>
                                            </td>
                                            <td className={styles.trendCell}>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Crecimiento:</span>
                                                    <span className={`${styles.metricValue} ${(product.trendGrowth || 0) >= 0 ? styles.textSuccess : styles.textDanger}`}>
                                                        {(product.trendGrowth || 0) > 0 ? '+' : ''}{(product.trendGrowth || 0).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className={styles.metricGroup}>
                                                    <span className={styles.metricLabel}>Rendimiento:</span>
                                                    <span className={styles.metricValue}>{(product.performanceRate || 0).toFixed(2)}%</span>
                                                </div>
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <SimpleLineChart
                                                        data={[(product.totalQuantitySold || 10) * 0.5, (product.totalQuantitySold || 10) * 0.8, product.totalQuantitySold || 10]}
                                                        color={(product.trendGrowth || 0) >= 0 ? "var(--accent-primary)" : "#ef4444"}
                                                        height={40}
                                                    />
                                                </div>
                                            </td>
                                            <td className={styles.actionCell}>
                                                {product.productId ? (
                                                    <Link to={`/product/${product.productId}`} className={styles.actionBtn} title="Ver Detalles">
                                                        <FiEye />
                                                    </Link>
                                                ) : (
                                                    <a href={product.url} target="_blank" rel="noopener noreferrer" className={styles.actionBtn} title="Ver en Dropi">
                                                        <FiArrowRight />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {trendingProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className={styles.emptyText}>No hay productos en tendencia actualmente.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className={styles.paginationContainer}>
                            <button
                                className={styles.pageBtn}
                                onClick={handlePrevPage}
                                disabled={!pagination.prevCursor && cursor === null}
                            >
                                Anterior
                            </button>
                            <button
                                className={styles.pageBtn}
                                onClick={handleNextPage}
                                disabled={!pagination.nextCursor}
                            >
                                Siguiente
                            </button>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
};

export default Home;
