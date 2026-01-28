# Backend Changes - Frontend Developer Guide

This document describes all new API endpoints, data models, and features added since the last commit.

---

## Table of Contents

1. [Test Analytics](#1-test-analytics)
2. [Comments System (YouTube-style)](#2-comments-system-youtube-style)
3. [SAT Scoring System](#3-sat-scoring-system)
4. [Math Reference Formulas](#4-math-reference-formulas)
5. [Enhanced Test Data Models](#5-enhanced-test-data-models)

---

## 1. Test Analytics

Track how many people viewed, attempted, and completed each test.

### New Fields on Test

```typescript
interface TestAnalytics {
  viewCount: number;        // Incremented when test details are fetched
  attemptCount: number;     // Incremented when a user starts a test
  completionCount: number;  // Incremented when a user submits a test
  totalScore: number;       // Sum of all completed scores (for average calculation)
  totalTimeSeconds: number; // Sum of all completion times (for average calculation)
}
```

### New Endpoint

#### `GET /tests/:id/analytics`

Returns analytics for a specific test.

**Response:**
```json
{
  "testId": "uuid",
  "title": "SAT Practice Test 1",
  "viewCount": 1250,
  "attemptCount": 340,
  "completionCount": 285,
  "completionRate": 84,
  "averageScore": 1120,
  "averageTimeMinutes": 134,
  "commentCount": 47
}
```

**Notes:**
- `viewCount` auto-increments when `GET /tests/:id` is called
- `attemptCount` auto-increments when `POST /practice/tests/:testId/start` is called
- `completionCount`, `totalScore`, and `totalTimeSeconds` update when test is submitted
- `averageScore` and `averageTimeMinutes` are calculated fields (null if no completions)

---

## 2. Comments System (YouTube-style)

Nested comment system allowing students to discuss tests after completion.

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/tests/:testId/comments` | No | Get top-level comments (paginated) |
| `POST` | `/tests/:testId/comments` | Yes | Create a top-level comment |
| `GET` | `/comments/:commentId/replies` | No | Get replies to a comment (paginated) |
| `POST` | `/comments/:commentId/replies` | Yes | Reply to a comment |
| `GET` | `/comments/:commentId/thread` | No | Get full nested thread |
| `PATCH` | `/comments/:commentId` | Yes | Edit your own comment |
| `DELETE` | `/comments/:commentId` | Yes | Delete comment (owner or admin) |

### Request/Response Examples

#### Get Comments
`GET /tests/:testId/comments?page=1&limit=20`

**Response:**
```json
{
  "data": [
    {
      "id": "comment-uuid",
      "content": "This test was challenging!",
      "isEdited": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user-uuid",
        "name": "John Doe"
      },
      "replyCount": 5
    }
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

#### Create Comment
`POST /tests/:testId/comments`

**Request:**
```json
{
  "content": "The math section was really tough!"
}
```

**Validation:**
- `content`: Required, 1-2000 characters

#### Reply to Comment
`POST /comments/:commentId/replies`

**Request:**
```json
{
  "content": "I agree! Question 15 was especially hard."
}
```

**Response includes `parentId`:**
```json
{
  "id": "reply-uuid",
  "content": "I agree! Question 15 was especially hard.",
  "parentId": "parent-comment-uuid",
  "user": { "id": "...", "name": "..." },
  "replyCount": 0
}
```

#### Get Full Thread
`GET /comments/:commentId/thread?maxDepth=10`

Returns nested structure with all replies (up to `maxDepth` levels, max 20).

```json
{
  "id": "comment-uuid",
  "content": "Original comment",
  "user": { "id": "...", "name": "..." },
  "replies": [
    {
      "id": "reply-1-uuid",
      "content": "First reply",
      "user": { "id": "...", "name": "..." },
      "replies": [
        {
          "id": "nested-reply-uuid",
          "content": "Reply to reply",
          "replies": []
        }
      ]
    }
  ]
}
```

#### Edit Comment
`PATCH /comments/:commentId`

**Request:**
```json
{
  "content": "Updated comment text"
}
```

Sets `isEdited: true` in response.

#### Delete Comment
`DELETE /comments/:commentId`

- Owner can delete their own comments
- Admins can delete any comment
- **Cascade deletes all replies**

**Response:**
```json
{
  "success": true,
  "message": "Comment and 3 replies deleted"
}
```

---

## 3. SAT Scoring System

Realistic Digital SAT scoring matching College Board methodology.

### Score Structure

```typescript
interface AttemptScores {
  totalScore: number;           // 400-1600 (sum of sections)
  readingWritingScore: number;  // 200-800
  mathScore: number;            // 200-800
}

interface SectionAttempt {
  scaledScore: number;    // 200-800 SAT scale
  rawScore: number;       // Number correct
  totalQuestions: number; // Total in section (54 RW, 44 Math)
}

interface ModuleAttempt {
  correctCount: number;
  totalCount: number;
  assignedDifficulty: 'EASY' | 'HARD';  // For Module 2
  moduleStartedAt: Date;
  moduleEndsAt: Date;
}
```

### Adaptive Testing Logic

1. **Module 1**: All students get the same difficulty (baseline)
2. **Module 2**: Difficulty determined by Module 1 performance
   - ~67%+ correct on Module 1 → Hard Module 2 (score range: 450-800)
   - Below ~67% → Easy Module 2 (score capped at ~610)

### Score Calculation

- **Difficulty weights**: EASY=0.6, MEDIUM=0.85, HARD=1.0
- **Module weights**: Module 1=40%, Module 2=60%
- **Non-linear curve**: Harder to achieve top scores (780+ requires ~98% correct)

### Endpoints

#### `GET /scoring/percentile/:score`
Get percentile rank for a total score.

```json
{
  "score": 1200,
  "percentile": 74
}
```

#### `POST /scoring/seed` (Admin)
Seed score conversion tables and percentile data.

---

## 4. Math Reference Formulas

SAT math reference sheet available during Math section.

### Endpoints

#### `GET /reference/math-formulas`
Get all formulas grouped by category.

**Response:**
```json
{
  "Area": [
    {
      "id": "uuid",
      "name": "Area of a Circle",
      "formula": "A = πr²",
      "description": "Where r is the radius",
      "imageUrl": null
    },
    {
      "id": "uuid",
      "name": "Area of a Rectangle",
      "formula": "A = lw",
      "description": "Where l is length and w is width"
    }
  ],
  "Volume": [...],
  "Triangles": [...],
  "Algebra": [...]
}
```

#### `GET /reference/math-formulas/:category`
Get formulas for a specific category.

#### `POST /reference/seed-formulas` (Admin)
Seed default SAT formulas.

---

## 5. Enhanced Test Data Models

### Answer Model Updates

```typescript
interface Answer {
  id: string;
  questionId: string;
  choiceId: string | null;      // For MCQ
  textAnswer: string | null;    // For student-produced (grid-in)
  markedForReview: boolean;     // NEW: Bookmark for later review
  eliminatedChoices: string[];  // NEW: Array of eliminated choice IDs
}
```

**Frontend Usage:**
- `markedForReview`: Show flag icon, allow quick navigation to flagged questions
- `eliminatedChoices`: Cross out choices user has eliminated (strikethrough UI)

### Highlight Model (Passage Annotations)

```typescript
interface Highlight {
  id: string;
  attemptId: string;
  questionId: string;
  startOffset: number;  // Character position start
  endOffset: number;    // Character position end
  color: 'YELLOW' | 'GREEN' | 'BLUE' | 'PINK' | 'ORANGE';
  note: string | null;  // Optional annotation
}
```

**Frontend Usage:**
- Allow students to highlight text in reading passages
- Highlights persist during the test attempt
- Display color picker (5 colors available)
- Optional note/annotation on highlight

### Shared Passages

Questions can now reference shared passages:

```typescript
interface Question {
  // ... existing fields
  passageId: string | null;       // Reference to shared passage
  sharedPassage: Passage | null;  // Included when fetched
}

interface Passage {
  id: string;
  title: string | null;
  content: string;
  source: string | null;  // Attribution
  wordCount: number | null;
}
```

**Note:** Multiple questions can share the same passage (common in Reading section).

---

## Migration Notes

### Database Changes Required

Run these commands after pulling:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

### Seed Data

After migration, run these to populate reference data:

```bash
# Via API (requires admin token):
POST /reference/seed-formulas
POST /scoring/seed
```

---

## Quick Reference: New Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/tests/:id/analytics` | GET | No | Test analytics |
| `/tests/:testId/comments` | GET | No | List comments |
| `/tests/:testId/comments` | POST | Yes | Create comment |
| `/comments/:id/replies` | GET | No | List replies |
| `/comments/:id/replies` | POST | Yes | Create reply |
| `/comments/:id/thread` | GET | No | Full thread |
| `/comments/:id` | PATCH | Yes | Edit comment |
| `/comments/:id` | DELETE | Yes | Delete comment |
| `/reference/math-formulas` | GET | No | All formulas |
| `/reference/math-formulas/:cat` | GET | No | Formulas by category |
| `/reference/seed-formulas` | POST | Admin | Seed formulas |
| `/scoring/seed` | POST | Admin | Seed scoring data |

---

## Questions?

Check Swagger docs at `/api` for full request/response schemas and try endpoints directly.
