import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from "react-icons/io";
import { headerContainer, searchContainer, iconSearch, iconClose } from './Header.module.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FILTERS } from '../../redux/actions-type';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { name } = useSelector((state) => state.filters);

    const [searchTerm, setSearchTerm] = useState(name);

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
        </div>
    );
};

export { Header };