import { Outlet, Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-vbg text-white font-sans flex flex-col">
      <header className="border-b border-vborder bg-black sticky top-0 z-50 h-[72px] flex items-center">
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between w-full">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
            <span className="text-vorange text-2xl leading-none">⚡</span>
            <span>Busca Tu Maestro</span>
          </Link>
          <nav className="flex items-center gap-2 text-[0.85rem] text-zinc-400">
            ¿Eres Instalador?
            <Link to="/soy-instalador" className="text-vorange font-semibold ml-1 hover:text-orange-400 transition-colors">
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="border-t border-vborder bg-vbg py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Busca Tu Maestro. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
