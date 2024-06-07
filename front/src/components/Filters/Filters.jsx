import { useEffect, useState } from 'react';
import config from '../../config/config';
import { nameCountries, active, container } from './Filters.module.css'; // Use 'styles' for better readability
import { useDispatch, useSelector } from 'react-redux';
import { FILTERS } from '../../redux/actions-type';

const Filters = () => {
    const countriesList = config.countries;

    const dispatch = useDispatch();

    const activeCountryFilters = useSelector(state => state.filters.countries);

    const handleClick = (countryName) => {
        const updatedFilters = new Set(activeCountryFilters); // Trabajamos directamente sobre el estado de Redux
    
        if (updatedFilters.has(countryName)) {
            updatedFilters.delete(countryName);
        } else {
            updatedFilters.add(countryName);
        };
    
        dispatch({ type: FILTERS, payload: { countries: [...updatedFilters], page: 1 } });
    };

    return (
        <div className={container}>
        <div>
            <p>Filtros</p>
            <p>Limpiar</p> 
        </div>
        <hr />
        <div>
            <div>
                <p>Países</p>
            </div>
            <div> 
                {countriesList.map(country => (
                    <div 
                        key={country.name} 
                        onClick={() => handleClick(country.name)} 
                        className={nameCountries}
                    >
                        <h5 className={activeCountryFilters.find(item => item === country.name) ? active : ''}>{country.name}</h5>
                    </div>
                ))}
            </div>
        </div>
        <hr />
        </div>
    );
};

export { Filters };