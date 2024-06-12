import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from "react-icons/io";
import { headerContainer, searchContainer, iconSearch, iconClose, info, avatar, menu } from './Header.module.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FILTERS, USER_SESSION } from '../../redux/actions-type';
import { jwtDecode } from "jwt-decode";
import { RiUser6Line } from "react-icons/ri";

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { name } = useSelector((state) => state.filters);
    const { token } = useSelector((state) => state.user);

    const [userInfo, setUserInfo] = useState({ name: '', lastName: '' });
    const [searchTerm, setSearchTerm] = useState(name);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        if (token) {
            const { name, lastName } = jwtDecode(token);
            setUserInfo({ name, lastName });
        };
    }, [token]);

    useEffect(() => {
        setSearchTerm(name);
    }, [name]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        dispatch({ type: FILTERS, payload: { name: searchTerm, page: 1 } });
        navigate('/dashboard/products');
    };

    const handleSearchClose = () => {
        dispatch({ type: FILTERS, payload: { name: '', page: 1 } });
        setSearchTerm('');
    };

    const handleMenuVisible = () => {
        setMenuVisible(!menuVisible);
    };

    const handleCloseSesion = () => {
        dispatch({
            type: USER_SESSION,
            payload: {
                status: null,
                message: '',
                name: '',
                email: '',
                token: ''
            }
        });
        // navigate('/login');
    };


    const menuList = [
        { name: 'Mi perfil', function: handleMenuVisible },
        { name: 'Cerrar sesión', function: handleCloseSesion }
    ];


    return (
        <div className={headerContainer}>
            <form className={searchContainer} onSubmit={handleSearchSubmit}>
                <input
                    type='text'
                    placeholder='Buscar productos'
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <FaSearch className={iconSearch}/>
                {searchTerm.length > 0 && <IoMdCloseCircle className={iconClose} onClick={handleSearchClose}/>}
            </form>
            <div className={info} onClick={handleMenuVisible}>
                <div className={avatar}>
                    <RiUser6Line/>
                </div>
                <p>{`${userInfo.name} ${userInfo.lastName}`}</p>
                {menuVisible &&
                <div className={menu}>
                    {menuList.map((item, index) => {
                        return (
                            <p key={index} onClick={item.function}>{item.name}</p>
                        );
                    })}
                </div>
                }
            </div>
        </div>
    );
};

export { Header };