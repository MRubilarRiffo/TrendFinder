import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getDetails } from "../../redux/actions";
import { RESET_DETAILS } from "../../redux/actions-type";
import { Chart } from "../../components/Chart/Chart";
import { LeftColumn } from "./Left Column/Left Column";
import { productPageContainer, rightColumnProductDetails } from "./Product Details.module.css";

const ProductDetails = () => {
    const { country, id } = useParams();
    const dispatch = useDispatch();

    const product = useSelector(state => state.details);

    useEffect(() => {
        dispatch(getDetails(id, country));
        return () => {
            dispatch({ type: RESET_DETAILS });
        };
    }, [country, id]);

    if (Object.keys(product).length === 0) {
        return <h3>Cargando...</h3>;
    };

    return (
        <div className={productPageContainer}>
            <LeftColumn imageArray={product.image}/>

            
            <div className={rightColumnProductDetails}>
                <h3>{product.name}</h3>
                <div>
                    <Chart data={product.Sales}/>
                </div>
            </div>
        </div>
    );
};

export { ProductDetails };