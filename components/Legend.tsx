import React from 'react';
import { NODE_TYPES } from '../constants';

const Legend: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 p-4 rounded-lg shadow-lg border border-gray-200 backdrop-blur-sm z-10 pointer-events-auto">
      <h3 className="text-sm font-bold mb-2 text-gray-700">图例 (Legend)</h3>
      <div className="flex flex-col gap-2">
        {NODE_TYPES.map((type) => (
          <div key={type.value} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: type.color }}
            />
            <span className="text-xs text-gray-600">{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
