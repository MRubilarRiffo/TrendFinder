import { useDispatch, useSelector } from 'react-redux';
import { container, cardContainer } from './Products.module.css';
import { useEffect } from 'react';
import { getLeakedProducts } from '../../redux/actions';
import { Card } from '../../components/Card/Card';
import { Loader } from '../../components/Loader/Loader';
import { Pagination } from '../../components/Pagination/Pagination';
import { FILTERS, RESET_LEAKED_PRODUCTS } from '../../redux/actions-type';
import { Filters } from '../../components/Filters/Filters';

const Products = () => {
    const dispatch = useDispatch();

    const data = useSelector((state) => state.leakedProducts);
    const filters = useSelector((state) => state.filters);

    const { name, sortOrder, page, limit, countries } = filters;

    const products = data.Data || [];
    const metaData = data.Metadata || {};

    const totalPages = metaData['Total Pages'];

    useEffect(() => {
        window.scrollTo(0, 0);

        if (limit !== 0) {
            dispatch(getLeakedProducts(filters));
        };

        return () => {
            dispatch({ type: RESET_LEAKED_PRODUCTS });
        };
    }, [name, limit, sortOrder, page, countries]);

    if (data.length === 0) {
        return <Loader />;
    };
    
    console.log(filters);

    return (
        <div className={container}>
            <div>
                <Filters />
            </div>
            {totalPages === 0
                ? <h3>No hay productos para mostrar</h3>
                : <div>
                    <div className={cardContainer}>
                        {products.map(product => (
                            <Card product={product} key={product.id} />
                        ))}
                    </div>
                    <div>
                        <Pagination totalPages={totalPages} />
                    </div>
                </div>
            }
        </div>
    );
};

export { Products };
