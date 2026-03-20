package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.common.entity.user.constant.RoomType;

public interface DormitoryRepository extends JpaRepository<Dormitory, Long> {

    // 특정 위치의 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.building = :building AND d.floor = :floor AND d.roomNumber = :roomNumber AND d.bedNumber = :bedNumber")
    Optional<Dormitory> findByLocation(
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomNumber") String roomNumber,
            @Param("bedNumber") String bedNumber);

    // 특정 건물의 모든 방 조회
    List<Dormitory> findByBuildingOrderByFloorDescRoomNumberAscBedNumberAsc(String building);

    // 특정 건물, 층의 모든 방 조회
    List<Dormitory> findByBuildingAndFloorOrderByRoomNumberAscBedNumberAsc(String building, Integer floor);

    // 특정 호실의 모든 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.building = :building AND d.floor = :floor AND d.roomNumber = :roomNumber ORDER BY d.bedNumber")
    List<Dormitory> findByRoom(
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomNumber") String roomNumber);

    // 특정 호실의 모든 침대 + 학생 Fetch Join 조회 (같은 방 학생 표시용)
    @Query("SELECT d FROM Dormitory d LEFT JOIN FETCH d.students s LEFT JOIN FETCH s.user WHERE d.building = :building AND d.floor = :floor AND d.roomNumber = :roomNumber ORDER BY d.bedNumber")
    List<Dormitory> findByRoomWithStudents(
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomNumber") String roomNumber);

    // 빈 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.students IS EMPTY ORDER BY d.building, d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findEmptyBeds();

    // 특정 건물의 빈 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.building = :building AND d.students IS EMPTY ORDER BY d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findEmptyBedsByBuilding(@Param("building") String building);

    // 특정 방 타입의 빈 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.roomType = :roomType AND d.students IS EMPTY ORDER BY d.building, d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findEmptyBedsByRoomType(@Param("roomType") RoomType roomType);

    // 학생과 함께 조회 (Fetch Join)
    @Query("SELECT d FROM Dormitory d LEFT JOIN FETCH d.students WHERE d.building = :building ORDER BY d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findByBuildingWithStudents(@Param("building") String building);

    // cheol: 건물별 통계 (건물명, 전체침대수, 점유침대수, 최고층)
    @Query("SELECT d.building, COUNT(d), SUM(CASE WHEN SIZE(d.students) > 0 THEN 1 ELSE 0 END), MAX(d.floor) FROM Dormitory d GROUP BY d.building ORDER BY d.building")
    List<Object[]> findBuildingSummaries();

    // cheol: 학생 이름으로 해당 학생이 배정된 건물 목록 검색
    @Query("SELECT DISTINCT d.building FROM Dormitory d JOIN d.students s JOIN s.user u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<String> findBuildingsByStudentName(@Param("name") String name);
}