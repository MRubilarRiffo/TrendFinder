import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProductsByCountry } from '../../redux/actions';
import { containerCard } from './Home Dashboard.module.css';
import { SlideProducts } from '../../components/Slide Products/Slide Products';

const HomeDashboard = () => {
    const countries = [
        { name: 'Chile', active: true },
        { name: 'Colombia', active: true },
        { name: 'México', active: true },
        { name: 'Panamá', active: true },
        { name: 'Ecuador', active: true },
        { name: 'Perú', active: true },
        { name: 'España', active: true }
    ];

    const countriesActive = countries.filter(item => item.active);

    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(getProductsByCountry(countriesActive));
    }, [])
    
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