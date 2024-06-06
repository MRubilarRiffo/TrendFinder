import { Logo } from '../../components/Logo/Logo';
import { Routes, Route, Link } from 'react-router-dom';
import { HomeDashboard } from '../Home Dashboard/Home Dashboard';
import { ProductDetails } from '../Product Details/Product Details';
import { Header } from '../../components/Header/Header';
import { Products } from '../Products/Products';
import { DashboardContainer,
    leftColumnContainer,
    rightColumnContainer,
    rightColumnContent,
    rigthColumnPosition
} from './Dashboard.module.css';
import Footer from '../../components/Footer/Footer';

const Dashboard = () => {
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
                <div className={rigthColumnPosition}>
                    <Header />
                    <div className={rightColumnContent}>
                        <Routes>
                            {route.length > 0 &&
                                route.map(({ path, element }) => (
                                    <Route path={path} element={element} key={path} />
                                ))
                            }
                        </Routes>
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    );
};

export { Dashboard };