import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Image,
  Platform,
  useWindowDimensions,
  BackHandler,
  AppState,
  AppStateStatus,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth-store";
import { useExamStore } from "../../stores/exam-store";
import { showZeeAlert } from "../../stores/alert-store";
import { normalizeQuestionOption } from "../../utils/question-normalizer";
import {
  getExamDetails,
  getStudentExamAttempts,
  submitStudentExamAttempt,
  saveExamDraftLocally,
  getExamDraftLocally,
  clearExamDraftLocally,
} from "../../services/firestore";
import { AnimatedPressable } from "../../components/AnimatedPressable";
import type { Question } from "../../types";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Send,
  RotateCcw,
  Check,
  Maximize,
  Minimize,
  ChevronDown,
  Grid,
  X,
} from "lucide-react-native";

export function getQuestionText(q?: Question | any): string {
  if (!q) return "Untitled Question";
  const text = q.text || q.questionText || q.question || q.statement || q.title;
  if (text && String(text).trim().length > 0) {
    return String(text).trim();
  }
  return "Untitled Question";
}

export default function ExamEngineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 860;

  const {
    currentExam,
    questions,
    currentQuestionIndex,
    answers,
    markedForReview,
    remainingSeconds,
    isExamActive,
    isSubmitting,
    startExam,
    selectAnswer,
    clearAnswer,
    toggleMarkForReview,
    goToQuestion,
    tickTimer,
    resetExamEngine,
  } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [visitedMap, setVisitedMap] = useState<Record<string, boolean>>({});
  const [answeredMarkedList, setAnsweredMarkedList] = useState<string[]>([]);
  const [selectedTempAnswer, setSelectedTempAnswer] = useState<string | number | undefined>(undefined);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [submittingModalVisible, setSubmittingModalVisible] = useState(false);
  const [submittingProgress, setSubmittingProgress] = useState(0);
  const [submittingStepText, setSubmittingStepText] = useState("Evaluating student telemetry...");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobilePaletteVisible, setMobilePaletteVisible] = useState(false);

  // Initialize Exam
  useEffect(() => {
    async function initExam() {
      if (!id || !user) return;
      setLoading(true);

      const { exam, questions: fetchedQuestions } = await getExamDetails(id as string);

      if (exam && fetchedQuestions.length > 0) {
        // Enforce prerequisite check if this level has a prerequisite
        if (exam.prerequisiteExamId && user.uid) {
          const prereqAttempts = await getStudentExamAttempts(exam.prerequisiteExamId, user.uid);
          const isPrereqCompleted = prereqAttempts && prereqAttempts.length > 0;
          if (!isPrereqCompleted) {
            showZeeAlert(
              "Prerequisite Examination Required",
              "You must complete and submit the prerequisite level examination before accessing this level.",
              [{ text: "OK", onPress: () => router.replace("/(tabs)/exams") }],
              "warning"
            );
            return;
          }
        }

        const draft = await getExamDraftLocally(exam.id, user.uid);

        if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
          startExam(exam, fetchedQuestions, draft as any);
          useExamStore.setState({
            answers: draft.answers,
            markedForReview: draft.markedForReview || [],
            timeSpentPerQuestion: draft.timeSpentPerQuestion || {},
          });
          const initialVisited: Record<string, boolean> = {};
          fetchedQuestions.forEach((q, i) => {
            if (i === 0 || draft.answers[q.id] !== undefined) initialVisited[q.id] = true;
          });
          setVisitedMap(initialVisited);
        } else {
          startExam(exam, fetchedQuestions);
          if (fetchedQuestions[0]) {
            setVisitedMap({ [fetchedQuestions[0].id]: true });
          }
        }
      } else {
        showZeeAlert("Error", "Could not load the requested examination paper.", [{ text: "Back", onPress: () => router.back() }], "error");
      }
      setLoading(false);
    }

    initExam();

    return () => {
      resetExamEngine();
    };
  }, [id, user]);

  // Sync temp answer with active question
  useEffect(() => {
    if (questions[currentQuestionIndex]) {
      const qId = questions[currentQuestionIndex].id;
      setSelectedTempAnswer(answers[qId]);
      setVisitedMap((prev) => ({ ...prev, [qId]: true }));
    }
  }, [currentQuestionIndex, questions, answers]);

  // Timer interval
  useEffect(() => {
    if (!isExamActive) return;

    const interval = setInterval(() => {
      const state = useExamStore.getState();
      if (state.remainingSeconds <= 1) {
        clearInterval(interval);
        handleAutoSubmit();
        return;
      }
      tickTimer();

      if (currentExam && user) {
        saveExamDraftLocally(currentExam.id, user.uid, {
          answers: useExamStore.getState().answers,
          markedForReview: useExamStore.getState().markedForReview,
          revisitedQuestions: [],
          timeSpentPerQuestion: useExamStore.getState().timeSpentPerQuestion,
          remainingSeconds: useExamStore.getState().remainingSeconds,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isExamActive]);

  const toggleFullscreen = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
      }
    }
  };

  const handleAutoSubmit = () => {
    executeFinalSubmission();
  };

  const currentQ: Question | undefined = questions[currentQuestionIndex];

  // NTA CBT BUTTON HANDLERS
  const persistCurrentDraft = () => {
    if (currentExam && user) {
      saveExamDraftLocally(currentExam.id, user.uid, {
        answers: useExamStore.getState().answers,
        markedForReview: useExamStore.getState().markedForReview,
        revisitedQuestions: [],
        timeSpentPerQuestion: useExamStore.getState().timeSpentPerQuestion,
        remainingSeconds: useExamStore.getState().remainingSeconds,
      });
    }
  };

  const handleSaveAndNext = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    if (selectedTempAnswer !== undefined && selectedTempAnswer !== "") {
      selectAnswer(qId, selectedTempAnswer);
      setAnsweredMarkedList((prev) => prev.filter((id) => id !== qId));
      if (markedForReview.includes(qId)) toggleMarkForReview(qId);
    }
    persistCurrentDraft();
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    clearAnswer(qId);
    setSelectedTempAnswer(undefined);
    setAnsweredMarkedList((prev) => prev.filter((id) => id !== qId));
    if (markedForReview.includes(qId)) toggleMarkForReview(qId);
    persistCurrentDraft();
  };

  const handleSaveAndMarkForReview = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    if (selectedTempAnswer !== undefined && selectedTempAnswer !== "") {
      selectAnswer(qId, selectedTempAnswer);
      if (!answeredMarkedList.includes(qId)) {
        setAnsweredMarkedList((prev) => [...prev, qId]);
      }
      if (markedForReview.includes(qId)) toggleMarkForReview(qId);
    } else {
      if (!markedForReview.includes(qId)) toggleMarkForReview(qId);
    }
    persistCurrentDraft();
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQ) return;
    const qId = currentQ.id;
    if (selectedTempAnswer !== undefined && selectedTempAnswer !== "") {
      if (!answeredMarkedList.includes(qId)) {
        setAnsweredMarkedList((prev) => [...prev, qId]);
      }
    } else {
      if (!markedForReview.includes(qId)) toggleMarkForReview(qId);
    }
    persistCurrentDraft();
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const violationCountRef = useRef(0);
  const isDisqualifiedRef = useRef(false);

  // Hardware Back / Gesture Navigation Interceptor
  useEffect(() => {
    const onHardwareBack = () => {
      handleLeaveExam();
      return true;
    };
    const backSubscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => backSubscription.remove();
  }, [currentExam, user]);

  // Web beforeunload interceptor
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isExamActive && !isDisqualifiedRef.current) {
          e.preventDefault();
          e.returnValue = "You are exiting the exam. Are you sure? Your progress will be lost.";
          return e.returnValue;
        }
      };
      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }
  }, [isExamActive]);

  // Anti-Cheating Proctoring (App Switch / Minimize / Tab Switch)
  useEffect(() => {
    if (!isExamActive || isDisqualifiedRef.current) return;

    // Mobile AppState Listener
    const appStateSubscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (isDisqualifiedRef.current) return;

      if (nextAppState === "background" || nextAppState === "inactive") {
        violationCountRef.current += 1;

        if (violationCountRef.current === 1) {
          // Strike 1 Warning
          setTimeout(() => {
            showZeeAlert(
              "⚠️ Anti-Cheating Warning (Strike 1 of 2)",
              "Switching apps, minimizing, or dragging to background is strictly prohibited during live proctored exams! If you switch or minimize again, your examination will be immediately TERMINATED and you will be marked as a CHEATER.",
              [{ text: "I Understand & Return to Exam" }],
              "warning"
            );
          }, 300);
        } else if (violationCountRef.current >= 2) {
          // Strike 2 Disqualification
          isDisqualifiedRef.current = true;
          executeDisqualification();
        }
      }
    });

    // Web Tab Switch & Window Blur Listener
    let handleWebVisibility: any;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      handleWebVisibility = () => {
        if (document.hidden && !isDisqualifiedRef.current) {
          violationCountRef.current += 1;
          if (violationCountRef.current === 1) {
            showZeeAlert(
              "⚠️ Anti-Cheating Warning (Strike 1 of 2)",
              "Tab switching or unfocusing the examination window is strictly prohibited! If you switch tabs again, your examination will be immediately TERMINATED and you will be marked as a CHEATER.",
              [{ text: "I Understand & Return to Exam" }],
              "warning"
            );
          } else if (violationCountRef.current >= 2) {
            isDisqualifiedRef.current = true;
            executeDisqualification();
          }
        }
      };
      document.addEventListener("visibilitychange", handleWebVisibility);
    }

    return () => {
      appStateSubscription.remove();
      if (Platform.OS === "web" && typeof document !== "undefined" && handleWebVisibility) {
        document.removeEventListener("visibilitychange", handleWebVisibility);
      }
    };
  }, [isExamActive, currentExam, user]);

  const executeDisqualification = async () => {
    useExamStore.setState({ isExamActive: false, isSubmitting: false });
    if (currentExam && user) {
      await clearExamDraftLocally(currentExam.id, user.uid);
      try {
        const emptyAnswers: Record<string, string | number> = {};
        const { report } = await submitStudentExamAttempt(
          currentExam,
          questions,
          user,
          emptyAnswers,
          [],
          [],
          {}
        );
        report.teacherRemarks = "DISQUALIFIED: Flagged for Academic Dishonesty (multiple unauthorized app switches / minimization).";
        report.passed = false;
        report.percentage = 0;
        report.obtainedMarks = 0;
      } catch (e) {
        console.error("Disqualification sync notice:", e);
      }
    }

    showZeeAlert(
      "🚨 Examination Terminated — Flagged as Cheater",
      "Your examination has been automatically terminated and recorded as Academic Dishonesty due to repeated app-switching violations. Your score is recorded as 0 and your faculty/superadmin has been notified.",
      [
        {
          text: "Acknowledge & Exit",
          style: "destructive",
          onPress: () => router.replace("/(tabs)/exams"),
        },
      ],
      "error"
    );
  };

  const handleLeaveExam = () => {
    showZeeAlert(
      "Exit Examination Warning",
      "You are exiting the exam. Are you sure? Your progress will be lost if you leave before completing.",
      [
        { text: "Continue Exam", style: "cancel" },
        {
          text: "Exit & Lose Progress",
          style: "destructive",
          onPress: () => {
            useExamStore.setState({ isExamActive: false });
            router.back();
          },
        },
      ],
      "warning"
    );
  };

  const executeFinalSubmission = async () => {
    if (!currentExam || !user || isSubmitting) return;
    setShowSubmitConfirmModal(false);

    setSubmittingModalVisible(true);
    setSubmittingProgress(15);
    setSubmittingStepText("Evaluating responses and question scoring...");

    useExamStore.setState({ isSubmitting: true });

    const progressInterval = setInterval(() => {
      setSubmittingProgress((prev) => {
        if (prev < 45) {
          setSubmittingStepText("Evaluating student responses & answer accuracy...");
          return prev + 10;
        } else if (prev < 75) {
          setSubmittingStepText("Computing subject percentiles & question-level correctness...");
          return prev + 8;
        } else if (prev < 94) {
          setSubmittingStepText("Generating performance scorecard...");
          return prev + 4;
        }
        return prev;
      });
    }, 400);

    try {
      const { report } = await submitStudentExamAttempt(
        currentExam,
        questions,
        user,
        answers,
        markedForReview,
        [],
        useExamStore.getState().timeSpentPerQuestion
      );

      clearInterval(progressInterval);
      setSubmittingProgress(100);
      setSubmittingStepText("Scorecard Ready!");

      if (currentExam && user) {
        await clearExamDraftLocally(currentExam.id, user.uid);
      }

      setTimeout(() => {
        useExamStore.setState({ isExamActive: false, isSubmitting: false });
        setSubmittingModalVisible(false);
        router.replace(`/results/${report.id}` as any);
      }, 1000);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Exam submission error:", err);
      useExamStore.setState({ isSubmitting: false });
      setSubmittingModalVisible(false);
      showZeeAlert("Submission Error", "Submission failed. Please check your network connection and try again.", [{ text: "OK" }], "error");
    }
  };

  const formatTimer = (seconds?: number | null) => {
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
      return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || !currentExam) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Examination Paper...</Text>
      </View>
    );
  }

  // Calculate NTA Palette Counts
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let markedReviewCount = 0;
  let answeredMarkedCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q) => {
    const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
    const isRev = markedForReview.includes(q.id);
    const isAnsMarked = answeredMarkedList.includes(q.id) && isAns;
    const isVisited = !!visitedMap[q.id];

    if (isAnsMarked) answeredMarkedCount++;
    else if (isAns) answeredCount++;
    else if (isRev) markedReviewCount++;
    else if (isVisited) notAnsweredCount++;
    else notVisitedCount++;
  });

  const getQuestionStatus = (q: Question, idx: number) => {
    const isAns = answers[q.id] !== undefined && answers[q.id] !== "";
    const isRev = markedForReview.includes(q.id);
    const isAnsMarked = answeredMarkedList.includes(q.id) && isAns;
    const isVisited = !!visitedMap[q.id];

    if (isAnsMarked) return "answered_marked";
    if (isAns) return "answered";
    if (isRev) return "marked_review";
    if (isVisited) return "not_answered";
    return "not_visited";
  };

  return (
    <View style={styles.ntaContainer}>
      {/* 1. TOP HEADER (NTA JEE / NEET CBT STYLE) */}
      <View style={styles.ntaHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.exitBtn} onPress={handleLeaveExam} activeOpacity={0.8}>
            <ChevronLeft size={16} color="#FFFFFF" />
            <Text style={styles.exitBtnText}>Exit Exam</Text>
          </TouchableOpacity>
          <Text style={styles.examTitleText} numberOfLines={1}>
            {currentExam.title}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {isDesktopWeb && (
            <View style={[styles.timerPill, remainingSeconds < 300 && styles.timerPillWarning]}>
              <Clock size={15} color={remainingSeconds < 300 ? "#EF4444" : "#22C55E"} />
              <Text style={styles.timerLabel}>Time Left:</Text>
              <Text style={[styles.timerValue, remainingSeconds < 300 && styles.timerValueWarning]}>
                {formatTimer(remainingSeconds)}
              </Text>
            </View>
          )}

          {!isDesktopWeb && (
            <TouchableOpacity
              style={styles.mobilePaletteBtn}
              onPress={() => setMobilePaletteVisible(true)}
              activeOpacity={0.8}
            >
              <Grid size={15} color="#4F46E5" />
              <Text style={styles.mobilePaletteBtnText}>
                Palette ({currentQuestionIndex + 1}/{questions.length})
              </Text>
            </TouchableOpacity>
          )}

          {isDesktopWeb && (
            <TouchableOpacity style={styles.fullscreenBtn} onPress={toggleFullscreen} activeOpacity={0.8}>
              {isFullscreen ? <Minimize size={15} color="#475569" /> : <Maximize size={15} color="#475569" />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. MAIN 2-PANE EXAM BODY */}
      <View style={styles.mainExamWrapper}>
        {/* LEFT CANVAS: Question Content + NTA Action Buttons */}
        <View style={styles.leftQuestionCanvas}>
          {currentQ ? (
            <ScrollView style={styles.questionScroll} contentContainerStyle={styles.questionScrollContent} showsVerticalScrollIndicator={true}>
              {/* Question Subheader: Number, Expand Arrow, Marks */}
              <View style={styles.qSubHeader}>
                <View style={styles.qNumberRow}>
                  <Text style={styles.qNumberLabel}>Question {currentQuestionIndex + 1}:</Text>
                  <View style={styles.downArrowCircle}>
                    <ChevronDown size={14} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.marksBadgeRow}>
                  <View style={styles.positiveMarksBadge}>
                    <Text style={styles.positiveMarksText}>+{currentQ.marks || 4} Marks</Text>
                  </View>
                  {currentQ.negativeMarks ? (
                    <View style={styles.negativeMarksBadge}>
                      <Text style={styles.negativeMarksText}>-{currentQ.negativeMarks} Mark</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Question Statement */}
              <View style={styles.qStatementBox}>
                <Text style={styles.qStatementText}>{getQuestionText(currentQ)}</Text>
                {currentQ.imageUrl ? (
                  <Image source={{ uri: currentQ.imageUrl }} style={styles.qImage} resizeMode="contain" />
                ) : null}
              </View>

              {/* Options List (1), (2), (3), (4) */}
              <View style={styles.optionsWrapper}>
                {currentQ.options && currentQ.options.length > 0 ? (
                  currentQ.options.map((rawOpt, optIdx) => {
                    const optObj = normalizeQuestionOption(rawOpt, optIdx);
                    const isSelected = selectedTempAnswer === optObj.text || selectedTempAnswer === optIdx || selectedTempAnswer === rawOpt;
                    const optionNumber = `(${optIdx + 1})`;

                    return (
                      <AnimatedPressable
                        key={optIdx}
                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                        onPress={() => setSelectedTempAnswer(optObj.text)}
                        scaleTo={0.98}
                      >
                        <Text style={[styles.optionIndexNumber, isSelected && styles.optionIndexNumberSelected]}>
                          {optionNumber}
                        </Text>
                        <Text style={[styles.optionContentText, isSelected && styles.optionContentTextSelected]}>
                          {optObj.text}
                        </Text>
                      </AnimatedPressable>
                    );
                  })
                ) : (
                  <Text style={styles.numericalPrompt}>Enter numerical response:</Text>
                )}
              </View>
            </ScrollView>
          ) : null}

          {/* 3. NTA JEE/NEET ACTION BAR (2x2 GRID ON MOBILE, TIMER BAR, SUBMIT ON RIGHT BOTTOM) */}
          <View style={styles.ntaActionBarContainer}>
            {/* Bottom Timer Bar (Displays clearly near action buttons) */}
            <View style={styles.ntaTimerBar}>
              <View style={[styles.bottomTimerPill, remainingSeconds < 300 && styles.timerPillWarning]}>
                <Clock size={14} color={remainingSeconds < 300 ? "#EF4444" : "#16A34A"} />
                <Text style={styles.bottomTimerLabel}>TIME LEFT:</Text>
                <Text style={[styles.bottomTimerValue, remainingSeconds < 300 && styles.timerValueWarning]}>
                  {formatTimer(remainingSeconds)}
                </Text>
              </View>
              <Text style={styles.qProgressBadge}>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Text>
            </View>

            {/* Top Action Row: 4 Primary CBT Buttons (2x2 Parallel Grid on Mobile) */}
            {isDesktopWeb ? (
              <View style={styles.ntaButtonRowTop}>
                <AnimatedPressable
                  style={[styles.cbtBtn, styles.cbtBtnSaveNext]}
                  onPress={handleSaveAndNext}
                  scaleTo={0.96}
                >
                  <Text style={styles.cbtBtnTextWhite}>SAVE & NEXT</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  style={[styles.cbtBtn, styles.cbtBtnClear]}
                  onPress={handleClearResponse}
                  scaleTo={0.96}
                >
                  <Text style={styles.cbtBtnTextDark}>CLEAR</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  style={[styles.cbtBtn, styles.cbtBtnSaveMarkReview]}
                  onPress={handleSaveAndMarkForReview}
                  scaleTo={0.96}
                >
                  <Text style={styles.cbtBtnTextWhite}>SAVE & MARK FOR REVIEW</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  style={[styles.cbtBtn, styles.cbtBtnMarkReviewNext]}
                  onPress={handleMarkForReviewAndNext}
                  scaleTo={0.96}
                >
                  <Text style={styles.cbtBtnTextWhite}>MARK FOR REVIEW & NEXT</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={styles.ntaButtonGrid2x2}>
                {/* Row 1 of 2x2 Parallel Grid */}
                <View style={styles.gridRow2x2}>
                  <AnimatedPressable
                    style={[styles.cbtBtn, styles.cbtBtnSaveNext, styles.gridBtn2x2]}
                    onPress={handleSaveAndNext}
                    scaleTo={0.96}
                  >
                    <Text style={styles.cbtBtnTextWhite}>SAVE & NEXT</Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    style={[styles.cbtBtn, styles.cbtBtnClear, styles.gridBtn2x2]}
                    onPress={handleClearResponse}
                    scaleTo={0.96}
                  >
                    <Text style={styles.cbtBtnTextDark}>CLEAR</Text>
                  </AnimatedPressable>
                </View>

                {/* Row 2 of 2x2 Parallel Grid */}
                <View style={styles.gridRow2x2}>
                  <AnimatedPressable
                    style={[styles.cbtBtn, styles.cbtBtnSaveMarkReview, styles.gridBtn2x2]}
                    onPress={handleSaveAndMarkForReview}
                    scaleTo={0.96}
                  >
                    <Text style={styles.cbtBtnTextWhite}>SAVE & MARK REVIEW</Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    style={[styles.cbtBtn, styles.cbtBtnMarkReviewNext, styles.gridBtn2x2]}
                    onPress={handleMarkForReviewAndNext}
                    scaleTo={0.96}
                  >
                    <Text style={styles.cbtBtnTextWhite}>MARK REVIEW & NEXT</Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}

            {/* Bottom Nav Row: Back, Next & Submit (SUBMIT in Green on Right-Most Side) */}
            <View style={styles.ntaButtonRowBottom}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <AnimatedPressable
                  style={[styles.cbtNavBtn, currentQuestionIndex === 0 && { opacity: 0.5 }]}
                  onPress={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  scaleTo={0.95}
                >
                  <Text style={styles.cbtNavBtnText}>&lt;&lt; BACK</Text>
                </AnimatedPressable>

                <AnimatedPressable
                  style={[styles.cbtNavBtn, currentQuestionIndex === questions.length - 1 && { opacity: 0.5 }]}
                  onPress={handleNext}
                  disabled={currentQuestionIndex === questions.length - 1}
                  scaleTo={0.95}
                >
                  <Text style={styles.cbtNavBtnText}>NEXT &gt;&gt;</Text>
                </AnimatedPressable>
              </View>

              {/* Requirement: Submit Button in Green Color on Right-Most Side */}
              <AnimatedPressable
                style={[styles.cbtBtn, styles.cbtSubmitBtn]}
                onPress={() => setShowSubmitConfirmModal(true)}
                scaleTo={0.95}
              >
                <Text style={styles.cbtSubmitBtnText}>SUBMIT</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>

        {/* RIGHT PALETTE (MATCHING SCREENSHOT 2: NTA LEGEND & QUESTION MATRIX) */}
        {isDesktopWeb && (
          <View style={styles.rightPaletteSidebar}>
            {/* Top Legend Box with Dashed Border */}
            <View style={styles.legendBox}>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.legendBadgeNotVisited}>
                    <Text style={styles.legendBadgeTextDark}>{notVisitedCount}</Text>
                  </View>
                  <Text style={styles.legendItemLabel}>Not Visited</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={styles.legendBadgeNotAnswered}>
                    <Text style={styles.legendBadgeTextWhite}>{notAnsweredCount}</Text>
                  </View>
                  <Text style={styles.legendItemLabel}>Not Answered</Text>
                </View>
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={styles.legendBadgeAnswered}>
                    <Text style={styles.legendBadgeTextWhite}>{answeredCount}</Text>
                  </View>
                  <Text style={styles.legendItemLabel}>Answered</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={styles.legendBadgeMarkedReview}>
                    <Text style={styles.legendBadgeTextWhite}>{markedReviewCount}</Text>
                  </View>
                  <Text style={styles.legendItemLabel}>Marked for Review</Text>
                </View>
              </View>

              <View style={[styles.legendRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={[styles.legendItem, { width: "100%" }]}>
                  <View style={styles.legendBadgeAnsweredMarked}>
                    <Text style={styles.legendBadgeTextWhite}>{answeredMarkedCount}</Text>
                    <View style={styles.greenMiniDot} />
                  </View>
                  <Text style={[styles.legendItemLabel, { flex: 1, fontSize: 10.5, lineHeight: 14 }]}>
                    Answered & Marked for Review <Text style={{ fontSize: 9.5, color: "#64748B" }}>(will be considered for evaluation)</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Question Palette Number Grid */}
            <View style={styles.matrixContainer}>
              <ScrollView style={styles.matrixScrollView} contentContainerStyle={styles.matrixGridContent} showsVerticalScrollIndicator={true}>
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q, idx);
                  const isCurrent = idx === currentQuestionIndex;
                  const formattedNum = (idx + 1).toString().padStart(2, "0");

                  return (
                    <TouchableOpacity
                      key={q.id}
                      style={[
                        styles.matrixCell,
                        status === "answered" && styles.matrixCellAnswered,
                        status === "not_answered" && styles.matrixCellNotAnswered,
                        status === "marked_review" && styles.matrixCellMarkedReview,
                        status === "answered_marked" && styles.matrixCellAnsweredMarked,
                        status === "not_visited" && styles.matrixCellNotVisited,
                        isCurrent && styles.matrixCellCurrent,
                      ]}
                      onPress={() => goToQuestion(idx)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.matrixCellText,
                          status === "not_visited" && styles.matrixCellTextDark,
                          isCurrent && styles.matrixCellTextCurrent,
                        ]}
                      >
                        {formattedNum}
                      </Text>
                      {status === "answered_marked" && <View style={styles.matrixCellGreenDot} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
      </View>

      {/* 4. CONFIRMATION MODAL */}
      <Modal visible={showSubmitConfirmModal} animationType="fade" transparent={true} onRequestClose={() => setShowSubmitConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <AlertTriangle color="#F59E0B" size={26} />
              <Text style={styles.modalTitleText}>Submit Examination?</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              Please review your question response statistics before submitting:
            </Text>

            <View style={styles.statsSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Questions:</Text>
                <Text style={[styles.summaryVal, { color: "#0F172A" }]}>{questions.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Answered:</Text>
                <Text style={[styles.summaryVal, { color: "#16A34A" }]}>{answeredCount + answeredMarkedCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Not Answered:</Text>
                <Text style={[styles.summaryVal, { color: "#DC2626" }]}>{notAnsweredCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Marked for Review:</Text>
                <Text style={[styles.summaryVal, { color: "#7C3AED" }]}>{markedReviewCount + answeredMarkedCount}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Not Visited:</Text>
                <Text style={[styles.summaryVal, { color: "#64748B" }]}>{notVisitedCount}</Text>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSubmitConfirmModal(false)}>
                <Text style={styles.modalCancelBtnText}>Continue Test</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={executeFinalSubmission} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. SUBMITTING PROGRESS */}
      <Modal visible={submittingModalVisible} animationType="fade" transparent={true} onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: "center", paddingVertical: 32 }]}>
            <ActivityIndicator size="large" color="#16A34A" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#0F172A", marginBottom: 6 }}>
              Evaluating Examination
            </Text>
            <Text style={{ fontSize: 13, color: "#64748B", marginBottom: 20, textAlign: "center" }}>
              {submittingStepText}
            </Text>
            <View style={{ width: "100%", height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
              <View style={{ width: `${submittingProgress}%`, height: "100%", backgroundColor: "#16A34A", borderRadius: 4 }} />
            </View>
            <Text style={{ fontSize: 12, fontWeight: "800", color: "#16A34A" }}>
              {submittingProgress}% Complete
            </Text>
          </View>
        </View>
      </Modal>

      {/* 6. MOBILE QUESTION PALETTE MODAL */}
      <Modal
        visible={mobilePaletteVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMobilePaletteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "85%", width: "95%", maxWidth: 480, padding: 16 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Grid size={18} color="#4F46E5" />
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A" }}>Question Palette ({questions.length} Qs)</Text>
              </View>
              <TouchableOpacity onPress={() => setMobilePaletteVisible(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Legend (JEE NTA Specification) */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.legendBadgeNotVisited, { width: 26, height: 24 }]}><Text style={styles.legendBadgeTextDark}>{notVisitedCount}</Text></View>
                <Text style={{ fontSize: 11, color: "#475569", fontWeight: "600" }}>Not Visited</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.legendBadgeNotAnswered, { width: 26, height: 24 }]}><Text style={styles.legendBadgeTextWhite}>{notAnsweredCount}</Text></View>
                <Text style={{ fontSize: 11, color: "#475569", fontWeight: "600" }}>Not Answered</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.legendBadgeAnswered, { width: 26, height: 24 }]}><Text style={styles.legendBadgeTextWhite}>{answeredCount}</Text></View>
                <Text style={{ fontSize: 11, color: "#475569", fontWeight: "600" }}>Answered</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.legendBadgeMarkedReview, { width: 26, height: 26 }]}><Text style={styles.legendBadgeTextWhite}>{markedReviewCount}</Text></View>
                <Text style={{ fontSize: 11, color: "#475569", fontWeight: "600" }}>Marked for Review</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, width: "100%" }}>
                <View style={[styles.legendBadgeAnsweredMarked, { width: 26, height: 26 }]}>
                  <Text style={styles.legendBadgeTextWhite}>{answeredMarkedCount}</Text>
                  <View style={styles.greenMiniDot} />
                </View>
                <Text style={{ fontSize: 10.5, color: "#475569", fontWeight: "600", flex: 1 }}>
                  Answered & Marked for Review <Text style={{ fontSize: 9, color: "#94A3B8" }}>(will be evaluated)</Text>
                </Text>
              </View>
            </View>

            {/* Grid */}
            <ScrollView style={{ maxHeight: 300, marginVertical: 12 }} contentContainerStyle={styles.matrixGridContent}>
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q, idx);
                const isCurrent = idx === currentQuestionIndex;
                const formattedNum = (idx + 1).toString().padStart(2, "0");

                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.matrixCell,
                      status === "answered" && styles.matrixCellAnswered,
                      status === "not_answered" && styles.matrixCellNotAnswered,
                      status === "marked_review" && styles.matrixCellMarkedReview,
                      status === "answered_marked" && styles.matrixCellAnsweredMarked,
                      status === "not_visited" && styles.matrixCellNotVisited,
                      isCurrent && styles.matrixCellCurrent,
                    ]}
                    onPress={() => {
                      goToQuestion(idx);
                      setMobilePaletteVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.matrixCellText,
                        status === "not_visited" && styles.matrixCellTextDark,
                        isCurrent && styles.matrixCellTextCurrent,
                      ]}
                    >
                      {formattedNum}
                    </Text>
                    {status === "answered_marked" && <View style={styles.matrixCellGreenDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.cbtBtn, styles.cbtBtnSaveNext, { width: "100%", justifyContent: "center", paddingVertical: 12, borderRadius: 8 }]}
              onPress={() => setMobilePaletteVisible(false)}
            >
              <Text style={[styles.cbtBtnTextWhite, { fontSize: 13 }]}>Back to Question</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  ntaContainer: {
    flex: 1,
    width: "100%",
    height: "100vh" as any,
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "700",
  },

  // HEADER STYLES (With safe camera notch spacing on phone)
  ntaHeader: {
    paddingTop: Platform.OS === "android" ? 38 : Platform.OS === "ios" ? 44 : 10,
    paddingBottom: 10,
    minHeight: Platform.OS === "android" ? 82 : Platform.OS === "ios" ? 88 : 52,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#334155",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  exitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#475569",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  examTitleText: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.2,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerPillWarning: {
    backgroundColor: "#450A0A",
    borderColor: "#991B1B",
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
  },
  timerValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#22C55E",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  timerValueWarning: {
    color: "#EF4444",
  },
  mobilePaletteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mobilePaletteBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#0F172A",
  },
  fullscreenBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#1E293B",
  },
  ntaTimerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
  },
  bottomTimerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bottomTimerLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
  bottomTimerValue: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#16A34A",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  qProgressBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4F46E5",
  },

  // MAIN SPLIT PANE
  mainExamWrapper: {
    flex: 1,
    flexDirection: "row",
    height: "calc(100vh - 52px)" as any,
  },

  // LEFT QUESTION CANVAS
  leftQuestionCanvas: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    padding: 24,
  },
  qSubHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  qNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qNumberLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  downArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
  },
  marksBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  positiveMarksBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  positiveMarksText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065F46",
  },
  negativeMarksBadge: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  negativeMarksText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#991B1B",
  },
  qStatementBox: {
    marginBottom: 24,
  },
  qStatementText: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 25,
  },
  qImage: {
    width: "100%",
    height: 220,
    marginTop: 14,
    borderRadius: 8,
  },
  optionsWrapper: {
    gap: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  optionRowSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#0284C7",
  },
  optionIndexNumber: {
    fontSize: 14,
    fontWeight: "900",
    color: "#334155",
    width: 32,
  },
  optionIndexNumberSelected: {
    color: "#0284C7",
  },
  optionContentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  optionContentTextSelected: {
    fontWeight: "700",
    color: "#0F172A",
  },
  numericalPrompt: {
    fontSize: 13,
    color: "#64748B",
    fontStyle: "italic",
  },

  // NTA BUTTON ROWS (2x2 GRID & GREEN SUBMIT)
  ntaActionBarContainer: {
    borderTopWidth: 2,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  ntaButtonRowTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ntaButtonGrid2x2: {
    gap: 8,
    width: "100%",
  },
  gridRow2x2: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  gridBtn2x2: {
    flex: 1,
    minHeight: 40,
  },
  cbtBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  cbtBtnSaveNext: {
    backgroundColor: "#16A34A",
    borderWidth: 1,
    borderColor: "#15803D",
  },
  cbtBtnClear: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cbtBtnSaveMarkReview: {
    backgroundColor: "#6B21A8",
    borderWidth: 1,
    borderColor: "#581C87",
  },
  cbtBtnMarkReviewNext: {
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
  cbtBtnTextWhite: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  cbtBtnTextDark: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  ntaButtonRowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  cbtNavBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
  },
  cbtNavBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#475569",
  },
  cbtSubmitBtn: {
    backgroundColor: "#16A34A",
    borderWidth: 1.5,
    borderColor: "#15803D",
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 6,
    shadowColor: "#16A34A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cbtSubmitBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },

  // RIGHT PALETTE SIDEBAR
  rightPaletteSidebar: {
    width: 320,
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    padding: 14,
    gap: 14,
  },
  legendBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    gap: 10,
    backgroundColor: "#F8FAFC",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
  },
  legendItemLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  legendBadgeNotVisited: {
    width: 32,
    height: 28,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  legendBadgeNotAnswered: {
    width: 32,
    height: 28,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#E03E1A",
    alignItems: "center",
    justifyContent: "center",
  },
  legendBadgeAnswered: {
    width: 32,
    height: 28,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  legendBadgeMarkedReview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6B21A8",
    alignItems: "center",
    justifyContent: "center",
  },
  legendBadgeAnsweredMarked: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6B21A8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  greenMiniDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  legendBadgeTextWhite: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  legendBadgeTextDark: {
    fontSize: 11,
    fontWeight: "900",
    color: "#334155",
  },

  // QUESTION MATRIX GRID
  matrixContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    overflow: "hidden",
  },
  matrixScrollView: {
    flex: 1,
  },
  matrixGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
  },
  matrixCell: {
    width: 44,
    height: 38,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  matrixCellNotVisited: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderRadius: 4,
  },
  matrixCellAnswered: {
    backgroundColor: "#16A34A",
    borderColor: "#15803D",
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
  },
  matrixCellNotAnswered: {
    backgroundColor: "#E03E1A",
    borderColor: "#C23314",
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  matrixCellMarkedReview: {
    backgroundColor: "#6B21A8",
    borderColor: "#581C87",
    borderRadius: 999,
    width: 40,
    height: 40,
  },
  matrixCellAnsweredMarked: {
    backgroundColor: "#6B21A8",
    borderColor: "#581C87",
    borderRadius: 999,
    width: 40,
    height: 40,
  },
  matrixCellCurrent: {
    borderWidth: 2.5,
    borderColor: "#2563EB",
  },
  matrixCellGreenDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  matrixCellText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  matrixCellTextDark: {
    color: "#334155",
  },
  matrixCellTextCurrent: {
    fontWeight: "900",
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: "#64748B",
    marginBottom: 16,
  },
  statsSummaryCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "900",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  modalCancelBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },
  modalConfirmBtnText: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
