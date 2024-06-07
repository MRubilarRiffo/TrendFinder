import './App.css'
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FILTERS } from './redux/actions-type';
import useResponsiveValue from './hooks/useResponsiveValue';

function App() {
	const dispatch = useDispatch();

	const limit = useResponsiveValue(10, 15, 25);

	useEffect(() => {
		dispatch({ type: FILTERS, payload: { limit } });
	}, [limit]);

	return (		
		<Routes>
			<Route path='*' element={<h3>Error</h3>} />
			<Route path="/dashboard/*" element={<Dashboard />} />
		</Routes>
	);
};

export default App;