import { DashboardContainer, leftColumnContainer, rightColumnContainer, rightColumnContent, rigthColumnPosition } from './Dashboard.module.css';
import { Logo } from '../../components/Logo/Logo';
import { Routes, Route, Link } from 'react-router-dom';
import { Products } from '../Products/Products';
import { ProductDetails } from '../Product Details/Product Details';
import { Header } from '../../components/Header/Header';

const Dashboard = () => {
    const menu = [
        { title: 'Productos', link: '/dashboard/products/' },
        { title: 'Favoritos', link: '/favorites' },
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
                            <Route path="products" element={<Products />} />
                            <Route path="product/:country/:name/:id" element={<ProductDetails />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </div>
    );
};

export { Dashboard };