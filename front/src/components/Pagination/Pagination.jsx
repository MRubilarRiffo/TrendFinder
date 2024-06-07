
import { containerPaginacion, buttonContainer } from './Pagination.module.css';
import { useState } from 'react';
import { ButtonNext } from '../Button Next/Button Next';
import { useDispatch, useSelector } from 'react-redux';
import { FILTERS } from '../../redux/actions-type';

const Pagination = ({ totalPages }) => {
	const dispatch = useDispatch();

	const { page } = useSelector((state) => state.filters);

	const [input, setInput] = useState(page);

	const onKeyDown = (event) => {
		if (event.keyCode === 13) { // Si se presiona Enter
			event.preventDefault(); // Evitar el comportamiento por defecto del Enter (recargar la página, etc.)
			changePage(0); // Validar el valor actual del input y cambiar de página si es necesario
		}
	};

    const onChange = (event) => {
        const value = parseInt(event.target.value);

        if (!isNaN(value)) {
            setInput(value); // Guardar el valor numérico directamente
        };

		if (value > totalPages) {
			setInput(totalPages);
		};

		if (value < 1) {
			setInput(1);
		};
    };

	const changePage = (increment) => {
        if (isNaN(input) || input === '') {
            setInput(1);
			dispatch({ type: FILTERS, payload: { page: 1 } });
            return;
        }

        const newPage = parseInt(input) + increment;
        if (newPage >= 1 && newPage <= totalPages) {
            setInput(newPage);
			dispatch({ type: FILTERS, payload: { page: newPage } });
        } 
    };

	return (
		<div className={containerPaginacion}>
			<div className={buttonContainer}>
				<ButtonNext
					disabled={page < 2 || input !== page}
					onClick={() => changePage(-1)} // Retroceder
				/>
			</div>
			<input
				onChange={(event) => onChange(event)}
				onKeyDown={onKeyDown}
				name='page'
				autoComplete='off'
				value={input}
			/>
			<p>Página {page} de {totalPages}</p>
			<div className={buttonContainer}>
				<ButtonNext
					condition={true}
					disabled={page > totalPages - 1 || input !== page}
					onClick={() => changePage(1)} // Avanzar
				/>
			</div>
		</div>
	);
};

export { Pagination };

