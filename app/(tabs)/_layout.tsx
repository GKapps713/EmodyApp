import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute", // iOS에서 blur 효과 보이게
          },
          default: {},
        }),
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Mood Music */}
      <Tabs.Screen
        name="emotion"
        options={{
          title: "Mood Music",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="musical-notes-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* My Echoes */}
      <Tabs.Screen
        name="myechoes"
        options={{
          title: "My Echoes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="headset-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Our Echo */}
      <Tabs.Screen
        name="ourecho"
        options={{
          title: "Our Echo",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="earth-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Chat */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* My Emody */}
      <Tabs.Screen
        name="myemody"
        options={{
          title: "My Emody",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
