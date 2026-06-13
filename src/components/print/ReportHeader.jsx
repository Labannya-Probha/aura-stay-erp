export const ReportHeader = ({ title, showNBR = false }) => (
  <div className="flex justify-between items-center border-b pb-4 mb-6">
    <img src="/novem-logo.png" alt="Novem Logo" className="h-16" />
    <h1 className="text-xl font-bold uppercase">{title}</h1>
    {showNBR && <img src="/nbr-logo.png" alt="NBR Logo" className="h-16" />}
  </div>
);
