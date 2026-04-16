/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Resultados from './pages/Resultados';
import Perfil from './pages/Perfil';
import ReviewForm from './pages/ReviewForm';
import SoyInstalador from './pages/SoyInstalador';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="resultados" element={<Resultados />} />
        <Route path="perfil/:installerId" element={<Perfil />} />
        <Route path="r/:installerId" element={<ReviewForm />} />
        <Route path="soy-instalador" element={<SoyInstalador />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
