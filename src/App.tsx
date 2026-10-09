import type { ReactElement } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import CityPage from './pages/CityPage'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

const App = (): ReactElement => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/ciudad/:user" element={<CityPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)

export default App
