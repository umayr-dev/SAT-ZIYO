/**
 * Shape accepted by the external practice /answer and /answers/batch APIs.
 *
 * This is a WHITELIST, not a stripper: the backend runs
 * ValidationPipe({ forbidNonWhitelisted: true }), so any property it does not
 * declare fails the entire request with 400 "property X should not exist".
 * Keep in sync with SubmitAnswerDto / BatchAnswerItemDto on the backend.
 */
export type BackendAnswerPayload = {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
};

export function toBackendAnswerPayload(answer: {
  questionId: string;
  choiceId?: string;
  textAnswer?: string;
  markedForReview?: boolean;
  eliminatedChoices?: string[];
}): BackendAnswerPayload {
  const body: BackendAnswerPayload = {
    questionId: String(answer.questionId),
  };
  if (answer.choiceId != null && String(answer.choiceId).trim() !== "") {
    body.choiceId = String(answer.choiceId);
  }
  if (answer.textAnswer !== undefined && answer.textAnswer !== null) {
    body.textAnswer = String(answer.textAnswer);
  }
  if (typeof answer.markedForReview === "boolean") {
    body.markedForReview = answer.markedForReview;
  }
  if (Array.isArray(answer.eliminatedChoices)) {
    body.eliminatedChoices = answer.eliminatedChoices.map(String);
  }
  return body;
}
