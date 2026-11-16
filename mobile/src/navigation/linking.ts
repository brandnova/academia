import * as ExpoLinking from 'expo-linking';
import { getStateFromPath, LinkingOptions } from '@react-navigation/native';

import { WEB_BASE_URL } from '../config/app';
import type { RootStackParamList } from './types';

/**
 * Deep links. The custom scheme works now. Opening https links (the web URL) in the app also needs
 * Android intent filters with autoVerify plus assetlinks.json on the final domain, see DEPLOYMENT_CHECKLIST.
 * The paths mirror the web routes, so a shared web link maps onto the same screen.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [ExpoLinking.createURL('/'), 'academiaatlas://', WEB_BASE_URL],
  config: {
    screens: {
      Main: { path: '', screens: { Home: '', Schools: 'schools', Alerts: 'notifications', Profile: 'profile' } },
      School: 'schools/:schoolId/:slug?',
      Question: 'questions/:questionId/:slug?',
      Search: 'search',
      Tags: 'tags',
      TagQuestions: 'tags/:tag',
      MyReports: 'my-reports',
      Pages: 'pages',
      PageView: 'pages/:slug',
    },
  },
  // Web notification links end in #answer-{id}, which opens the question scrolled to that answer.
  getStateFromPath(path, options) {
    const [base, hash] = path.split('#');
    const state = getStateFromPath(base, options);
    const answer = /^answer-([\w-]+)$/.exec(hash ?? '')?.[1];
    const route = state?.routes[state.routes.length - 1];
    if (answer && route?.name === 'Question') (route as { params?: object }).params = { ...(route.params as object), answerId: answer };
    return state;
  },
};