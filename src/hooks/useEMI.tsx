import { useContext } from 'react';
import { DataContext } from '../providers/DataProvider';

// use Electronic money issuer.
export const useEMI = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useEMI must be used within a DataContext');
  }
  return context;
};
