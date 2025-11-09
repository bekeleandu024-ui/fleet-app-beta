import React from 'react';
import { ArrowUpDownIcon, MoreVerticalIcon } from 'lucide-react';
export const IssuesTable = () => {
  const issuesData = [{
    id: '#1234',
    issue: 'HOS risk in 2h. Predicted 14m over.',
    severity: 'Breach',
    etaImpact: '+25m',
    owner: 'John Smith',
    sla: '2h 15m',
    slaStatus: 'critical'
  }, {
    id: '#5678',
    issue: 'Cost 23% above normal range for lane',
    severity: 'Risk',
    etaImpact: '—',
    owner: 'Sarah Johnson',
    sla: '4h 30m',
    slaStatus: 'warning'
  }, {
    id: '#9012',
    issue: 'Border delay detected (30m wait)',
    severity: 'Watch',
    etaImpact: '+30m',
    owner: 'Mike Wilson',
    sla: '6h 45m',
    slaStatus: 'normal'
  }, {
    id: '#3456',
    issue: 'Driver route deviation (12 miles)',
    severity: 'Watch',
    etaImpact: '+15m',
    owner: 'Emily Brown',
    sla: '8h 20m',
    slaStatus: 'normal'
  }, {
    id: '#7890',
    issue: 'Fuel stop required (tank at 15%)',
    severity: 'Risk',
    etaImpact: '+20m',
    owner: 'David Lee',
    sla: '3h 10m',
    slaStatus: 'warning'
  }, {
    id: '#2468',
    issue: 'Weather alert on route (heavy snow)',
    severity: 'Breach',
    etaImpact: '+45m',
    owner: 'Jeff Churchill',
    sla: '1h 30m',
    slaStatus: 'critical'
  }, {
    id: '#1357',
    issue: 'Delivery window approaching fast',
    severity: 'Watch',
    etaImpact: '+10m',
    owner: 'Denise Starr',
    sla: '5h 55m',
    slaStatus: 'normal'
  }];
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Breach':
        return 'bg-red-600 text-white';
      case 'Risk':
        return 'bg-orange-600 text-white';
      case 'Watch':
        return 'bg-yellow-600 text-black';
      default:
        return 'bg-gray-600 text-white';
    }
  };
  const getSlaColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-white';
    }
  };
  return <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-4 text-left">
                <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ORDER/TRIP
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <span>ISSUE</span>
                  <ArrowUpDownIcon className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                SEVERITY
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ETA IMPACT
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                OWNER
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <span>SLA</span>
                  <ArrowUpDownIcon className="h-3 w-3" />
                </div>
              </th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {issuesData.map((item, index) => <tr key={index} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                <td className="px-4 py-4">
                  <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
                </td>
                <td className="px-4 py-4 text-white font-medium">{item.id}</td>
                <td className="px-4 py-4 text-white max-w-md">{item.issue}</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 rounded-md text-xs font-semibold ${getSeverityColor(item.severity)}`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-4 py-4 text-white">{item.etaImpact}</td>
                <td className="px-4 py-4 text-white">{item.owner}</td>
                <td className={`px-4 py-4 font-semibold ${getSlaColor(item.slaStatus)}`}>
                  {item.sla}
                </td>
                <td className="px-4 py-4">
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreVerticalIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};