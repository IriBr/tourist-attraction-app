import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.png';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${isHome ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="Wandr" className="w-8 h-8 rounded-lg" />
              <span className={`text-xl font-bold ${isHome ? 'text-white' : 'text-gray-900'}`}>Wandr</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`${isHome ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Features</a>
              <a href="#how-it-works" className={`${isHome ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>How It Works</a>
              <Link to="/support" className={`${isHome ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Support</Link>
              <a
                href="https://apps.apple.com/app/wandr/id6757339449"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Download App
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden ${isHome ? 'text-white' : 'text-gray-900'}`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile nav */}
          {isMenuOpen && (
            <div className="md:hidden bg-white rounded-lg shadow-lg mt-2 p-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900" onClick={() => setIsMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-gray-900" onClick={() => setIsMenuOpen(false)}>How It Works</a>
                <Link to="/support" className="text-gray-600 hover:text-gray-900" onClick={() => setIsMenuOpen(false)}>Support</Link>
                <a
                  href="https://apps.apple.com/app/wandr/id6757339449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-center"
                >
                  Download App
                </a>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src={logo} alt="Wandr" className="w-10 h-10 rounded-lg" />
                <span className="text-xl font-bold">Wandr</span>
              </div>
              <p className="text-gray-400 mb-4">
                Discover the world's most amazing attractions. Verify your visits, earn badges, and track your travel journey.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://apps.apple.com/app/wandr/id6757339449"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                    alt="Download on the App Store"
                    className="h-10"
                  />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Wandr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
