# Chapter 24: React Native + Expo + TypeScript (Hour 24)

React Native lets you build iOS and Android apps using React and TypeScript. Expo is the toolkit that makes getting started fast, handling the build system, native APIs, and OTA updates for you.

## 1. Setup

```bash
npx create-expo-app@latest my-app --template blank-typescript
cd my-app
npx expo start
```

This scaffolds a TypeScript project with `tsconfig.json` pre-configured for React Native.

## 2. Core Differences from React Web

| Web React | React Native |
|-----------|-------------|
| `<div>` | `<View>` |
| `<p>`, `<span>` | `<Text>` |
| `<img>` | `<Image>` |
| `<input>` | `<TextInput>` |
| `<button>` | `<TouchableOpacity>` / `<Pressable>` |
| CSS classes | `StyleSheet.create({})` |
| `onClick` | `onPress` |

## 3. Typing Components

Component props are typed identically to React web.

```typescript
// components/Card.tsx
import { View, Text, StyleSheet, Pressable } from "react-native";

interface CardProps {
    title: string;
    subtitle?: string;
    onPress: () => void;
}

export function Card({ title, subtitle, onPress }: CardProps) {
    return (
        <Pressable onPress={onPress} style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card:     { padding: 16, borderRadius: 8, backgroundColor: "#fff" },
    title:    { fontSize: 18, fontWeight: "bold" },
    subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
});
```

## 4. Typing StyleSheet

`StyleSheet.create` is fully typed — it validates that you are using valid React Native style properties.

```typescript
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";

// You can type individual styles explicitly
const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
};

// Or let StyleSheet.create infer everything
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    text:      { fontSize: 16, color: "#333" },
    image:     { width: 100, height: 100, borderRadius: 50 },
});

// TypeScript will error if you use web-only properties
// const bad: ViewStyle = { display: "grid" }; // Error — not valid in RN
```

## 5. Typing Event Handlers

React Native has its own event types, different from the web.

```typescript
import {
    TextInput,
    NativeSyntheticEvent,
    TextInputChangeEventData,
    TextInputSubmitEditingEventData,
} from "react-native";

function SearchBar() {
    const handleChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        console.log(e.nativeEvent.text); // the typed text
    };

    const handleSubmit = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
        console.log("Submitted:", e.nativeEvent.text);
    };

    return (
        <TextInput
            placeholder="Search..."
            onChange={handleChange}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
        />
    );
}
```

## 6. Navigation with React Navigation

React Navigation is the standard routing library. Its TypeScript integration requires defining a route param map.

```bash
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

```typescript
// navigation/types.ts — define your route params
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
    Home:        undefined;           // no params
    UserDetail:  { userId: number };  // requires userId
    NewUser:     { prefillEmail?: string }; // optional param
};

// Convenience type for screen props
export type HomeScreenProps    = NativeStackScreenProps<RootStackParamList, "Home">;
export type UserDetailProps    = NativeStackScreenProps<RootStackParamList, "UserDetail">;
```

```typescript
// screens/HomeScreen.tsx
import { View, Text, Button } from "react-native";
import { HomeScreenProps } from "../navigation/types";

export function HomeScreen({ navigation }: HomeScreenProps) {
    return (
        <View>
            <Text>Home</Text>
            <Button
                title="View User"
                // TypeScript ensures you pass the correct params
                onPress={() => navigation.navigate("UserDetail", { userId: 42 })}
            />
        </View>
    );
}
```

```typescript
// screens/UserDetailScreen.tsx
import { UserDetailProps } from "../navigation/types";

export function UserDetailScreen({ route, navigation }: UserDetailProps) {
    const { userId } = route.params; // userId: number — fully typed
    return <Text>User ID: {userId}</Text>;
}
```

```typescript
// App.tsx — setting up the navigator
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./navigation/types";
import { HomeScreen } from "./screens/HomeScreen";
import { UserDetailScreen } from "./screens/UserDetailScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home"       component={HomeScreen} />
                <Stack.Screen name="UserDetail" component={UserDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
```

## 7. Expo APIs — Typed Native Modules

Expo wraps native device APIs with TypeScript types.

```typescript
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function getCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const location = await Location.getCurrentPositionAsync({});
    // location.coords.latitude: number
    // location.coords.longitude: number
    console.log(location.coords.latitude, location.coords.longitude);
}

async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
    });

    if (!result.canceled) {
        const uri = result.assets[0].uri; // string
        console.log("Selected image:", uri);
    }
}

// AsyncStorage — typed wrappers
async function saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem("auth_token", token);
}

async function loadToken(): Promise<string | null> {
    return AsyncStorage.getItem("auth_token");
}
```

## 8. Platform-Specific Types

```typescript
import { Platform, PlatformOSType } from "react-native";

// Platform.OS is typed as PlatformOSType: "ios" | "android" | "web" | "windows" | "macos"
function getPlatformMessage(): string {
    switch (Platform.OS) {
        case "ios":     return "Running on iPhone/iPad";
        case "android": return "Running on Android";
        default:        return "Running on other platform";
    }
}

// Platform.select — returns the value for the current platform
const hitSlop = Platform.select({
    ios:     { top: 10, bottom: 10, left: 10, right: 10 },
    android: { top: 8,  bottom: 8,  left: 8,  right: 8  },
    default: { top: 5,  bottom: 5,  left: 5,  right: 5  },
});
```

## Action Item for Hour 24:

- Build a simple contact list app with:
  - A `Contact` interface: `{ id: number; name: string; phone: string; favourite: boolean }`
  - A home screen showing all contacts with `FlatList`
  - A detail screen showing a single contact (navigate with typed params)
  - A typed `useContacts()` custom hook that manages the contact list state
  - A form screen to add a new contact using `TextInput` and typed `useState`
