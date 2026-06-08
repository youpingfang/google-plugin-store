import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import PluginDetail from './pages/PluginDetail';
import Developer from './pages/Developer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plugin/:id" element={<PluginDetail />} />
            <Route path="/developer" element={<Developer />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
