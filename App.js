import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FarmScreen from './src/screens/FarmScreen';
import UpgradeScreen from './src/screens/UpgradeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [onboarded, setOnboarded] = useState(null);
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
      const done = await AsyncStorage.getItem('onboarded');
      const savedCharacter = await AsyncStorage.getItem('character');
      if (done === 'true' && savedCharacter) {
        setCharacter(JSON.parse(savedCharacter));
        setOnboarded(true);
      } else {
        setOnboarded(false);
      }
    };

  if (onboarded === null) return null;

  if (!onboarded) {
    return (
      <OnboardingScreen
        onComplete={(char) => {
          setCharacter(char);
          setOnboarded(true);
        }}
      />
    );
  }

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
