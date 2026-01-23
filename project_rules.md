# Schoolmate Project Guidelines & Context

이 문서는 **Schoolmate 학사 관리 시스템** 프로젝트의 구조, 개발 규칙 및 AI 에이전트의 행동 지침을 정의합니다.

## 1. 핵심 행동 수칙 (Critical Rules)

다음 규칙은 모든 답변과 코드 생성 시 최우선으로 적용됩니다.

1.  **코드 생성 제한 (가장 중요)**
    - 사용자가 명시적으로 "코드를 작성해줘", "구현해줘", "수정해줘"라고 요청하기 전까지는 **절대로 코드를 생성하거나 수정하지 않습니다.**
    - 질문에 대한 답변은 구조 설명, 로직 분석, 파일 위치 안내 등으로 제한하며 불필요한 토큰 낭비를 방지합니다.

2.  **단일 책임 원칙 (SRP) 준수**
    - 모든 코드는 **1개의 기능에 1개의 객체(클래스) 혹은 함수**를 유지하는 것을 원칙으로 합니다.
    - 메서드가 너무 길어지거나 여러 기능을 수행할 경우, 반드시 헬퍼 메서드나 별도의 서비스 로직으로 분리합니다.

3.  **Frontend 분리 (No Inline JS)**
    - HTML(Thymeleaf) 파일 내부에 `<script>` 태그를 사용하여 로직을 직접 작성하는 것을 금지합니다.
    - 모든 자바스크립트 로직은 `/src/main/resources/static/assets/js/` 경로 하위에 별도 파일로 생성하고, HTML에서는 이를 불러오는 방식(`src="..."`)으로만 작성합니다.

4.  **상속을 통한 구조화 (DRY & Inheritance)**
    - 비슷한 기능이나 필드 구조가 반복될 경우, 복사-붙여넣기 대신 **상속(Inheritance)** 관계를 통해 구조를 변경합니다.
    - _예시:_ 공통 필드는 `BaseEntity`, 사용자 정보는 `BaseInfo`를 상속받아 구현합니다.

---

## 2. 프로젝트 구조 요약 (Architecture Summary)

이 프로젝트는 Spring Boot 기반의 학사 관리 시스템입니다.

### 2.1. 사용자 및 정보 모델링 (User & Info Separation)

이 프로젝트의 가장 큰 특징은 **계정(User)**과 **신상 정보(Info)**의 분리입니다.

- **User (`com.example.schoolmate.common.entity.user.User`)**
  - 로그인, 인증, 권한(`Role`)을 담당하는 핵심 엔티티입니다.
  - `uid`, `email`, `password`, `roles` 등을 관리합니다.
  - `infos` 리스트를 통해 여러 개의 신상 정보와 연결될 수 있습니다.

- **BaseInfo (`com.example.schoolmate.common.entity.info.BaseInfo`)**
  - 사용자의 구체적인 역할별 정보의 부모 클래스입니다. `User`와 N:1 관계를 맺습니다.
  - **하위 구현체:**
    - `StudentInfo`: 학번, 학적 상태(`StudentStatus`), 가족 관계(`FamilyRelation`), 학적 이력(`StudentAssignment`) 포함.
    - `ParentInfo`: 자녀 관계, 학부모 상태(`ParentStatus`) 포함.
    - `TeacherInfo`: 과목, 부서, 직책 포함.
    - `StaffInfo`: 행정 직원 정보.

### 2.2. 주요 디렉토리 구조

- `common`: 프로젝트 전반에서 공통으로 사용하는 엔티티, 리포지토리, DTO.
- `parkjoon`: 관리자 기능 및 특정 모듈(교실 배정 등)을 담당하는 서브 패키지. (추후 삭제 후 경로 통합 예정)
- `config`: Security, MVC 설정 등.
- `static/assets/js`: 프론트엔드 로직 (기능별로 폴더링 권장).

### 2.3. 보안 (Security)

- Spring Security를 사용하며, `UserRole` Enum(`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`)을 통해 접근 제어를 수행합니다.
- `SecurityConfig`에서 URL별 권한을 관리합니다.

---

## 3. 개발 가이드라인

- **Entity 수정:** 엔티티에 비즈니스 로직(예: `canAccessService()`, `update()`)을 포함하여 도메인 주도 설계를 지향합니다.
- **Repository:** 복잡한 검색 쿼리는 `QueryDSL` 또는 `CustomRepository` 패턴(예: `UserRepositoryImpl`)을 사용하여 구현합니다.
- **Controller:** 뷰 반환과 데이터 반환(API)을 명확히 구분합니다.
