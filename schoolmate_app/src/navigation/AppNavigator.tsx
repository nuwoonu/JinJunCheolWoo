// [woo] 인증 상태에 따라 로그인 / 역할별 탭 네비게이터 분기
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme"; // [woo] 다크모드

import GuestNavigator from "@/navigation/GuestNavigator";
import ParentNavigator from "@/navigation/ParentNavigator";
import TeacherNavigator from "@/navigation/TeacherNavigator";
import StudentNavigator from "@/navigation/StudentNavigator";

const Stack = createNativeStackNavigator();

// [woo] 딥링크용 네비게이션 ref — App.tsx에서 알림 탭 시 사용
export const navigationRef = createNavigationContainerRef();

// [woo] 역할별 네비게이터 분기 (관리자/교직원은 교사 탭 사용)
function RoleNavigator() {
  const { user } = useAuth();

  switch (user?.role) {
    case "PARENT":  return <ParentNavigator />;
    case "TEACHER":
    case "STAFF":
    case "ADMIN":   return <TeacherNavigator />;
    case "STUDENT": return <StudentNavigator />;
    default:        return <StudentNavigator />;
  }
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!!user ? (
          <Stack.Screen name="Main" component={RoleNavigator} />
        ) : (
          <Stack.Screen name="Guest" component={GuestNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
