// [woo] 교사 탭 네비게이터
import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme"; // [woo] 다크모드

import TeacherHomeScreen from "@/screens/teacher/HomeScreen";
import ClassManagementScreen from "@/screens/teacher/ClassManagementScreen";
import TeacherBoardScreen from "@/screens/teacher/BoardScreen";
import TeacherHomeworkScreen from "@/screens/teacher/HomeworkScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import BoardDetailScreen from "@/screens/common/BoardDetailScreen";
import NotificationsScreen from "@/screens/NotificationsScreen"; // [woo] 알림 목록 화면
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen"; // [woo] 알림 설정 화면
import NotificationBell from "@/components/NotificationBell"; // [woo] 헤더 알림 벨

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  홈: "🏠", 학급관리: "👥", 게시판: "📋", 과제: "📚", 내정보: "👤",
};

// [woo] 다크모드 적용을 위해 함수 컴포넌트로 분리
function TeacherTabs() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
            {TAB_ICONS[route.name] ?? "•"}
          </Text>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: "bold", fontSize: 17 },
      })}
    >
      <Tab.Screen name="홈" component={TeacherHomeScreen} options={{
        headerTitle: "SchoolMate",
        headerRight: () => <NotificationBell />, // [woo] 홈 헤더에 알림 벨
      }} />
      <Tab.Screen name="학급관리" component={ClassManagementScreen} options={{ headerTitle: "학급 관리" }} />
      <Tab.Screen name="게시판" component={TeacherBoardScreen} options={{ headerTitle: "게시판" }} />
      <Tab.Screen name="과제" component={TeacherHomeworkScreen} options={{ headerTitle: "과제 관리" }} />
      <Tab.Screen name="내정보" component={ProfileScreen} options={{ headerTitle: "내 정보" }} />
    </Tab.Navigator>
  );
}

export default function TeacherNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: true, headerTitle: "알림", headerBackTitle: "뒤로" }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: true, headerTitle: "알림 설정", headerBackTitle: "뒤로" }}
      />
      <Stack.Screen
        name="BoardDetail"
        component={BoardDetailScreen}
        options={{ headerShown: true, headerTitle: "상세 보기", headerBackTitle: "뒤로" }}
      />
    </Stack.Navigator>
  );
}
