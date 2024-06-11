import './App.css'
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FILTERS, USER_SESSION } from './redux/actions-type';
import useResponsiveValue from './hooks/useResponsiveValue';
import { Home } from './pages/Home/Home';
import { verifyToken } from './redux/actions';

function App() {
	const dispatch = useDispatch();

	const limit = useResponsiveValue(10, 15, 25);

	useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
		dispatch({ type: USER_SESSION, payload: storedUser });

        if (storedUser && storedUser.token) {
            dispatch(verifyToken(storedUser.token));
        };
    }, [dispatch]);

	useEffect(() => {
		dispatch({ type: FILTERS, payload: { limit } });
	}, [limit]);

	return (		
		<Routes>
			<Route path='*' element={<h3>Error</h3>} />
			<Route path="/" element={<Home />} />
			<Route path="/dashboard/*" element={<Dashboard />} />
		</Routes>
	);
};

export default App;