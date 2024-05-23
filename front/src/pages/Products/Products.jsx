import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProductsRandomByCountry } from '../../redux/actions';
import { Card } from '../../components/Card/Card';
import { containerCard } from './Products.module.css';

const Products = () => {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getProductsRandomByCountry('Chile'));
    }, [])
    
    const products = useSelector(state => state.productsByCountry);

    const countryChile = products.find(item => item.country === 'Chile' ) || {};
    const countryColombia = products.find(item => item.country === 'Colombia' ) || {};


    const productsChile = countryChile.products || [];
    const productsColombia = countryColombia.products || [];
        
    if (productsChile.length === 0) {
        return <h3>Cargando...</h3>;
    };

    const bestSellersHome = [
        { title: 'Lo Más Vendido En Chile', products: productsChile },
        { title: 'Lo Más Vendido En Colombia', products: productsColombia }
    ];

    return (
        <div>
            {bestSellersHome.map(({ title, products }, index) => 
                <div key={`${index}-${title}`}>
                    <h3>{title}</h3>
                    <div className={containerCard}>
                        {products.map(product => 
                            <Card
                                key={`product-${product.id}`}
                                product={product}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export { Products };