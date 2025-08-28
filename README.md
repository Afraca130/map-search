# POI 관리 시스템

고급 데이터베이스 동기화, 데이터 검증 및 API 문서화 기능을 갖춘 현대적인 Node.js 기반 POI(관심 지점) 관리 애플리케이션입니다.

## 🚀 주요 기능

### Entity 동기화 시스템

-   **자동 데이터베이스 스키마 관리**: 커스텀 Entity 동기화 기능을 활용하여 데이터베이스 테이블 구조를 자동으로 생성하고 관리
-   **무중단 스키마 업데이트**: Entity 동기화를 통해 데이터베이스 스키마를 애플리케이션 모델과 항상 동기화 상태 유지
-   **데이터베이스 마이그레이션 지원**: 원활한 테이블 생성, 수정 및 인덱싱 작업

### 응답 규격 표준화

-   **일관된 응답 스키마**: `app/modules/func-common.js`의 `getReturnMessage`를 통해 API 응답을 표준화
-   **성공/오류 구분 명확화**: `statusCode`, `statusMessage`, `errorCode`, `errorMessage`, `resultData`, `resultCnt` 필드 제공

예시:

```json
{
    "statusCode": 200,
    "statusMessage": "2개의 POI 데이터를 조회했습니다.",
    "errorCode": null,
    "errorMessage": "",
    "resultData": [{ "id": 1, "title": "POI" }],
    "resultCnt": 2
}
```

### 포괄적인 API 문서화

-   **Swagger 통합**: Swagger UI를 통한 완전한 API 문서화
-   **대화형 테스팅**: `/api-docs`에서 제공하는 내장 API 테스팅 인터페이스
-   **스키마 검증**: 요청/응답 스키마 검증 및 문서화

### 테스트 주도 개발

-   **Jest 테스팅 프레임워크**: 포괄적인 단위 테스트 및 통합 테스트
-   **높은 코드 커버리지**: 컨트롤러, 엔티티, 모델에 대한 테스트
-   **모킹 지원**: 적절한 모킹 전략을 통한 격리된 단위 테스트

## 🛠 아키텍처 및 기술 스택

### 백엔드 기술

-   **Node.js** Express.js 프레임워크 기반
-   **PostgreSQL** 연결 풀링을 통한 데이터베이스
-   **Multer** 파일 업로드 처리
-   **XLSX** Excel 파일 처리

### DevOps 및 배포

-   **Docker** 멀티 스테이지 빌드를 통한 컨테이너화
-   **Docker Compose** 로컬 개발 환경
-   **Jest** 자동화된 테스팅

## 📁 프로젝트 구조

```
├── app/
│   ├── controllers/           # 요청 처리기
│   ├── entities/             # 데이터베이스 엔티티 정의
│   ├── models/               # 데이터베이스 상호작용 계층
│   ├── modules/              # 핵심 모듈 (DB, 유틸리티)
│   ├── routes/               # API 라우트 정의
│   └── views/                # EJS 템플릿
├── tests/                    # 테스트 스위트
├── public/                   # 정적 자산
├── docker-compose.yml        # 컨테이너 오케스트레이션
├── swagger.config.js         # API 문서 설정
└── jest.setup.js            # 테스트 구성
```

## 🔧 Entity 동기화 시스템

애플리케이션의 정교한 엔티티 동기화 시스템 특징:

-   **엔티티 정의 기반 데이터베이스 스키마 자동 관리**
-   **데이터 손실 없는 안전한 스키마 마이그레이션**
-   **쿼리 성능을 위한 최적화된 인덱스 생성**
-   **배포 전 엔티티 무결성 검증**

## 📊 API 문서화

`/api-docs`에서 제공하는 포괄적인 API 문서:

-   **대화형 API 탐색기**: 브라우저에서 직접 엔드포인트 테스트
-   **요청/응답 스키마**: 상세한 데이터 구조 문서
-   **인증 예제**: 샘플 요청 및 응답
-   **오류 처리 가이드**: 완전한 오류 코드 참조

## 🧪 테스팅 전략

포괄적인 테스트 커버리지 포함:

-   **단위 테스트**: 개별 컴포넌트 테스팅
-   **통합 테스트**: API 엔드포인트 테스팅
-   **모킹 테스트**: 격리된 컴포넌트 테스팅
-   **커버리지 리포트**: 상세한 커버리지 분석

```bash
# 전체 테스트 스위트 실행
npm test

# 커버리지 리포트 생성
npm run test:coverage

# 워치 모드로 테스트 실행
npm run test:watch
```

## 🐳 Docker 개발

Docker를 통한 빠른 시작:

```bash
# 모든 서비스 시작
docker-compose up --build

# 백그라운드에서 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

## 📈 성능 기능

-   **연결 풀링**: 최적화된 데이터베이스 연결
-   **쿼리 최적화**: 인덱스가 적용된 데이터베이스 쿼리
-   **캐싱 전략**: 효율적인 데이터 캐싱
-   **오류 처리**: 포괄적인 오류 관리
-   **로깅 시스템**: Winston을 통한 구조화된 JSON 로깅

## 🔒 보안 구현

-   **입력 검증**: 컨트롤러 단의 엄격한 검증 로직
-   **SQL 인젝션 방지**: 매개변수화된 쿼리
-   **파일 업로드 보안**: 제한된 파일 유형 및 크기
-   **오류 정보 노출 방지**: 정화된 오류 응답

## 🚦 빠른 시작

1. **클론 및 의존성 설치**:

    ```bash
    npm install
    ```

2. **Docker로 시작**:

    ```bash
    docker-compose up --build
    ```

3. **애플리케이션 접속**:

    - 애플리케이션: http://localhost:3535
    - API 문서: http://localhost:3535/api-docs

4. **테스트 실행**:

    ```bash
    npm test
    ```

## 📋 API 엔드포인트

| 엔드포인트          | 메소드 | 설명                           |
| ------------------- | ------ | ------------------------------ |
| `/api/upload-excel` | POST   | Excel을 통한 POI 데이터 업로드 |
| `/api/poi`          | GET    | 모든 POI 데이터 조회           |
| `/api/poi/search`   | GET    | 이름으로 POI 검색              |

---
# map-search
