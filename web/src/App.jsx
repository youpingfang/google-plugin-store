import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ThemeProvider } from './hooks/useTheme.jsx';
import Header from './components/Header';
import Home from './pages/Home';
import PluginDetail from './pages/PluginDetail';
import Developer from './pages/Developer';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-text-primary">
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
