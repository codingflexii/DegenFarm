import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import FarmScreen from './src/screens/FarmScreen';
import UpgradeScreen from './src/screens/UpgradeScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0a0a0a',
            borderTopColor: '#9945FF',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#9945FF',
          tabBarInactiveTintColor: '#444444',
        }}
      >
        <Tab.Screen
          name="Farm"
          component={FarmScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🌾</Text>,
          }}
        />
        <Tab.Screen
          name="Upgrades"
          component={UpgradeScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚡</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}