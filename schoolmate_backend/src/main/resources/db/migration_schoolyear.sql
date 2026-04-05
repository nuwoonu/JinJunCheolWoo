-- =====================================================================
-- SchoolYear 마이그레이션 스크립트
-- 기존 int 타입 school_year/year 컬럼 데이터를 school_year 테이블 FK로 이전
--
-- 실행 순서:
-- 1. school_year 레코드 생성 (academic_term 기준)
-- 2. academic_term.school_year_id FK 채우기
-- 3. classroom.school_year_id FK 채우기 (classroom.year 컬럼 기준)
-- 4. student_assignment.school_year_id FK 채우기
-- 5. teacher_student.school_year_id FK 채우기
-- =====================================================================

-- ── Step 1: academic_term 기준으로 school_year 레코드 생성 ──────────────
-- ACTIVE 학기의 학년도 → CURRENT, CLOSED 학기의 학년도 → PAST
-- 같은 학교·학년도는 중복 생성 방지 (INSERT IGNORE)

INSERT IGNORE INTO school_year (school_id, year, status, create_date, update_date)
SELECT DISTINCT
    at.school_id,
    at.school_year,
    CASE
        WHEN at.status = 'ACTIVE' THEN 'CURRENT'
        ELSE 'PAST'
    END,
    NOW(),
    NOW()
FROM academic_term at
WHERE at.school_id IS NOT NULL
  AND at.school_year_id IS NULL;

-- 같은 school_id + year가 ACTIVE와 CLOSED 모두 있으면 CURRENT로 업데이트
UPDATE school_year sy
JOIN academic_term at ON at.school_id = sy.school_id AND at.school_year = sy.year
SET sy.status = 'CURRENT'
WHERE at.status = 'ACTIVE';

-- ── Step 2: academic_term.school_year_id FK 채우기 ──────────────────────
UPDATE academic_term at
JOIN school_year sy ON sy.school_id = at.school_id AND sy.year = at.school_year
SET at.school_year_id = sy.id
WHERE at.school_year_id IS NULL;

-- ── Step 3: classroom.school_year_id FK 채우기 ────────────────────────
-- classroom.year 컬럼(int)으로 매핑
-- classroom에 school_year 없으면 생성 (PAST 상태)

INSERT IGNORE INTO school_year (school_id, year, status, create_date, update_date)
SELECT DISTINCT
    c.school_id,
    c.year,
    'PAST',
    NOW(),
    NOW()
FROM classroom c
WHERE c.school_id IS NOT NULL
  AND c.school_year_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_year sy
      WHERE sy.school_id = c.school_id AND sy.year = c.year
  );

UPDATE classroom c
JOIN school_year sy ON sy.school_id = c.school_id AND sy.year = c.year
SET c.school_year_id = sy.id
WHERE c.school_year_id IS NULL;

-- ── Step 4: student_assignment.school_year_id FK 채우기 ──────────────────
-- student_assignment.school_year (int 컬럼) 기준

INSERT IGNORE INTO school_year (school_id, year, status, create_date, update_date)
SELECT DISTINCT
    sa.school_id,
    sa.school_year,
    'PAST',
    NOW(),
    NOW()
FROM student_assignment sa
WHERE sa.school_id IS NOT NULL
  AND sa.school_year_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_year sy
      WHERE sy.school_id = sa.school_id AND sy.year = sa.school_year
  );

UPDATE student_assignment sa
JOIN school_year sy ON sy.school_id = sa.school_id AND sy.year = sa.school_year
SET sa.school_year_id = sy.id
WHERE sa.school_year_id IS NULL;

-- ── Step 5: teacher_student.school_year_id FK 채우기 ─────────────────────
-- teacher_student.school_year (int 컬럼) 기준

INSERT IGNORE INTO school_year (school_id, year, status, create_date, update_date)
SELECT DISTINCT
    ts.school_id,
    ts.school_year,
    'PAST',
    NOW(),
    NOW()
FROM teacher_student ts
WHERE ts.school_id IS NOT NULL
  AND ts.school_year_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM school_year sy
      WHERE sy.school_id = ts.school_id AND sy.year = ts.school_year
  );

UPDATE teacher_student ts
JOIN school_year sy ON sy.school_id = ts.school_id AND sy.year = ts.school_year
SET ts.school_year_id = sy.id
WHERE ts.school_year_id IS NULL;

-- ── 결과 확인용 쿼리 (실행 후 확인) ────────────────────────────────────────
-- SELECT * FROM school_year ORDER BY school_id, year;
-- SELECT id, school_year, school_year_id, semester, status FROM academic_term;
-- SELECT cid, year, school_year_id, grade, class_num FROM classroom LIMIT 10;
-- SELECT id, school_year, school_year_id FROM student_assignment LIMIT 10;
