// [woo] 홈 화면 - 역할별 대시보드 분기
import React from "react";
import { useAuth } from "@/context/AuthContext";
import StudentDashboard from "@/screens/dashboard/StudentDashboard";
import TeacherDashboard from "@/screens/dashboard/TeacherDashboard";
import ParentDashboard from "@/screens/dashboard/ParentDashboard";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "@/hooks/useTheme"; // [woo] 다크모드

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme(); // [woo] 다크모드 색상
  const styles = makeStyles(colors); // [woo]

  switch (user?.role) {
    case "STUDENT":
      return <StudentDashboard />;
    case "TEACHER":
      return <TeacherDashboard />;
    case "PARENT":
      return <ParentDashboard />;
    default:
      return (
        <View style={styles.container}>
          <Text style={styles.text}>대시보드를 불러올 수 없습니다.</Text>
        </View>
      );
  }
}

// [woo] makeStyles: 다크/라이트 모드 색상 반영
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  text: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
