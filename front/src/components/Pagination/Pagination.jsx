
import { containerPaginacion, buttonContainer } from './Pagination.module.css';
import { useState } from 'react';
import { ButtonNext } from '../Button Next/Button Next';

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
	const [input, setInput] = useState(currentPage);

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
        }
		if (value > totalPages) {
			setInput(totalPages);
		}
		if (value < 1) {
			setInput(1);
		}
    };

	const changePage = (increment) => {
        if (isNaN(input) || input === '') {
            setInput(1);
            setCurrentPage(1);
            return; // Salir si el input no es válido
        }

        const newPage = parseInt(input) + increment;
        if (newPage >= 1 && newPage <= totalPages) {
            setInput(newPage);
            setCurrentPage(newPage);
        } 
    };

	return (
		<div className={containerPaginacion}>
			<div className={buttonContainer}>
				<ButtonNext
					disabled={currentPage < 2 || input !== currentPage}
					onClick={() => changePage(-1)} // Retroceder
				/>
			</div>
			<input
				onChange={(event) => onChange(event)}
				onKeyDown={onKeyDown}
				name='currentPage'
				autoComplete='off'
				value={input}
			/>
			<p>
				Página {currentPage} de {totalPages}
			</p>
			<div className={buttonContainer}>
				<ButtonNext
					condition={true}
					disabled={currentPage > totalPages - 1 || input !== currentPage}
					onClick={() => changePage(1)} // Avanzar
				/>
			</div>
		</div>
	);
};

export { Pagination };

