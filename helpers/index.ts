import snapCfg from '../snap.config';
import snapManifest from '../snap.manifest.json';

export const snapId =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? `local:${window.location.protocol}//${window.location.hostname}:${snapCfg.cliOptions.port}`
    : `npm:${snapManifest.source.location.npm.packageName}`;
