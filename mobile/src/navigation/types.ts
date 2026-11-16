import type { NavigatorScreenParams } from '@react-navigation/native';
import {
  createNavigationContainerRef,
  NavigationContainerRefWithCurrent,
} from '@react-navigation/native';

export type AskParams = {
  nonce?: number;
  hubId?: string;
  schoolId?: string;
  schoolName?: string;
  editQuestionId?: string;
};

export type TabParamList = {
  Home: undefined;
  Schools: undefined;
  Ask: AskParams | undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Login: undefined;
  School: { schoolId?: string; slug?: string; name?: string };
  Question: { questionId: string; answerId?: string };
  Search: undefined;
  Tags: undefined;
  TagQuestions: { tag: string };
  MyReports: undefined;
  Pages: undefined;
  PageView: { slug: string; title?: string };
};

export const navigationRef: NavigationContainerRefWithCurrent<RootStackParamList> =
  createNavigationContainerRef<RootStackParamList>();

export function navigateRoot<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name],
): void {
  if (!navigationRef.isReady()) return;
  const navigator = navigationRef as unknown as {
    navigate: (routeName: string, routeParams?: unknown) => void;
  };
  navigator.navigate(name, params);
}

export function goBackRoot(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
}

export function startAsk(params: Omit<AskParams, 'nonce'> = {}): void {
  navigateRoot('Main', {
    screen: 'Ask',
    params: { ...params, nonce: Date.now() },
  });
}
