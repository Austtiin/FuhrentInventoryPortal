import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto h-5 bg-[#ECF5E9]/80 backdrop-blur-sm border-t border-gray-200/30 flex items-center justify-center px-4 text-[10px] text-gray-600">
      <span>© {currentYear} Fuhr Enterprise • Designed by AS • Information subject to change</span>
    </footer>
  );
};

export default Footer;