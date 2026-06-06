import React from 'react';
import type { MapGroup } from '../../hooks/useBasemapGroups';

interface BasemapGroupSelectorProps {
  groups: MapGroup[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  className?: string;
}

export function BasemapGroupSelector({
  groups,
  selectedGroupId,
  onGroupChange,
  className = ''
}: BasemapGroupSelectorProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <select
      value={selectedGroupId}
      onChange={(e) => onGroupChange(e.target.value)}
      className={`text-xs px-3 py-1.5 border border-[#E9DFD0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8B6F47] bg-white ${className}`}
    >
      {groups.map(group => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  );
}
