"use client";

import { memo, type MouseEvent, type Ref } from "react";
import Image from "next/image";
import {
  Question,
  isOpenAnswerQuestion,
  hasChoiceOptions,
  getQuestionImageUrl,
  shouldUnoptimizeImage,
} from "@/src/services/practice.service";
import { QuestionDisplay } from "@/src/components/practice/QuestionDisplay";
import { QuestionActionBar } from "@/src/components/practice/QuestionActionBar";
import { QuestionChoicesPanel } from "@/src/components/practice/QuestionChoicesPanel";
import { GridInAnswerInput } from "@/src/components/practice/GridInAnswerInput";
import { StudentProducedResponseDirections } from "@/src/components/practice/StudentProducedResponseDirections";
import { PassagePanel } from "@/src/components/practice/PassagePanel";

type QuestionHighlight = {
  startOffset: number;
  endOffset: number;
  color: "YELLOW" | "GREEN" | "BLUE" | "PINK" | "ORANGE";
  note?: string | null;
};

export interface DesktopTestContentProps {
  layoutContainerRef: Ref<HTMLDivElement>;
  sectionType: "ENGLISH" | "MATH";
  question: Question;
  questionIndex: number;
  isFlagged: boolean;
  isEliminationMode: boolean;
  eliminatedChoiceIds: Set<string>;
  selectedChoiceId?: string;
  displayTextAnswer?: string;
  gridInValue: string;
  isMarkupEnabled: boolean;
  attemptId: string;
  splitPosition: number;
  onDividerMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  onToggleFlag: () => void;
  onToggleEliminationMode: () => void;
  onSelectChoice: (choiceId: string) => void;
  onTextAnswerChange: (text: string) => void;
  onQuestionHighlightsChange: (highlights: QuestionHighlight[]) => void;
  onQuestionTextHighlightsChange: (
    questionId: string,
    highlights: QuestionHighlight[],
  ) => void;
  onPassageHighlightsChange: (
    questionId: string,
    highlights: QuestionHighlight[],
  ) => void;
  onChoiceClick: (choiceId: string) => void;
  onEliminationToggle: (choiceId: string) => void;
  onEliminationUndo: (choiceId: string) => void;
  onGridInChange: (value: string) => void;
}

