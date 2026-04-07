// [woo] 비로그인 네비게이터 — 로그인/회원가입 스택 (탭 제거)
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "@/screens/LoginScreen";
import RegisterRoleScreen from "@/screens/auth/RegisterRoleScreen";
import RegisterSchoolScreen from "@/screens/auth/RegisterSchoolScreen";
import RegisterFormScreen from "@/screens/auth/RegisterFormScreen";
import SocialSelectRoleScreen from "@/screens/auth/SocialSelectRoleScreen";

const Stack = createNativeStackNavigator();

export default function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="RegisterRole"   component={RegisterRoleScreen} />
      <Stack.Screen name="RegisterSchool" component={RegisterSchoolScreen} />
      <Stack.Screen name="RegisterForm"      component={RegisterFormScreen} />
      <Stack.Screen name="SocialSelectRole" component={SocialSelectRoleScreen} />
    </Stack.Navigator>
  );
}
