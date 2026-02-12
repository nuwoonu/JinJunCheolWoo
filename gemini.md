# Gemini Code Assist Rules for Schoolmate Project

이 문서는 Schoolmate 프로젝트의 아키텍처, 코딩 컨벤션 및 AI 에이전트 행동 지침을 정의합니다.
코드 생성 및 리팩토링 시 이 규칙을 최우선으로 준수해야 합니다.

## 1. 프로젝트 아키텍처 및 핵심 규칙

### 1.1. 사용자 모델링 (User vs Info 분리) **[중요]**

이 프로젝트는 인증 계정과 도메인별 신상 정보를 엄격히 분리합니다.

- **User (`com.example.schoolmate.common.entity.user.User`)**: 로그인, 권한(`Role`), 기본 정보(이름, 이메일, 비밀번호)만 관리합니다.
- **Info (`...entity.info.*`)**: 사용자의 역할별 상세 정보는 별도 엔티티로 관리하며 `User`와 N:1 또는 1:1 관계를 맺습니다.
  - 학생: `StudentInfo` (학번, 학적 상태, `StudentAssignment` 등)
  - 교사: `TeacherInfo` (담당 과목, 부서, 직책 등)
  - 학부모: `ParentInfo` (자녀 관계 등)
  - 교직원: `StaffInfo`
- **규칙**: `User` 엔티티에 도메인별 필드(예: 학년, 반, 담당 과목)를 직접 추가하지 말고, 반드시 해당 `Info` 엔티티를 통해 관리해야 합니다.

### 1.2. 계층 구조 (Layered Architecture)

- **Controller**: 요청 검증 및 서비스 호출, View/DTO 반환만 담당합니다. 비즈니스 로직을 포함하지 않습니다.
- **Service**: `@Transactional` 기반으로 비즈니스 로직을 수행합니다. Entity <-> DTO 변환은 주로 여기서 수행하거나 DTO 내부 메서드를 활용합니다.
- **Repository**: JPA를 기본으로 하며, 복잡한 동적 쿼리는 QueryDSL 또는 `Specification`을 사용하지 않고 직접 구현된 커스텀 로직을 따릅니다(현재 코드 베이스 기준).

## 2. 코딩 컨벤션 (Java & Spring Boot)

### 2.1. DTO (Data Transfer Object) 전략

- **Inner Static Class 활용**: 관련된 DTO는 하나의 클래스 내부에 정적 클래스로 그룹화합니다.
  - 예: `StudentDTO.CreateRequest`, `StudentDTO.Response`, `StudentDTO.SearchCondition`
- **Entity 노출 금지**: Controller는 절대로 Entity를 직접 반환하거나 파라미터로 받지 않습니다. 반드시 DTO를 사용합니다.

### 2.2. Lombok 및 DI 활용

- **생성자 주입**: `@Autowired` 대신 `@RequiredArgsConstructor`와 `final` 필드를 사용하여 의존성을 주입합니다.
- **Builder 패턴**: 객체 생성 시 생성자 대신 `@Builder` 패턴을 적극 활용합니다.
- **Logging**: `@Log4j2`를 사용하여 로깅합니다. (`System.out.println` 사용 금지)

### 2.3. 트랜잭션 관리

- 클래스 레벨에 `@Transactional(readOnly = true)`를 적용하여 조회 성능을 최적화합니다.
- 데이터 변경(CUD)이 필요한 메서드에만 `@Transactional`을 별도로 명시합니다.

### 2.4. 메서드 및 변수 명명

- **Service 메서드**: 행위를 명확히 나타내는 동사로 시작합니다 (`create...`, `update...`, `get...`, `delete...`).
- **Boolean 반환**: `is...`, `has...`, `exists...` 접두사를 사용합니다.

### 2.5. 주석 작성

- **설명 주석 필수**: 함수, 기능을 구현할 때 설명 주석을 반드시 포함합니다.

## 3. 프론트엔드 규칙 (Thymeleaf & JS)

### 3.1. JavaScript 분리 **[중요]**

- HTML 파일(`src/main/resources/templates/**/*.html`) 내부에 `<script>` 태그로 로직을 작성하지 않습니다.
- 모든 JS 로직은 `src/main/resources/static/assets/js/` 경로에 별도 파일로 분리하고 HTML에서 import 합니다.

### 3.2. 데이터 통신

- 폼 전송 외의 비동기 통신은 `fetch` API를 사용합니다.
- CSRF 토큰 처리를 위해 `<meta name="_csrf">` 태그 값을 헤더에 포함해야 합니다.

## 4. AI 에이전트 행동 지침

1.  **코드 생성 제한**: 사용자가 명시적으로 코드를 요청하기 전까지는 설명 위주로 답변합니다.
2.  **기존 코드 존중**: 기존에 작성된 유틸리티 클래스나 공통 로직이 있다면 중복 구현하지 않고 재사용합니다.
3.  **한국어 답변**: 모든 설명과 주석은 한국어로 작성합니다.
4.  **단일 책임 원칙**: 메서드가 너무 길어지면(20~30라인 이상), `private` 메서드로 로직을 분리할 것을 제안합니다.
5.  **공통 로직 분리**: 유사한 로직이 여러 곳에서 중복되거나, 별도의 클래스로 관리하는 것이 구조적으로 더 나은 경우(예: 파일 업로드, 유틸리티 등), 적극적으로 별도 클래스(Service/Component)로 분리하여 구현할 것을 제안합니다.

## 5. 주요 파일 경로 참고

- 공통 엔티티: `src/main/java/com/example/schoolmate/common/entity`
- 공통 서비스: `src/main/java/com/example/schoolmate/common/service`
- 프론트엔드 스크립트: `src/main/resources/static/assets/js`

---

### 예시: 학생 생성 로직 패턴

```java
// Service Layer Pattern
@Transactional
public Long createStudent(StudentDTO.CreateRequest request) {
    // 1. User 생성 (Auth)
    User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .roles(Set.of(UserRole.STUDENT))
            .build();

    // 2. StudentInfo 생성 (Domain)
    StudentInfo info = StudentInfo.builder()
            .user(user)
            .code(request.getCode())
            .build();

    // ... 연관관계 설정 및 저장
}
```
