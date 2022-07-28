import { useContext } from 'react';
import { AuthenticationContext } from '../providers/AuthenticationProvider';

export const useProfile = () => {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a AuthenticationContext');
  }
  return context;
};
