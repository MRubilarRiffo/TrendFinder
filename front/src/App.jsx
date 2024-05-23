import './App.css'
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard/Dashboard';

function App() {
	return (		
		<Routes>
			<Route path='*' element={<h3>Error</h3>} />
			<Route path="/dashboard/*" element={<Dashboard />} />
		</Routes>
	);
};

export default App;