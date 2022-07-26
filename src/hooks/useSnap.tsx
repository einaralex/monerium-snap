import { useContext } from 'react';
import { SnapContext } from '../providers/SnapProvider';

export const useSnap = () => {
  const context = useContext(SnapContext);
  if (context === undefined) {
    throw new Error('useSnap must be used within a SnapContext');
  }
  return context;
};
