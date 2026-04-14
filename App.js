import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonts
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { SourceSans3_400Regular, SourceSans3_700Bold } from '@expo-google-fonts/source-sans-3';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';


// Screens
import OnboardingScreen    from './screens/OnboardingScreen';
import HomeScreen          from './screens/HomeScreen';
import ShowcaseScreen      from './screens/ShowcaseScreen';
import LeaderboardScreen   from './screens/LeaderboardScreen';
import NewsScreen          from './screens/NewsScreen';
import GuideScreen         from './screens/GuideScreen';
import QuestDetailScreen   from './screens/QuestDetailScreen';
import ScamDetectorScreen    from './screens/ScamDetectorScreen';
import ProgressScreen        from './screens/ProgressScreen';

// Context
import { AppContextProvider, useAppContext } from './context/AppContext';

// Theme
import { Colors, TouchTarget } from './constants/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab icon mapping ─────────────────────────────────────────────────────────
const TAB_ICONS = {
  Quests:       '🏠',
  Showcase:     '🌟',
  Leaders:      '🏆',
  News:         '📰',
  Guide:        '🤖',
  'Scam Check': '🛡️',
};


function TabIcon({ name }) {
  return (
    <View style={tabStyles.iconWrapper}>
      <Text style={tabStyles.icon}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: tabStyles.bar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: tabStyles.label,
        tabBarItemStyle: tabStyles.item,
        tabBarIcon: () => <TabIcon name={route.name} />,
      })}
    >
      <Tab.Screen name="Quests"       component={HomeScreen} />
      <Tab.Screen name="Showcase"     component={ShowcaseScreen} />
      <Tab.Screen name="Leaders"      component={LeaderboardScreen} />
      <Tab.Screen name="News"         component={NewsScreen} />
      <Tab.Screen name="Guide"        component={GuideScreen} />
      <Tab.Screen
        name="Scam Check"
        component={ScamDetectorScreen}
        options={{
          // Coral active tint to distinguish safety feature
          tabBarActiveTintColor: Colors.secondary,
          tabBarLabel: 'Scam Check',
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <Text style={splashStyles.logo}>TechQuest</Text>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { fontFamily: 'Nunito_800ExtraBold', fontSize: 32, color: Colors.primary, letterSpacing: 1 },
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    SourceSans3_400Regular,
    SourceSans3_700Bold,
    SpaceMono_400Regular,
  });

  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    // Check for saved Supabase user_id (not user_name from old version)
    AsyncStorage.getItem('user_id')
      .then((id) => setInitialRoute(id ? 'Main' : 'Onboarding'))
      .catch(() => setInitialRoute('Onboarding'));
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <View style={splashStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!initialRoute) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContextProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false, animation: 'fade' }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Main"       component={MainTabs} />
            <Stack.Screen
              name="QuestDetail"
              component={QuestDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContextProvider>
    </SafeAreaProvider>
  );
}

// ─── Tab styles ───────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: TouchTarget.nav,
    paddingBottom: 8,
    paddingTop: 6,
  },
  label: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,   // Slightly smaller to fit 6 tabs
    marginTop: 2,
  },
  item: { paddingVertical: 4 },
  iconWrapper: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },  // Slightly smaller for 6 tabs
});
