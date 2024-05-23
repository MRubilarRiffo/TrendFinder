import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { IoMdCloseCircle } from "react-icons/io";
import { headerContainer, searchContainer, iconSearch, iconClose } from './Header.module.css';

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        // Realizar alguna acción con el término de búsqueda
        console.log('Buscando productos para:', searchTerm);
    };

    const handleSearchClose = () => {
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