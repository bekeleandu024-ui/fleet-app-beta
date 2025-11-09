import React from 'react';
export const ProgressBar = ({
  percentage,
  color = 'blue'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };
  return <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <div className={`${getColorClasses()} h-2`} style={{
      width: `${percentage}%`
    }}></div>
    </div>;
};