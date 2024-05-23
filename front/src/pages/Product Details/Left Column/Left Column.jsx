import { useState, useEffect } from 'react';
import { MdOutlineNavigateBefore, MdOutlineNavigateNext } from 'react-icons/md';
import {
    productImgContainer,
    leftColumnProductDetails,
    imgThumbnailContainer,
    imgThumbnail,
    leftNavButtonContainer,
    rightNavButtonContainer
} from './Left Column.module.css';

const LeftColumn = ({ imageArray = [] }) => {
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        setImages(imageArray);
    }, [imageArray]);

    const thumbnailDisplayCount = 4;

    const handleNextImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const handleThumbnailClick = (index) => {
        setCurrentImageIndex(index);
    };

    const handleImageError = (index) => {
        setImages(images.filter((_, i) => i !== index));
        setCurrentImageIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    const calculateThumbnailStartIndex = () => {
        return Math.min(Math.max(currentImageIndex - Math.floor(thumbnailDisplayCount / 2), 0), Math.max(images.length - thumbnailDisplayCount, 0));
    };

    const thumbnailStartIndex = calculateThumbnailStartIndex();
    const visibleThumbnails = images.slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailDisplayCount);

    if (images.length === 0) {
        return <h3>Cargando...</h3>;
    }

    return (
        <div className={leftColumnProductDetails}>
            <div className={productImgContainer}>
                <div>
                    <img
                        src={images[currentImageIndex]}
                        alt=""
                        onError={() => handleImageError(currentImageIndex)}
                        loading="lazy"
                    />
                </div>
                <div className={leftNavButtonContainer}>
                    <MdOutlineNavigateBefore onClick={handlePrevImage} />
                </div>
                <div className={rightNavButtonContainer}>
                    <MdOutlineNavigateNext onClick={handleNextImage} />
                </div>
            </div>
            <div className={imgThumbnailContainer}>
                {visibleThumbnails.map((img, index) => (
                <div key={thumbnailStartIndex + index}>
                    <img
                    src={img}
                    alt=""
                    className={imgThumbnail}
                    onClick={() => handleThumbnailClick(thumbnailStartIndex + index)}
                    loading="lazy"
                    onError={() => handleImageError(thumbnailStartIndex + index)}
                    />
                </div>
                ))}
            </div>
        </div>
    );
};

export { LeftColumn };