import { useState } from 'react';
import { Link } from 'react-router-dom';
import { salesCount, card, containerImg, cardInformation, nameProduct, countryProduct, cardContainer } from './Card.module.css';
import { MessageNotWorking } from '../Message Not Working/Message Not Working';

const Card = ({ product }) => {
    const [imageIndex, setImageIndex] = useState(0);
    const [showImage, setShowImage] = useState(true); // New state to control image visibility

    const nextImage = () => {
        setImageIndex((prevIndex) => (prevIndex + 1) % product.image.length);
        if (imageIndex === product.image.length - 1) {
            setShowImage(false); // Hide image if at the end and triggers error again
        }
    };

    const convertirString = (inputString) => {
        const outputString = inputString.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        return outputString;
    };

    return (
        <div className={cardContainer} >
            <Link to={`/dashboard/product/${product.country}/${convertirString(product.name)}/${product.id}`} >
                <div className={card} >
                    <div className={salesCount}>
                        {product.unitsSold}
                    </div>
                    <div className={containerImg}>
                        <div>
                            {showImage && product.image.length > 0 ? (
                                <img
                                    loading="lazy"
                                    src={product.image[imageIndex]}
                                    alt={product.name}
                                    onError={nextImage} 
                                />
                                ) : (
                                    <MessageNotWorking message={'¡Ups! Parece que no tenemos fotos para mostrar.'} />
                                )}
                        </div>
                    </div>
                    <div className={cardInformation}>
                        <div className={countryProduct}>
                            <div>{product.country}</div>
                        </div>
                        <div className={nameProduct}>
                            {product.name.toLowerCase()}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export { Card };