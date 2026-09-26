/**
 * Wordsly Path response shapes, copied from curriculum-service
 * (`src/release/release.logic.ts`, `src/path-progress/*`). Keep them in step
 * with the backend; snapshots carry `snapshotVersion` so a breaking change is
 * visible.
 */

export type CefrLevel = "PRE_A1" | "A1" | "A2" | "B1" | "B2" | "C1";

export type PathItemType = "LEXICAL" | "PHRASE" | "PATTERN" | "GRAMMAR";

export type PathItemRole = "INTRODUCE" | "RECYCLE";

export type PathStepType =
    | "WARMUP"
    | "INTRO"
    | "EXPLAIN"
    | "PRACTICE"
    | "PATTERN_DRILL"
    | "SPEAK"
    | "DIALOGUE"
    | "QUIZ";

/** locked: not reachable yet · available: can be taken · completed: done. */
export type PathNodeState = "locked" | "available" | "completed";

// ─── Tree (the path map) ───────────────────────────────────────────────────

export interface PathTreeLesson {
    id: string;
    slug: string;
    /** Position in the unit, from 1. */
    order: number;
    title: string;
    titleVi: string;
    estimatedMinutes: number;
    newItemCount: number;
}

export interface PathTreeUnit {
    id: string;
    slug: string;
    order: number;
    title: string;
    titleVi: string;
    descriptionVi?: string;
    canDo: string[];
    lessons: PathTreeLesson[];
    checkpointId: string | null;
}

export interface PathTreeStage {
    id: string;
    slug: string;
    cefr: CefrLevel;
    order: number;
    title: string;
    titleVi: string;
    descriptionVi?: string;
    units: PathTreeUnit[];
}

export interface PathTree {
    snapshotVersion: number;
    stages: PathTreeStage[];
}

// ─── The learner's progress ────────────────────────────────────────────────

export interface PathLessonProgress {
    lessonId: string;
    state: PathNodeState;
}

export interface PathUnitProgress {
    unitId: string;
    state: PathNodeState;
    lessons: PathLessonProgress[];
    checkpoint: { checkpointId: string; state: PathNodeState } | null;
}

export interface PathProgress {
    units: PathUnitProgress[];
    /** Next lesson to take ("continue"), or null when there is none. */
    currentLessonId: string | null;
    completedLessonCount: number;
    totalLessonCount: number;
}

export interface PathMe {
    enrolled: boolean;
    enrolledAt: string | null;
    startUnitId: string | null;
    release: { id: string; version: number };
    progress: PathProgress;
}

export interface PathUnitView {
    stage: {
        id: string;
        slug: string;
        cefr: CefrLevel;
        title: string;
        titleVi: string;
    };
    unit: PathTreeUnit;
    progress: PathUnitProgress;
}

// ─── A lesson, as the player needs it ─────────────────────────────────────

export interface PathExample {
    en: string;
    vi: string;
    /** Substring of `en` to emphasise. */
    highlight?: string;
}

export interface PathPattern {
    /** Sentence frame with `{slot}` placeholders. */
    template: string;
    slots: { name: string; hintVi: string; options: string[] }[];
}

export interface PathGrammar {
    ruleVi: string;
    forms: { label: string; example: string }[];
    pitfallsVi: string[];
}

export interface PathItem {
    id: string;
    slug: string;
    type: PathItemType;
    text: string;
    meaningVi: string;
    ipa?: string;
    audioUrl?: string;
    examples: PathExample[];
    pattern?: PathPattern;
    grammar?: PathGrammar;
    collocations?: string[];
    noteVi?: string;
}

export interface PathDialogue {
    id: string;
    slug: string;
    title: string;
    situationVi: string;
    lines: { speaker: string; en: string; vi: string; learnerTurn?: boolean }[];
}

export type PathQuestion = { itemId?: string; explanationVi?: string } & (
    | {
          kind: "choice";
          prompt: string;
          audioText?: string;
          options: string[];
          answer: number;
      }
    | { kind: "gap"; sentence: string; hintVi?: string; answers: string[] }
    | { kind: "order"; vi: string; answer: string }
);

