import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { getDetails } from "../../redux/actions";
import { RESET_DETAILS } from "../../redux/actions-type";
import { Chart } from "../../components/Chart/Chart";
import { LeftColumn } from "./Left Column/Left Column";
import { productPageContainer, rightColumnProductDetails, dataContainer, iconContainer, tittleContainer, dropiRedirectButtonContainer } from "./Product Details.module.css";
import { RiMoneyDollarCircleFill, RiFileCopy2Fill, RiStackFill, RiInboxArchiveFill } from "react-icons/ri";
import formatPrice from "../../functions/formatPrice";

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

    const infoProduct = [
        { title: "País", value: product.country, icon: <RiMoneyDollarCircleFill /> },
        { title: "Precio", value: formatPrice(product.sale_price, product.country), icon: <RiMoneyDollarCircleFill /> },
        { title: "Precio Sugerido", value: 'Pendiente', icon: <RiMoneyDollarCircleFill /> },
        { title: "% Margen Bruto", value: 'Pendiente', icon: <RiMoneyDollarCircleFill /> },
        { title: "No. de Ventas", value: product.CountSale.totalSales, icon: <RiFileCopy2Fill /> },
        { title: "Stock Disponible", value: product.Stock.quantity, icon: <RiStackFill /> },
        { title: "Ventas Totales", value: formatPrice(product.CountSale.totalSales * product.sale_price, product.country), icon: <RiInboxArchiveFill /> }
    ];

    console.log(product.url);

    const handleClick = () => {
        navigate(product.url, {
            target: '_blank',
            rel: 'noopener noreferrer'
        });
    };

    return (
        <div className={productPageContainer}>
            <LeftColumn imageArray={product.image}/>

            
            <div className={rightColumnProductDetails}>
                <h3>{product.name}</h3>
                <div className={dataContainer}>
                    {infoProduct.map((item, index) => {
                        return (
                            <div key={index}>
                                <div className={iconContainer}>
                                    {item.icon}
                                </div>
                                <div className={tittleContainer}>
                                    <p>{item.title}:</p>
                                    {item.value}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div>
                    <Chart data={product.Sales}/>
                </div>
                <div className={dropiRedirectButtonContainer}>
                    <Link to={product.url} target="_blank" rel="noopener noreferrer">
                        Ver en Dropi
                    </Link>
                </div>
            </div>
        </div>
    );
};

export { ProductDetails };