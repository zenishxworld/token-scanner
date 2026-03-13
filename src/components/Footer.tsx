import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 md:gap-0 md:justify-between">
        {/* Left Column */}
        <div className="md:w-1/3 flex flex-col items-start mb-8 md:mb-0">
          <span className="text-2xl font-bold mb-2">TokenShield AI</span>
          <p className="text-muted-foreground mb-4 max-w-xs">
            AI-powered token scanning to detect pump-and-dump risk signals before you invest.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center border border-border px-4 py-2 rounded hover:bg-accent transition-colors text-sm font-medium"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Back to Top
          </button>
        </div>

        {/* Middle Column: Site Map */}
        <div className="md:w-1/3 mb-8 md:mb-0">
          <h3 className="font-semibold mb-4">Site Map</h3>
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="hover:underline w-fit hover:text-primary transition-colors">Home</Link>
            <Link to="/scanner" className="hover:underline w-fit hover:text-primary transition-colors">Scanner</Link>
          </nav>
        </div>

        {/* Right Column: Credits */}
        <div className="md:w-1/3">
          <h3 className="font-semibold mb-4">Credits</h3>
          <div className="space-y-1">
            <div>Zenish Patel – Developer & System Designer</div>
            <div>Moksh Patel – Research & Documentation</div>
          </div>
        </div>
      </div>
      <hr className="border-border" />
      <div className="py-4 text-center text-xs text-muted-foreground">
        © 2026 TokenShield AI. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;