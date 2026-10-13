import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    FiSearch, 
    FiX, 
    FiFilter, 
    FiPackage, 
    FiAlertCircle, 
    FiChevronLeft, 
    FiChevronRight, 
    FiEye 
} from 'react-icons/fi';
import { searchProducts } from '../../services/trendFinder';
import styles from './ProductSearch.module.css';

const SUPPORTED_COUNTRIES = [
    { value: '', label: 'Todos los países' },
    { value: 'Colombia', label: 'Colombia' },
    { value: 'Chile', label: 'Chile' },
    { value: 'México', label: 'México' },
    { value: 'Panamá', label: 'Panamá' },
    { value: 'Ecuador', label: 'Ecuador' },
    { value: 'Perú', label: 'Perú' },
    { value: 'España', label: 'España' }
];

const SORT_OPTIONS = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'oldest', label: 'Más antiguos' },
    { value: 'price_asc', label: 'Menor precio' },
    { value: 'price_desc', label: 'Mayor precio' },
    { value: 'name_asc', label: 'Nombre (A-Z)' },
    { value: 'name_desc', label: 'Nombre (Z-A)' }
];

const ProductSearch = ({ financialParams = null }) => {
    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [country, setCountry] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState([]);
    const [pagination, setPagination] = useState({
        totalMatches: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [errorMessage, setErrorMessage] = useState('');

    const resultsRef = useRef(null);

    const executeSearch = async (targetPage = 1, searchQuery = query, targetCountry = country, targetSort = sortBy) => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setErrorMessage('Ingresa al menos 2 caracteres para realizar la búsqueda.');
            return;
        }

        setErrorMessage('');
        setLoading(true);
        setHasSearched(true);
        setActiveQuery(trimmed);

        try {
            const response = await searchProducts(trimmed, {
                country: targetCountry || undefined,
                page: targetPage,
                limit: 12,
                sortBy: targetSort,
                financialParams
            });

            if (response && response.success) {
                setResults(response.data || []);
                setPagination(response.pagination || {
                    totalMatches: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                });
                setPage(targetPage);
            } else {
                setResults([]);
                setPagination({ totalMatches: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
                if (response && response.error) {
                    setErrorMessage(response.error);
                }
            }
        } catch (err) {
            console.error('Error executing product search:', err);
            setErrorMessage('Error al realizar la búsqueda. Por favor intenta de nuevo.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        executeSearch(1, query, country, sortBy);
    };

    const handleClear = () => {
        setQuery('');
        setErrorMessage('');
    };

    const handleCloseResults = () => {
        setHasSearched(false);
        setResults([]);
        setActiveQuery('');
        setErrorMessage('');
    };

    const handleCountryChange = (e) => {
        const newCountry = e.target.value;
        setCountry(newCountry);
        if (hasSearched && query.trim().length >= 2) {
            executeSearch(1, query, newCountry, sortBy);
        }
    };

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        setSortBy(newSort);
        if (hasSearched && query.trim().length >= 2) {
            executeSearch(1, query, country, newSort);
        }
    };

    const handlePageChange = (newPage) => {
        executeSearch(newPage, activeQuery, country, sortBy);
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <section className={styles.searchSection} aria-label="Buscador de productos">
            <div className={styles.searchHeader}>
                <FiSearch className={styles.icon} />
                <h2>Buscador de Productos</h2>
            </div>

            <div className={`${styles.searchCard} glass-panel`}>
                <form className={styles.form} role="search" onSubmit={handleSubmit}>
                    <div className={styles.inputRow}>
                        <div className={styles.inputWrapper}>
                            <FiSearch className={styles.searchIcon} aria-hidden="true" />
                            <input
                                type="search"
                                className={styles.input}
                                placeholder="Buscar por nombre (ej. cepillo, reloj, audífonos) o Dropi ID..."
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if (errorMessage) setErrorMessage('');
                                }}
                                aria-label="Término de búsqueda de producto"
                            />
                            {query && (
                                <button
                                    type="button"
                                    className={styles.clearBtn}
                                    onClick={handleClear}
                                    title="Limpiar texto"
                                    aria-label="Limpiar texto"
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className={styles.submitBtn}
                            disabled={loading || query.trim().length < 2}
                        >
                            <FiSearch />
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>

                    <div className={styles.filtersRow}>
                        <div className={styles.filterGroup}>
                            <label htmlFor="search-country-select" className={styles.filterLabel}>
                                <FiFilter /> País:
                            </label>
                            <select
                                id="search-country-select"
                                className={styles.select}
                                value={country}
                                onChange={handleCountryChange}
                            >
                                {SUPPORTED_COUNTRIES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label htmlFor="search-sort-select" className={styles.filterLabel}>
                                Ordenar:
                            </label>
                            <select
                                id="search-sort-select"
                                className={styles.select}
                                value={sortBy}
                                onChange={handleSortChange}
                            >
                                {SORT_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {errorMessage && (
                            <p className={styles.hintText} role="alert">
                                ⚠️ {errorMessage}
                            </p>
                        )}
                    </div>
                </form>
            </div>

            {/* Panel de Resultados */}
            {hasSearched && (
                <div ref={resultsRef} className={styles.resultsContainer}>
                    <div className={styles.resultsHeader}>
                        <div className={styles.resultsSummary}>
                            <FiPackage className={styles.icon} />
                            <h3>Resultados para &ldquo;{activeQuery}&rdquo;</h3>
                            <span className={styles.badgeMatches}>
                                {pagination.totalMatches} {pagination.totalMatches === 1 ? 'producto' : 'productos'}
                            </span>
                        </div>
                        <button 
                            type="button" 
                            className={styles.closeResultsBtn}
                            onClick={handleCloseResults}
                            title="Cerrar resultados de búsqueda"
                        >
                            <FiX /> Cerrar Resultados
                        </button>
                    </div>

                    {loading ? (
                        <div className={styles.loader}>Buscando coincidencias en el catálogo...</div>
                    ) : results.length > 0 ? (
                        <>
                            <div className={styles.grid}>
                                {results.map((product) => {
                                    const stockQty = product.stock || 0;
                                    const isOutOfStock = stockQty === 0;
                                    const isLowStock = stockQty > 0 && stockQty <= 50;

                                    return (
                                        <Link 
                                            to={`/product/${product.productId}`} 
                                            key={product.productId} 
                                            className={styles.productCard}
                                        >
                                            <div className={styles.cardImageWrapper}>
                                                <img 
                                                    src={product.image || 'https://via.placeholder.com/300/1e293b/FFFFFF?text=TrendFinder'} 
                                                    alt={product.name}
                                                    className={styles.cardImage}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className={styles.cardBody}>
                                                <h4 className={styles.cardTitle} title={product.name}>
                                                    {product.name}
                                                </h4>

                                                <div className={styles.cardTags}>
                                                    {product.country && (
                                                        <span className={styles.countryTag}>
                                                            📍 {product.country}
                                                        </span>
                                                    )}
                                                    <span className={`${styles.stockTag} ${
                                                        isOutOfStock ? styles.stockOut : isLowStock ? styles.stockLow : styles.stockGood
                                                    }`}>
                                                        {isOutOfStock ? 'Sin stock' : `Stock: ${stockQty}`}
                                                    </span>
                                                </div>

                                                <div className={styles.financialBlock}>
                                                    <div className={styles.financialRow}>
                                                        <span className={styles.financialLabel}>Costo:</span>
                                                        <span className={styles.financialVal}>{product.price}</span>
                                                    </div>
                                                    <div className={styles.financialRow}>
                                                        <span className={styles.financialLabel}>🚚 Sug. COD:</span>
                                                        <span className={styles.financialVal}>{product.suggestedPriceCod}</span>
                                                    </div>
                                                    <div className={styles.financialRow}>
                                                        <span className={styles.financialLabel}>Ganancia COD:</span>
                                                        <span className={styles.profitVal}>+{product.unitProfitCod}</span>
                                                    </div>
                                                    <div className={styles.financialRow}>
                                                        <span className={styles.financialLabel}>💳 Anticipado:</span>
                                                        <span className={styles.financialVal}>{product.suggestedPricePrepaid}</span>
                                                    </div>
                                                    <div className={styles.financialRow}>
                                                        <span className={styles.financialLabel}>Ganancia Ant.:</span>
                                                        <span className={styles.profitVal}>+{product.unitProfitPrepaid}</span>
                                                    </div>
                                                </div>

                                                <div className={styles.cardAction}>
                                                    <FiEye /> Ver Análisis y Métricas
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Paginación de Búsqueda */}
                            {pagination.totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        type="button"
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        aria-label="Página anterior"
                                    >
                                        <FiChevronLeft /> Anterior
                                    </button>
                                    <span className={styles.pageInfo}>
                                        Página {page} de {pagination.totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.pageBtn}
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={!pagination.hasNextPage}
                                        aria-label="Página siguiente"
                                    >
                                        Siguiente <FiChevronRight />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyCard}>
                            <FiAlertCircle className={styles.emptyIcon} />
                            <h4 className={styles.emptyTitle}>
                                No se encontraron productos coincidentes
                            </h4>
                            <p className={styles.emptySubtitle}>
                                No encontramos ningún producto para &ldquo;{activeQuery}&rdquo;{country ? ` en ${country}` : ''}. Intenta con términos más generales o seleccionando otro país.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ProductSearch;