export type PathStep = { id: string; payload: { schemaVersion: number } } & (
    | { type: "WARMUP"; payload: { maxItems: number } }
    | { type: "INTRO"; payload: { itemIds: string[] } }
    | {
          type: "EXPLAIN";
          payload: {
              titleVi: string;
              bodyVi: string;
              itemIds?: string[];
              examples?: PathExample[];
          };
      }
    | { type: "PRACTICE"; payload: { modes: string[]; itemIds: string[] } }
    | {
          type: "PATTERN_DRILL";
          payload: {
              patternId: string;
              prompts: {
                  cueVi: string;
                  slots: Record<string, string>;
                  answer: string;
              }[];
          };
      }
    | { type: "SPEAK"; payload: { lines: { en: string; vi: string }[] } }
    | {
          type: "DIALOGUE";
          payload: { mode: "listen" | "roleplay"; dialogue: PathDialogue };
      }
    | { type: "QUIZ"; payload: { questions: PathQuestion[] } }
);

export interface PathLesson {
    snapshotVersion: number;
    id: string;
    slug: string;
    unitId: string;
    order: number;
    title: string;
    titleVi: string;
    estimatedMinutes: number;
    /** Items linked to the lesson, in link order. */
    items: (PathItem & { role: PathItemRole })[];
    steps: PathStep[];
}

export interface PathLessonView {
    lesson: PathLesson;
    state: PathNodeState;
}

export interface CompletePathLessonDto {
    /** Minted before the first attempt, so a retry is a no-op server-side. */
    clientRequestId: string;
    scorePercent?: number;
}

export interface CompletePathLessonResult {
    /** True when this clientRequestId was already recorded. */
    replayed: boolean;
    me: PathMe;
}

// ─── Checkpoint (unit test) ────────────────────────────────────────────────

/** A checkpoint question as the server sends it: no answer, no explanation. */
export type PathCheckpointQuestion = { itemId?: string } & (
    | { kind: "choice"; prompt: string; audioText?: string; options: string[] }
    | { kind: "gap"; sentence: string; hintVi?: string }
    /** The answer's words, sorted; shuffle before showing them. */
    | { kind: "order"; vi: string; tiles: string[] }
);

export interface PathCheckpointView {
    unitId: string;
    checkpointId: string;
    /** Sent back on submit; the server answers 409 if a newer release is active. */
    releaseId: string;
    passPercent: number;
    state: PathNodeState;
    questions: PathCheckpointQuestion[];
}

/** Option index (choice), typed text (gap), words in order (order). */
export type PathCheckpointResponse = number | string | string[];

export interface SubmitPathCheckpointDto {
    /** Minted once per attempt, so a retry returns the first grade. */
    clientRequestId: string;
    releaseId: string;
    answers: PathCheckpointResponse[];
}

export interface PathCheckpointQuestionResult {
    correct: boolean;
    /** Only once the checkpoint is passed. */
    correctAnswer?: string;
    explanationVi?: string;
}

export interface PathCheckpointResult {
    replayed: boolean;
    scorePercent: number;
    passed: boolean;
    passPercent: number;
    results: PathCheckpointQuestionResult[];
    me: PathMe;
}

// ─── Placement test ────────────────────────────────────────────────────────

/** A placement question: no answer, and the unit it probes. */
export type PathPlacementQuestion = PathCheckpointQuestion & { unitId: string };

export interface PathPlacementView {
    placementId: string;
    /** Sent back on submit; the server answers 409 if a newer release is active. */
    releaseId: string;
    title: string;
    /** In path order. */
    questions: PathPlacementQuestion[];
}

/** null: not answered ("I don't know", or the learner stopped). */
export type PathPlacementResponse = PathCheckpointResponse | null;

export interface SubmitPathPlacementDto {
    /** Minted once per attempt, so a retry returns the first grade. */
    clientRequestId: string;
    releaseId: string;
    /** One per question; pad with null when the learner stops early. */
    answers: PathPlacementResponse[];
}

export interface PathPlacementUnitResult {
    unitId: string;
    correct: number;
    total: number;
    /** Part of the known prefix; false from the first unit the learner missed. */
    known: boolean;
}

export interface PathPlacementResult {
    replayed: boolean;
    scorePercent: number;
    /** Where the test put the learner; null = the first unit. */
    placedUnitId: string | null;
    skippedUnitIds: string[];
    /** Probed units in path order. */
    units: PathPlacementUnitResult[];
    /** The learner's start unit now: a retake never moves it back. */
    startUnitId: string | null;
    me: PathMe;
}
