// package com.example.schoolmate.board.repository;

// import java.util.List;

// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;

// import com.example.schoolmate.board.entity.BoardCategory;

// // extends JpaRepository<BoardCategory, Long> BoardCategory의 entity를 대상으로하고 ,
// 선언된 Id의 타입으로 상속받는다
// public class BoardCategoryRepository extends JpaRepository<BoardCategory,
// Long> {

// // JPA 쿼리 만들기 위해 ClassroomId 중 is 활성화된 상태인 boardCategory 들을 오름차순으로 정렬 후
// List<>로 반환
// List<BoardCategory>
// findByClassroomCidAndIsActiveTrueOrderByDisplayOrderAsc(Long classroomId);

// // classroo
// boolean existByClassroomCidAndName(Long classroomId, String name);

// @Query("SELECT COALESCE(MAX(c.displayOrder), 0) FROM BoardCategory c WHERE
// c.classroom.cid = :classroomId")
// int findMaxDisplayOrder(@Param("classroomId") Long classroomId);
// }
