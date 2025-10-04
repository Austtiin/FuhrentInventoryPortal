import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200/50 shadow-sm mt-auto w-full">
      <div className="px-6 py-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-start">
          {/* Left Side - Company Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-lg font-bold bg-gradient-to-r from-primary-mint to-primary-mint-dark bg-clip-text text-transparent mb-2">
                Fuhr Enterprise Dealer Inventory
              </h3>
              <p className="text-sm text-slate-600 max-w-md">
                Professional inventory management solution for Fuhr Enterprise.
              </p>
            </div>

          </div>

          {/* Right Side - Contact & Info */}
          <div className="flex-shrink-0">
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Support:</strong> Austin@Fuhrent.com
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Disclaimers */}
        <div className="border-t border-gray-200/50 pt-6 mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <div className="flex flex-col gap-2 lg:flex-row lg:gap-6">
              <p className="text-xs text-slate-500 m-0">
                © {currentYear} Fuhr Enterprise. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 m-0">
                Information subject to change without notice.
              </p>
            </div>
            
            <div className="text-xs text-slate-500">
              <p className="m-0">
                Designed & Built by <span className="font-semibold text-primary-mint">AS</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;