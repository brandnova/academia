import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme';
import { LoginScreen } from '../screens/LoginScreen';
import { MyReportsScreen } from '../screens/MyReportsScreen';
import { PageScreen } from '../screens/PageScreen';
import { PagesScreen } from '../screens/PagesScreen';
import { QuestionScreen } from '../screens/QuestionScreen';
import { SchoolScreen } from '../screens/SchoolScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { TagQuestionsScreen } from '../screens/TagQuestionsScreen';
import { TagsScreen } from '../screens/TagsScreen';
import { linking } from './linking';
import { TabNavigator } from './TabNavigator';
import { navigationRef, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, mode } = useTheme();
  const { status, welcomeSeen } = useAuth();

  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = { ...base, colors: { ...base.colors, primary: colors.accent, background: colors.bg, card: colors.surface, text: colors.ink, border: colors.line, notification: colors.accent } };
  const initialRoute: keyof RootStackParamList = status === 'guest' && !welcomeSeen ? 'Login' : 'Main';

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="School" component={SchoolScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Tags" component={TagsScreen} />
        <Stack.Screen name="TagQuestions" component={TagQuestionsScreen} />
        <Stack.Screen name="MyReports" component={MyReportsScreen} />
        <Stack.Screen name="Pages" component={PagesScreen} />
        <Stack.Screen name="PageView" component={PageScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}