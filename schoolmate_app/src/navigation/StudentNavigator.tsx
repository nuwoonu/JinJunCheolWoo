// [woo] 학생 탭 네비게이터
import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme"; // [woo] 다크모드

import StudentHomeScreen from "@/screens/student/HomeScreen";
import LearningScreen from "@/screens/student/LearningScreen";
import StudentBoardScreen from "@/screens/student/BoardScreen";
import StudentAttendanceScreen from "@/screens/student/AttendanceScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import BoardDetailScreen from "@/screens/common/BoardDetailScreen";
import NotificationsScreen from "@/screens/NotificationsScreen"; // [woo] 알림 목록 화면
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen"; // [woo] 알림 설정 화면
import NotificationBell from "@/components/NotificationBell"; // [woo] 헤더 알림 벨

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, string> = {
  홈: "🏠", 학습: "📚", 게시판: "📋", 출결: "✅", 내정보: "👤",
};

// [woo] 다크모드 적용을 위해 함수 컴포넌트로 분리
function StudentTabs() {
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
      <Tab.Screen name="홈" component={StudentHomeScreen} options={{
        headerTitle: "SchoolMate",
        headerRight: () => <NotificationBell />, // [woo] 홈 헤더에 알림 벨
      }} />
      <Tab.Screen name="학습" component={LearningScreen} options={{ headerTitle: "학습" }} />
      <Tab.Screen name="게시판" component={StudentBoardScreen} options={{ headerTitle: "게시판" }} />
      <Tab.Screen name="출결" component={StudentAttendanceScreen} options={{ headerTitle: "내 출결" }} />
      <Tab.Screen name="내정보" component={ProfileScreen} options={{ headerTitle: "내 정보" }} />
    </Tab.Navigator>
  );
}

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
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
