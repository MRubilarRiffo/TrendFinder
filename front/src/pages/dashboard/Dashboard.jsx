import { Logo } from '../../components/Logo/Logo';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { HomeDashboard } from '../Home Dashboard/Home Dashboard';
import { ProductDetails } from '../Product Details/Product Details';
import { Header } from '../../components/Header/Header';
import { Products } from '../Products/Products';
import { DashboardContainer,
    leftColumnContainer,
    rightColumnContainer,
    rightColumnContent,
} from './Dashboard.module.css';
import Footer from '../../components/Footer/Footer';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { status } = useSelector((state) => state.user);

    useEffect(() => {
        if ( !status || status !== "success") {
            navigate('/');
        };
    }, [status]);

    const menu = [
        { title: 'Home', link: '/dashboard' },
        { title: 'Productos', link: 'products' },
        { title: 'Favoritos', link: 'favorites' },
    ];

    const route = [
        { path: '/', element: <HomeDashboard /> },
        { path: '/product/:country/:name/:id', element: <ProductDetails /> },
        { path: '/products', element: <Products /> },
    ];

    return (
        <div className={DashboardContainer}>
            <div className={leftColumnContainer}>
                <Logo />
                {menu.map(({ title, link }) => (
                    <Link to={link} key={title} >
                        <h3>{title}</h3>
                    </Link>
                ))}
            </div>
            <div className={rightColumnContainer}>
                <Header />
                <div className={rightColumnContent}>
                    <Routes>
                        {route.length > 0 &&
                            route.map(({ path, element }) => (
                                <Route path={path} element={element} key={path} />
                            ))
                        }
                    </Routes>
                </div>
                <Footer />
            </div>
        </div>
    );
};

export { Dashboard };