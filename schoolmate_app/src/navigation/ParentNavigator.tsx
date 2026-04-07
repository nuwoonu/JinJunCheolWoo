// [woo] 학부모 탭 네비게이터
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme"; // [woo] 다크모드

import ParentHomeScreen from "@/screens/parent/HomeScreen";
import ChildrenAttendanceScreen from "@/screens/parent/ChildrenScreen";
import ParentBoardScreen from "@/screens/parent/BoardScreen";
import ConsultationScreen from "@/screens/parent/ConsultationScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import BoardDetailScreen from "@/screens/common/BoardDetailScreen";
import ChildDetailScreen from "@/screens/parent/ChildDetailScreen";
import GradeScreen from "@/screens/parent/GradeScreen"; // [woo] 자녀 성적 화면
import NotificationsScreen from "@/screens/NotificationsScreen"; // [woo] 알림 목록 화면
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen"; // [woo] 알림 설정 화면
import NotificationBell from "@/components/NotificationBell"; // [woo] 헤더 알림 벨

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator(); // [woo] 홈 탭 전용 스택

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { default: IoniconsName; focused: IoniconsName }> = {
  홈:      { default: "home-outline",          focused: "home" },
  게시판:  { default: "newspaper-outline",      focused: "newspaper" },
  상담:    { default: "chatbubble-outline",     focused: "chatbubble" },
  내정보:  { default: "person-outline",         focused: "person" },
};

// [woo] 홈 탭 전용 스택 — 탭바가 유지된 채로 자녀 성적/출결에 진입
function HomeStackNavigator() {
  const { colors } = useTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: "bold", fontSize: 17 },
      }}
    >
      <HomeStack.Screen
        name="ParentHome"
        component={ParentHomeScreen}
        options={{
          headerTitle: "SchoolMate",
          headerRight: () => <NotificationBell />,
        }}
      />
      <HomeStack.Screen
        name="ChildAttendance"
        component={ChildrenAttendanceScreen}
        options={{ headerTitle: "자녀 출결 현황", headerBackTitle: "뒤로" }}
      />
      <HomeStack.Screen
        name="ChildGrades"
        component={GradeScreen}
        options={{ headerTitle: "자녀 성적", headerBackTitle: "뒤로" }}
      />
      <HomeStack.Screen
        name="ChildDetail"
        component={ChildDetailScreen}
        options={({ route }: any) => ({
          headerTitle: route.params?.childName ?? "자녀 현황",
          headerBackTitle: "뒤로",
        })}
      />
      {/* [woo] 바로가기에서 진입 시 탭 전환 대신 스택 push → 뒤로가기 노출 */}
      <HomeStack.Screen
        name="게시판"
        component={ParentBoardScreen}
        options={{ headerTitle: "게시판", headerBackTitle: "뒤로" }}
      />
      <HomeStack.Screen
        name="상담"
        component={ConsultationScreen}
        options={{ headerTitle: "상담 예약", headerBackTitle: "뒤로" }}
      />
    </HomeStack.Navigator>
  );
}

// [woo] 다크모드 적용을 위해 함수 컴포넌트로 분리
function ParentTabs() {
  const { colors } = useTheme(); // [woo] 다크모드 색상
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={icons ? (focused ? icons.focused : icons.default) : "ellipse-outline"}
              size={22}
              color={color}
            />
          );
        },
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
        headerShown: false, // [woo] 각 탭 스크린의 헤더는 내부 스택/컴포넌트에서 관리
      })}
    >
      {/* [woo] 홈은 내부 스택으로 — 자녀 성적/출결 진입 시 탭바 유지 */}
      <Tab.Screen name="홈" component={HomeStackNavigator} />
      <Tab.Screen
        name="게시판"
        component={ParentBoardScreen}
        options={{
          headerShown: true,
          headerTitle: "게시판",
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: "bold", fontSize: 17 },
        }}
      />
      <Tab.Screen
        name="상담"
        component={ConsultationScreen}
        options={{
          headerShown: true,
          headerTitle: "상담 예약",
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: "bold", fontSize: 17 },
        }}
      />
      <Tab.Screen
        name="내정보"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: "내 정보",
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.headerText,
          headerTitleStyle: { fontWeight: "bold", fontSize: 17 },
        }}
      />
    </Tab.Navigator>
  );
}

export default function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParentTabs" component={ParentTabs} />
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
