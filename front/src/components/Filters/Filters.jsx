import config from '../../config/config';
import { nameCountries, active, container, separator } from './Filters.module.css'; // Use 'styles' for better readability
import { useDispatch, useSelector } from 'react-redux';
import { FILTERS } from '../../redux/actions-type';

const Filters = () => {
    const countriesList = config.countries;
    const categoriesList = config.categories;

    const dispatch = useDispatch();

    const activeFilters = useSelector(state => state.filters);

    const handleClick = (filterType, filterName) => {
        const updatedFilters = new Set(activeFilters[filterType]);

        if (updatedFilters.has(filterName)) {
            updatedFilters.delete(filterName);
        } else {
            updatedFilters.add(filterName);
        }

        dispatch({
            type: FILTERS,
            payload: {
                ...activeFilters,
                [filterType]: [...updatedFilters],
                page: 1
            }
        });
    };

    const handleClearFilters = () => {
        dispatch({
            type: FILTERS,
            payload: { countries: [], categories: [], page: 1 }
        });
    };

    const viewList = [
        { title: 'Países', list: countriesList, variable: 'countries' },
        { title: 'Categorías', list: categoriesList, variable: 'categories' }
    ];

    return (
        <div className={container}>
            <div>
                <p>Filtros</p>
                <button onClick={handleClearFilters}>Limpiar</button> 
            </div>
            {viewList.map(({ title, list, variable }) => (
            <div className={separator} key={variable}>
                <div>
                    <p>{title}</p>
                </div>
                <div> 
                    {list.map(({ name, id }) => (
                    <div
                        key={id}
                        onClick={() => handleClick(variable, id)}
                        className={nameCountries}
                    >
                        <h5 className={activeFilters[variable].find(item => item === id) ? active : ''}>{name}</h5>
                    </div>
                    ))}
                </div>
            </div>
            ))}
        </div>
    );
};

export { Filters };