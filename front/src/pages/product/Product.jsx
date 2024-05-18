import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getDetails } from "../../redux/actions";
import { RESET_DETAILS } from "../../redux/actions-type";
import { Chart } from "../../components/chart/Chart";

const Product = () => {
    const { country, id } = useParams();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getDetails(id, country));
        return () => {
            dispatch({ type: RESET_DETAILS });
        };
    }, [country, id]);

    const product = useSelector(state => state.details);
    console.log(product);

    if (Object.keys(product).length === 0) {
        return <h3>Cargando...</h3>;
    };

    return (
        <div>
            <Chart data={product.Sales}/>
        </div>
    );
};

export { Product };