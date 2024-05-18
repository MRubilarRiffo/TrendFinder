import { useState } from 'react';
import { Link } from 'react-router-dom';
import { salesCount, card, containerImg, cardInformation, nameProduct, countryProduct } from './Card.module.css';
import img from '../../assets/loading/loading.svg';

const Card = ({ product }) => {
    const [imageIndex, setImageIndex] = useState(0);

    const nextImage = () => {
        setImageIndex((prevIndex) => (prevIndex + 1) % product.image.length);
    };

    const convertirString = (inputString) => {
        const outputString = inputString.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        return outputString;
    };

    return (
        <Link to={`/product/${product.country}/${convertirString(product.name)}/${product.id}`}>
            <div className={card} >
                <div className={salesCount}>
                    {product.unitsSold}
                </div>
                <div className={containerImg}>
                    <div>
                        <img
                            loading="lazy"
                            src={product.image[imageIndex] }
                            alt={product.name}
                            onError={nextImage}
                        />
                    </div>
                </div>
                <div className={cardInformation}>
                    <div className={countryProduct}>
                        <Link to='/'>{product.country}</Link>
                    </div>
                    <div className={nameProduct}>
                        {product.name.toLowerCase()}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export { Card };