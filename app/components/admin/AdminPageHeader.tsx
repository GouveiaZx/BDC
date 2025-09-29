import React from 'react';
import { IconType } from 'react-icons';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: IconType;
  actions?: React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  }[];
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  stats
}) => {
  const getStatColor = (color: string = 'blue') => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {Icon && (
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {stats && stats.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatColor(stat.color)}`}
                >
                  <span className="font-semibold">{stat.value}</span>
                  <span className="ml-1">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {actions && (
          <div className="mt-4 lg:mt-0 lg:ml-4 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageHeader; 