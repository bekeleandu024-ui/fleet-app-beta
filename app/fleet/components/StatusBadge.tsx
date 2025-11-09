import React from 'react';
export const StatusBadge = ({
  status
}) => {
  let bgColor = 'bg-gray-700';
  let textColor = 'text-gray-300';
  if (status === 'active') {
    bgColor = 'bg-green-900 bg-opacity-50';
    textColor = 'text-green-400';
  } else if (status === 'onTrip') {
    bgColor = 'bg-blue-900 bg-opacity-50';
    textColor = 'text-blue-400';
  } else if (status === 'offDuty') {
    bgColor = 'bg-gray-700';
    textColor = 'text-gray-300';
  } else if (status === 'maintenance') {
    bgColor = 'bg-yellow-900 bg-opacity-50';
    textColor = 'text-yellow-400';
  } else if (status === 'com') {
    bgColor = 'bg-gray-700';
    textColor = 'text-gray-300';
  } else if (status === 'rnr') {
    bgColor = 'bg-gray-700';
    textColor = 'text-gray-300';
  } else if (status === 'oo') {
    bgColor = 'bg-gray-700';
    textColor = 'text-gray-300';
  }
  const getStatusText = status => {
    switch (status) {
      case 'active':
        return 'ACTIVE';
      case 'onTrip':
        return 'ON TRIP';
      case 'offDuty':
        return 'OFF DUTY';
      case 'maintenance':
        return 'MAINTENANCE';
      case 'com':
        return 'COM';
      case 'rnr':
        return 'RNR';
      case 'oo':
        return 'OO';
      default:
        return status.toUpperCase();
    }
  };
  return <span className={`px-2 py-1 text-xs rounded-md ${bgColor} ${textColor} border border-gray-600`}>
      {getStatusText(status)}
    </span>;
};