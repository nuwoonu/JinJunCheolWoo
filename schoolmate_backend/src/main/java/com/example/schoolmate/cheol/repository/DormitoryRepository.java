package com.example.schoolmate.cheol.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.cheol.entity.Dormitory;
import com.example.schoolmate.common.entity.user.constant.RoomType;

public interface DormitoryRepository extends JpaRepository<Dormitory, Long> {

    // 특정 위치의 침대 조회 (schoolId 필터)
    @Query("SELECT d FROM Dormitory d WHERE d.school.id = :schoolId AND d.building = :building AND d.floor = :floor AND d.roomNumber = :roomNumber AND d.bedNumber = :bedNumber")
    Optional<Dormitory> findByLocation(
            @Param("schoolId") Long schoolId,
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomNumber") String roomNumber,
            @Param("bedNumber") String bedNumber);

    // 특정 건물의 모든 방 조회 (schoolId 필터)
    List<Dormitory> findBySchool_IdAndBuildingOrderByFloorDescRoomNumberAscBedNumberAsc(Long schoolId, String building);

    // 특정 건물, 층의 모든 방 조회 (schoolId 필터)
    List<Dormitory> findBySchool_IdAndBuildingAndFloorOrderByRoomNumberAscBedNumberAsc(Long schoolId, String building, Integer floor);

    // 특정 호실의 모든 침대 조회 (schoolId 필터)
    @Query("SELECT d FROM Dormitory d WHERE d.school.id = :schoolId AND d.building = :building AND d.floor = :floor AND d.roomNumber = :roomNumber ORDER BY d.bedNumber")
    List<Dormitory> findByRoom(
            @Param("schoolId") Long schoolId,
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomNumber") String roomNumber);

    // 특정 호실의 모든 침대 + 현재 학기 배정 학생 Fetch Join 조회
    @Query("SELECT DISTINCT d FROM Dormitory d " +
           "LEFT JOIN FETCH d.dormitoryAssignments da " +
           "LEFT JOIN FETCH da.studentInfo si " +
           "LEFT JOIN FETCH si.user " +
           "LEFT JOIN da.academicTerm t ON t.status = 'ACTIVE' " +
           "WHERE d.building = :building AND d.floor = :floor AND d.roomNumber = :roomNumber " +
           "ORDER BY d.bedNumber")
    List<Dormitory> findByRoomWithStudents(
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomNumber") String roomNumber);

    // 현재 학기 기준 빈 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE NOT EXISTS (" +
           "SELECT da FROM DormitoryAssignment da JOIN da.academicTerm t " +
           "WHERE da.dormitory = d AND t.status = 'ACTIVE') " +
           "ORDER BY d.building, d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findEmptyBeds();

    // 특정 건물의 현재 학기 기준 빈 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.building = :building AND NOT EXISTS (" +
           "SELECT da FROM DormitoryAssignment da JOIN da.academicTerm t " +
           "WHERE da.dormitory = d AND t.status = 'ACTIVE') " +
           "ORDER BY d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findEmptyBedsByBuilding(@Param("building") String building);

    // 특정 방 타입의 현재 학기 기준 빈 침대 조회
    @Query("SELECT d FROM Dormitory d WHERE d.roomType = :roomType AND NOT EXISTS (" +
           "SELECT da FROM DormitoryAssignment da JOIN da.academicTerm t " +
           "WHERE da.dormitory = d AND t.status = 'ACTIVE') " +
           "ORDER BY d.building, d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findEmptyBedsByRoomType(@Param("roomType") RoomType roomType);

    // 학생과 함께 조회 (현재 학기)
    @Query("SELECT DISTINCT d FROM Dormitory d " +
           "LEFT JOIN FETCH d.dormitoryAssignments da " +
           "LEFT JOIN FETCH da.studentInfo si " +
           "LEFT JOIN FETCH si.user " +
           "LEFT JOIN da.academicTerm t ON t.status = 'ACTIVE' " +
           "WHERE d.building = :building " +
           "ORDER BY d.floor DESC, d.roomNumber, d.bedNumber")
    List<Dormitory> findByBuildingWithStudents(@Param("building") String building);

    // 건물별 통계 (현재 학기 기준)
    @Query("SELECT d.building, COUNT(d), " +
           "SUM(CASE WHEN EXISTS (SELECT da FROM DormitoryAssignment da JOIN da.academicTerm t WHERE da.dormitory = d AND t.status = 'ACTIVE') THEN 1 ELSE 0 END), " +
           "MAX(d.floor) FROM Dormitory d GROUP BY d.building ORDER BY d.building")
    List<Object[]> findBuildingSummaries();

    // 학생 이름으로 해당 학생이 배정된 건물 목록 검색 (현재 학기)
    @Query("SELECT DISTINCT d.building FROM Dormitory d " +
           "JOIN d.dormitoryAssignments da JOIN da.studentInfo si JOIN si.user u JOIN da.academicTerm t " +
           "WHERE t.status = 'ACTIVE' AND LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<String> findBuildingsByStudentName(@Param("name") String name);

    // 건물명 일괄 변경 — 벌크 JPQL (schoolId 필터, 1차 캐시 자동 초기화)
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Dormitory d SET d.building = :newName WHERE d.building = :oldName AND d.school.id = :schoolId")
    void updateBuildingName(@Param("oldName") String oldName, @Param("newName") String newName, @Param("schoolId") Long schoolId);
}
