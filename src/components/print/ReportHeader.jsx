import React from 'react';

export const ReportHeader = ({ title, showNBR }) => {
  return (
    <div className="flex justify-between items-center border-b pb-4 mb-4">
      <div className="flex items-center gap-3">
        <img src="/novem-logo.png" alt="Novem Logo" className="h-12 w-auto" />
        <div>
          <h1 className="text-xl font-bold">Novem Eco Resort</h1>
          <p className="text-sm">Sreemangal, Bangladesh</p>
        </div>
      </div>
      {showNBR && (
        <div className="text-right">
          <img src="/nbr-logo.png" alt="NBR Logo" className="h-12 w-auto ml-auto" />
          <p className="text-[10px] font-semibold">Regulatory Compliant</p>
        </div>
      )}
    </div>
  );
};
