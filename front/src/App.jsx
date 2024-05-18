import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css'
import { Home } from './pages/home/Home';
import { Product } from './pages/product/Product';

function App() {

	return (
		<>
			<Routes>
				<Route path='*' element={<h3>Error</h3>} />
				<Route path='/' element={<Home />} />
				<Route path='/product/:country/:name/:id' element={<Product />} />
			</Routes>
		</>
	);
};

export default App