export const DesktopTestContent = memo(function DesktopTestContent({
  layoutContainerRef,
  sectionType,
  question,
  questionIndex,
  isFlagged,
  isEliminationMode,
  eliminatedChoiceIds,
  selectedChoiceId,
  displayTextAnswer,
  gridInValue,
  isMarkupEnabled,
  attemptId,
  splitPosition,
  onDividerMouseDown,
  onToggleFlag,
  onToggleEliminationMode,
  onSelectChoice,
  onTextAnswerChange,
  onQuestionHighlightsChange,
  onQuestionTextHighlightsChange,
  onPassageHighlightsChange,
  onChoiceClick,
  onEliminationToggle,
  onEliminationUndo,
  onGridInChange,
}: DesktopTestContentProps) {
  const isMath = sectionType === "MATH";
  const questionImageUrl = getQuestionImageUrl(question);

  return (
    <div className="flex min-h-0 max-h-full w-full min-w-0 flex-1 flex-col">
      <div
        className="relative flex min-h-0 max-h-full w-full min-w-0 flex-1 flex-col overflow-hidden overflow-x-hidden"
        ref={layoutContainerRef}
      >
        {isMath && hasChoiceOptions(question) ? (
          <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="w-full px-0 pb-6">
              {isOpenAnswerQuestion(question) && (
                <StudentProducedResponseDirections variant="mathSingleColumn" />
              )}
              <QuestionActionBar
                questionIndex={questionIndex}
                isFlagged={isFlagged}
                showEliminationToggle={hasChoiceOptions(question)}
                isEliminationMode={isEliminationMode}
                onToggleFlag={onToggleFlag}
                onToggleEliminationMode={onToggleEliminationMode}
              />
              <div className="prose prose-sm sm:prose max-w-none mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
                <QuestionDisplay
                  key={question.id}
                  question={question}
                  selectedChoiceId={selectedChoiceId}
                  textAnswer={displayTextAnswer}
                  onSelectChoice={onSelectChoice}
                  onTextAnswerChange={onTextAnswerChange}
                  isFlagged={isFlagged}
                  hidePassage
                  showOnlyQuestionText
                  isMarkupEnabled={isMarkupEnabled}
                  attemptId={attemptId}
                  onHighlightsChange={onQuestionHighlightsChange}
                />
              </div>
              {questionImageUrl && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex justify-center items-center overflow-hidden">
                  <Image
                    src={questionImageUrl}
                    alt="Question figure"
                    width={1200}
                    height={900}
                    unoptimized={shouldUnoptimizeImage(questionImageUrl)}
                    className="max-h-[min(48vh,480px)] w-auto max-w-full h-auto rounded-lg object-contain bg-white"
                    sizes="(max-width: 1024px) 95vw, 100vw"
                    loading="lazy"
                  />
                </div>
              )}
              {hasChoiceOptions(question) && (
                <QuestionChoicesPanel
                  choices={question.choices ?? []}
                  selectedChoiceId={selectedChoiceId}
                  isEliminationMode={isEliminationMode}
                  eliminatedChoiceIds={eliminatedChoiceIds}
                  onChoiceClick={onChoiceClick}
                  onEliminationToggle={onEliminationToggle}
                  onEliminationUndo={onEliminationUndo}
                />
              )}
              {isOpenAnswerQuestion(question) && (
                <GridInAnswerInput value={gridInValue} onChange={onGridInChange} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 max-h-full flex-1 gap-0 items-stretch overflow-hidden">
            <div
              className="content-pane max-h-full flex-shrink-0 pr-1 md:pr-2 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                width: `calc(${splitPosition}% - 4px)`,
                minWidth: 200,
              }}
            >
              <div className="pr-2 md:pr-4 pb-4 md:pb-6 pl-0.5 md:pl-1">
                {questionImageUrl && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-100 rounded-lg flex justify-center items-center overflow-hidden">
                    <Image
                      src={questionImageUrl}
                      alt="Question figure"
                      width={1200}
                      height={900}
                      unoptimized={shouldUnoptimizeImage(questionImageUrl)}
                      className="max-h-[min(52vh,520px)] w-auto max-w-full h-auto rounded-lg object-contain bg-gray-100"
                      sizes="(max-width: 1024px) 92vw, 46vw"
                      loading="lazy"
                    />
                  </div>
                )}
                {isMath && isOpenAnswerQuestion(question) ? (
                  <StudentProducedResponseDirections variant="desktopLeft" />
                ) : question.sharedPassage?.content || question.passage ? (
                  <PassagePanel
                    questionId={question.id}
                    passageText={
                      question.sharedPassage?.content || question.passage || ""
                    }
                    isMarkupEnabled={isMarkupEnabled}
                    attemptId={attemptId}
                    onHighlightsChange={(highlights) =>
                      onPassageHighlightsChange(question.id, highlights)
                    }
                  />
                ) : (
                  !questionImageUrl && (
                    <div className="text-gray-500 text-sm italic">
                      No passage for this question.
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              className="divider-inline self-stretch"
              onMouseDown={onDividerMouseDown}
              aria-label="Resize columns"
            />

            <div
              className="content-pane max-h-full flex-1 min-w-0 min-h-0 pl-1 md:pl-2 overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                width: `calc(${100 - splitPosition}% - 4px)`,
                minWidth: 260,
              }}
            >
              <div className="px-2 md:px-4 pb-4 md:pb-6">
                <QuestionActionBar
                  questionIndex={questionIndex}
                  isFlagged={isFlagged}
                  showEliminationToggle={hasChoiceOptions(question)}
                  isEliminationMode={isEliminationMode}
                  onToggleFlag={onToggleFlag}
                  onToggleEliminationMode={onToggleEliminationMode}
                  variant="desktopSplit"
                />
                <div className="prose prose-sm sm:prose max-w-none mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
                  <QuestionDisplay
                    key={question.id}
                    question={question}
                    selectedChoiceId={undefined}
                    textAnswer={undefined}
                    onSelectChoice={() => {}}
                    onTextAnswerChange={() => {}}
                    isFlagged={isFlagged}
                    hidePassage
                    isMarkupEnabled={isMarkupEnabled}
                    showOnlyQuestionText
                    attemptId={attemptId}
                    onHighlightsChange={(highlights) =>
                      onQuestionTextHighlightsChange(question.id, highlights)
                    }
                  />
                </div>

                {hasChoiceOptions(question) && (
                  <QuestionChoicesPanel
                    choices={question.choices ?? []}
                    selectedChoiceId={selectedChoiceId}
                    isEliminationMode={isEliminationMode}
                    eliminatedChoiceIds={eliminatedChoiceIds}
                    layout="desktop"
                    onChoiceClick={onChoiceClick}
                    onEliminationToggle={onEliminationToggle}
                    onEliminationUndo={onEliminationUndo}
                  />
                )}

                {isOpenAnswerQuestion(question) && (
                  <GridInAnswerInput value={gridInValue} onChange={onGridInChange} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
