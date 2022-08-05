import { useContext } from 'react';
import { SnapContext } from '../providers/SnapProvider';

export const useSnap = () => {
  const context = useContext(SnapContext);
  if (context === undefined) {
    throw new Error('useSnap must be used within a SnapContext');
  }

  // TODO: clear message when not flask.
  // TODO: clear message when snap is not install
  // TODO: clear message when snap is not on

  // see old snap `index-old`

  // setStatus(
  //   isFlask
  //     ? isSnapInstalled
  //       ? isSnapOn
  //         ? 'on'
  //         : 'off'
  //       : 'not-installed'
  //     : 'not-compatible',
  // );
  return context;
};
