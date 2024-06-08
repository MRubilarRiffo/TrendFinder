import { useDispatch, useSelector } from 'react-redux';
import { container, cardContainer, filter, content, cardsAndPagination } from './Products.module.css';
import { useEffect } from 'react';
import { getLeakedProducts } from '../../redux/actions';
import { Card } from '../../components/Card/Card';
import { Loader } from '../../components/Loader/Loader';
import { Pagination } from '../../components/Pagination/Pagination';
import { RESET_LEAKED_PRODUCTS } from '../../redux/actions-type';
import { Filters } from '../../components/Filters/Filters';
import { MessageNotWorking } from '../../components/Message Not Working/Message Not Working';

const Products = () => {
    const dispatch = useDispatch();

    const data = useSelector((state) => state.leakedProducts);
    const filters = useSelector((state) => state.filters);

    const { name, sortOrder, page, limit, countries, categories } = filters;

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
    }, [name, limit, sortOrder, page, countries, categories]);

    return (
        <div className={container}>
            <div className={filter}>
                <Filters />
            </div>
            <div className={content}>
                {data.length === 0 ? (
                    <Loader />
                ) : totalPages === 0 ? (
                    <MessageNotWorking message={'No hay productos para mostrar'}/>
                ) : (
                    <div className={cardsAndPagination}>
                        <div className={cardContainer}>
                            {products.map(product => (
                                <Card product={product} key={product.id} />
                            ))}
                        </div>
                        <div>
                            <Pagination totalPages={totalPages} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export { Products };