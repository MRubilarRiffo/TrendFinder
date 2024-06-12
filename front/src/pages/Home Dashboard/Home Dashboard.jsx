import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProductsByCountry } from '../../redux/actions';
import { SlideProducts } from '../../components/Slide Products/Slide Products';
import config from '../../config/config';

const HomeDashboard = () => {
    const countries = config.countries;

    const { token } = useSelector(state => state.user);

    const countriesActive = countries.filter(item => item.active);

    const dispatch = useDispatch();

    useEffect(() => {
        if (token) {
            dispatch(getProductsByCountry(countriesActive, token));
        }
    }, [token])
    
    const products = useSelector(state => state.productsByCountry);
        
    if (products.length === 0) {
        return <h3>Cargando...</h3>;
    };

    return (
        <div>
            {products.map(({ country, products }, index) => 
                <div key={`${index}-${country}`}>
                    <h3>{`Lo Más Vendido En ${country}`}</h3>
                    <SlideProducts products={products} />
                </div>
            )}
        </div>
    );
};

export { HomeDashboard };