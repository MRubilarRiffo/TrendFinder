import { useDispatch, useSelector } from 'react-redux';
import { container, cardContainer } from './Products.module.css';
import { useEffect, useState } from 'react';
import { getLeakedProducts } from '../../redux/actions';
import { Card } from '../../components/Card/Card';
import useResponsiveValue from '../../hooks/useResponsiveValue';
import { useLocation } from 'react-router-dom';
import { Loader } from '../../components/Loader/Loader';
import { Pagination } from '../../components/Pagination/Pagination';
import { RESET_LEAKED_PRODUCTS } from '../../redux/actions-type';

const Products = () => {
    const limit = useResponsiveValue(10, 15, 25);

    const [currentPage, setCurrentPage] = useState(1);

    const dispatch = useDispatch();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const name = queryParams.get('name') || '';

    const sortOrder = 'id,asc';

    const page = currentPage;

    const queryOptions = {
        name,
        limit,
        sortOrder,
        page
    };

    const data = useSelector((state) => state.leakedProducts);

    const products = data.Data || [];
    const metaData = data.Metadata || {};

    const totalPages = metaData['Total Pages'];

    useEffect(() => {
        window.scrollTo(0, 0);
        dispatch(getLeakedProducts(queryOptions));
        return () => {
            dispatch({ type: RESET_LEAKED_PRODUCTS });
        };
    }, [name, limit, sortOrder, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [name, limit, sortOrder]);


    if (data.length === 0) {
        return <Loader />;
    };
    
    return (
        <div className={container}>
            <div>
                <h3>Filtros</h3>
            </div>
            <div className={cardContainer}>
                {products.map(product => (
                    <Card product={product} key={product.id} />
                ))}
            </div>
            <div>
                <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
        </div>
    );
};

export { Products };
