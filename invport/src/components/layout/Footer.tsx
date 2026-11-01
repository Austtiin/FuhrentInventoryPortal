import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-4 text-center text-xs text-gray-500">
      <span>© {currentYear} Fuhr Enterprise • Designed by AS • Information subject to change</span>
    </footer>
  );
};

export default Footer;