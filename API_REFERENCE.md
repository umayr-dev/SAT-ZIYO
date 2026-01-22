# SAT Test System - API Reference

Quick reference guide for all available endpoints.

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints require JWT authentication unless specified.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Admin Endpoints

### Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tests` | Create new test with sections/modules |
| `GET` | `/tests` | Get all tests |
| `GET` | `/tests/:id` | Get test by ID (includes correct answers) |
| `PATCH` | `/tests/:id` | Update test |
| `DELETE` | `/tests/:id` | Soft delete test |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tests/modules/:moduleId/questions` | Add question to module |
| `PATCH` | `/tests/modules/:moduleId/questions/:questionId` | Update question |
| `DELETE` | `/tests/modules/:moduleId/questions/:questionId` | Delete question |

---

## Student Endpoints

### Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/practice/tests` | Get available tests |
| `GET` | `/practice/my-attempts` | Get user's attempt history |

### Test Flow

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/practice/start/:testId` | Start or resume test |
| `GET` | `/practice/attempts/:attemptId/current` | Get current question |
| `POST` | `/practice/attempts/:attemptId/answer` | Submit answer |
| `POST` | `/practice/attempts/:attemptId/next` | Navigate to next question |
| `POST` | `/practice/attempts/:attemptId/previous` | Navigate to previous question |
| `POST` | `/practice/attempts/:attemptId/goto/:index` | Jump to specific question |
| `GET` | `/practice/attempts/:attemptId/answers` | Get answered questions list |
| `POST` | `/practice/attempts/:attemptId/finish-module` | Finish current module |
| `GET` | `/practice/attempts/:attemptId/break-status` | Check break status |
| `POST` | `/practice/attempts/:attemptId/abandon` | Abandon attempt |
| `POST` | `/practice/attempts/:attemptId/submit` | Submit test for scoring |
| `GET` | `/practice/attempts/:attemptId/results` | Get test results |

---

## Request/Response Examples

### Start Test

**Request:**
```http
POST /practice/start/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "attemptId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "testTitle": "SAT Practice Test 1",
  "currentSection": {
    "id": "a1b2c3d4...",
    "type": "ENGLISH",
    "orderIndex": 0,
    "duration": 64,
    "allowCalculator": false
  },
  "currentModule": {
    "id": "e5f6g7h8...",
    "moduleNumber": 1,
    "duration": 32,
    "totalQuestions": 27
  },
  "currentQuestionIndex": 0,
  "question": {
    "id": "i9j0k1l2...",
    "questionText": "Which choice best maintains...",
    "orderIndex": 0,
    "choices": [
      {
        "id": "m3n4o5p6...",
        "choiceText": "Option A",
        "orderIndex": 0
      },
      {
        "id": "q7r8s9t0...",
        "choiceText": "Option B",
        "orderIndex": 1
      }
    ]
  },
  "breakStatus": "NOT_STARTED"
}
```

### Submit Answer

**Request:**
```http
POST /practice/attempts/7c9e6679-7425-40de-944b-e07fc1f90ae7/answer
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "questionId": "i9j0k1l2...",
  "choiceId": "q7r8s9t0..."
}
```

**Response:**
```json
{
  "success": true,
  "answeredAt": "2024-01-15T10:30:45.123Z"
}
```

### Finish Module

**Request:**
```http
POST /practice/attempts/7c9e6679-7425-40de-944b-e07fc1f90ae7/finish-module
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Starting Module 2):**
```json
{
  "message": "Module 1 completed. Starting Module 2.",
  "module1Score": 85,
  "module2Difficulty": "HARD",
  "nextStep": "MODULE_2"
}
```

**Response (Starting Break):**
```json
{
  "message": "Section completed. Break started.",
  "breakDuration": 10,
  "breakEndsAt": "2024-01-15T10:40:00.000Z",
  "nextStep": "BREAK"
}
```

### Check Break Status

**Request:**
```http
GET /practice/attempts/7c9e6679-7425-40de-944b-e07fc1f90ae7/break-status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (During Break):**
```json
{
  "breakStatus": "IN_PROGRESS",
  "breakEndsAt": "2024-01-15T10:40:00.000Z",
  "remainingSeconds": 420,
  "message": "Break is still in progress"
}
```

**Response (Break Complete):**
```json
{
  "message": "Starting MATH section",
  "nextStep": "NEW_SECTION",
  "section": {
    "id": "u1v2w3x4...",
    "type": "MATH",
    "allowCalculator": true
  }
}
```

### Submit Test

**Request:**
```http
POST /practice/attempts/7c9e6679-7425-40de-944b-e07fc1f90ae7/submit
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "totalScore": 85,
  "totalQuestions": 98,
  "correctAnswers": 83,
  "wrongAnswers": 15,
  "completedAt": "2024-01-15T11:00:00.000Z",
  "sections": [
    {
      "sectionType": "ENGLISH",
      "score": 88,
      "modules": [
        {
          "moduleNumber": 1,
          "difficulty": "EASY",
          "score": 90,
          "correctCount": 24,
          "totalCount": 27,
          "questions": [
            {
              "questionId": "...",
              "questionText": "...",
              "difficulty": "EASY",
              "userChoiceId": "...",
              "correctChoiceId": "...",
              "isCorrect": true,
              "choices": [...]
            }
          ]
        },
        {
          "moduleNumber": 2,
          "difficulty": "HARD",
          "score": 86,
          "correctCount": 23,
          "totalCount": 27,
          "questions": [...]
        }
      ]
    },
    {
      "sectionType": "MATH",
      "score": 82,
      "modules": [...]
    }
  ]
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## Enums

### SectionType
```typescript
'ENGLISH' | 'MATH'
```

### ModuleDifficulty
```typescript
'EASY' | 'HARD'
```

### QuestionDifficulty
```typescript
'EASY' | 'MEDIUM' | 'HARD'
```

### AttemptStatus
```typescript
'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
```

### BreakStatus
```typescript
'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
```

---

## Rate Limits

- Global: 100 requests/minute
- Auth endpoints: 10 requests/minute

---

## Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "SAT Test System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"student@example.com\",\"password\":\"password123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Practice",
      "item": [
        {
          "name": "Get Available Tests",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/practice/tests",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Start Test",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/practice/start/{{testId}}",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": ""
    },
    {
      "key": "testId",
      "value": ""
    },
    {
      "key": "attemptId",
      "value": ""
    }
  ]
}
```

---

**Last Updated**: January 15, 2024
