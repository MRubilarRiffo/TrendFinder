import { useEffect, useState, useRef } from "react";
import { Card } from "../Card/Card";
import { cardsContainer, slideContainer, buttonContainer } from "./Slide Products.module.css";
import { ButtonNext } from "../Button Next/Button Next";
import useResponsiveValue from "../../hooks/useResponsiveValue";

const SlideProducts = ({ products = [] }) => {
    const [activeProducts, setActiveProducts] = useState([]);
    const [endIndex, setEndIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const numProductsView = useResponsiveValue(3, 4, 6);

    const parentRef = useRef(null);
    const lastItemRef = useRef(null);
    
    const handleNext = () => {
    };

    const handlePrev = () => {
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && endIndex + 1 < products.length) {
                    setActiveProducts(prev => [...prev, products[endIndex + 1]]);
                    setEndIndex(prev => prev + 1);
                }
            },
            { threshold: 0.5, root: parentRef.current }
        );

        if (lastItemRef.current) observer.observe(lastItemRef.current);
        return () => observer.disconnect(); // Limpieza al desmontar
    }, [endIndex, products.length]);

    useEffect(() => {
        const productsView = products.slice(0, numProductsView);

        setActiveProducts(productsView);
        setEndIndex(productsView.length - 1);
        
        return () => {
            setActiveProducts([]);
            setEndIndex(0);
        };
    }, [products, numProductsView]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        e.preventDefault();
        setStartX(e.pageX - parentRef.current.offsetLeft);
        setScrollLeft(parentRef.current.scrollLeft);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const x = e.pageX - parentRef.current.offsetLeft;
        const walk = (x - startX) * 1; // Controla la velocidad del arrastre
        parentRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className={slideContainer}>
            <div className={buttonContainer}>
                <ButtonNext onClick={handlePrev} />
            </div>
            <div className={cardsContainer}>
                <div
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    ref={parentRef}
                >
                    {activeProducts.map((product, index) => (
                        <div 
                            key={product.id}
                            ref={index === activeProducts.length - 1 ? lastItemRef : null}
                        >
                            <Card product={product} />
                        </div>
                    ))}
                </div>
            </div>
            <div className={buttonContainer}>
                <ButtonNext onClick={handleNext} condition={true} />
            </div>
        </div>
    );
};

export { SlideProducts };