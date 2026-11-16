import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { SchoolsScreen } from '../screens/SchoolsScreen';
import { AskScreen } from '../screens/AskScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TabBar } from './TabBar';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schools" component={SchoolsScreen} />
      <Tab.Screen name="Ask" component={AskScreen} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
