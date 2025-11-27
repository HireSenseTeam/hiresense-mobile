import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView, Platform,
    SafeAreaView, ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

import { interviewApi } from '../services/api';

// --- [UI 컴포넌트] dev 코드에서 가져온 면접관 카드 ---

// ★ 면접관 개별 평가 카드 컴포넌트 (dev 코드 기반)
const EvaluatorCard = ({ evaluator, index }: { evaluator: any; index: number }) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // 면접관별 색상
    const color = colors[index % colors.length];

    return (
        <View style={[styles.evaluatorCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
            <View style={styles.evaluatorHeader}>
                <View style={[styles.evaluatorAvatar, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.evaluatorAvatarText, { color }]}>
                        면접관 {index + 1}
                    </Text>
                </View>
                <View style={styles.evaluatorInfo}>
                    <Text style={styles.evaluatorName}>
                        {evaluator.name || `면접관 ${index + 1}`}
                    </Text>
                    {evaluator.criteria && (
                        <Text style={styles.evaluatorCriteria}>
                            채점 기준: {evaluator.criteria}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.evaluatorScoreSection}>
                <View style={styles.evaluatorScoreRow}>
                    <Text style={styles.evaluatorScoreLabel}>종합 점수:</Text>
                    <Text style={[styles.evaluatorScoreValue, { color }]}>
                        {evaluator.overall_score ?? evaluator.score ?? 'N/A'} / 100
                    </Text>
                </View>

                {/* 적합도 점수 표시 (데이터 구조에 따라 유연하게 처리) */}
                {(evaluator.suitability_score || evaluator.idealCandidateFit || evaluator.jobDescriptionFit) && (
                    <>
                        <View style={styles.evaluatorScoreRow}>
                            <Text style={styles.evaluatorScoreLabel}>인재상 적합도:</Text>
                            <Text style={styles.evaluatorScoreValue}>
                                {evaluator.suitability_score?.ideal_candidate_fit ?? evaluator.idealCandidateFit ?? '-'} / 5
                            </Text>
                        </View>
                        <View style={styles.evaluatorScoreRow}>
                            <Text style={styles.evaluatorScoreLabel}>직무 적합도:</Text>
                            <Text style={styles.evaluatorScoreValue}>
                                {evaluator.suitability_score?.job_description_fit ?? evaluator.jobDescriptionFit ?? '-'} / 5
                            </Text>
                        </View>
                    </>
                )}

                {/* 각 면접관별 커스텀 채점 항목 표시 */}
                {evaluator.custom_scores && Object.entries(evaluator.custom_scores).map(([key, value]) => (
                    <View key={key} style={styles.evaluatorScoreRow}>
                        <Text style={styles.evaluatorScoreLabel}>{key}:</Text>
                        <Text style={styles.evaluatorScoreValue}>{String(value)}</Text>
                    </View>
                ))}
            </View>

            {/* 코멘트 섹션 */}
            {(evaluator.comment || evaluator.overallComment) && (
                <View style={styles.evaluatorCommentSection}>
                    <Text style={styles.evaluatorCommentLabel}>평가 코멘트:</Text>
                    <Text style={styles.evaluatorCommentText}>{evaluator.comment || evaluator.overallComment}</Text>
                </View>
            )}

            {evaluator.strengths && (
                <View style={styles.evaluatorCommentSection}>
                    <Text style={styles.evaluatorCommentLabel}>주요 강점:</Text>
                    <Text style={styles.evaluatorCommentText}>{evaluator.strengths}</Text>
                </View>
            )}

            {evaluator.weaknesses && (
                <View style={styles.evaluatorCommentSection}>
                    <Text style={styles.evaluatorCommentLabel}>보완할 점:</Text>
                    <Text style={styles.evaluatorCommentText}>{evaluator.weaknesses}</Text>
                </View>
            )}
        </View>
    );
};

// ★ 채점 결과를 표시할 컴포넌트 - 4명의 면접관 지원 (dev 코드 로직 + 데이터 타입 안전장치)
const ScoreDisplay = ({ scoreReport }: { scoreReport: any }) => {
    // 백엔드 응답 구조에 따라 면접관 데이터 추출
    let evaluators: any[] = [];

    if (Array.isArray(scoreReport)) {
        // scoreReport가 배열인 경우 (바로 사용)
        evaluators = scoreReport;
    } else if (scoreReport && Array.isArray(scoreReport.evaluators)) {
        // scoreReport.evaluators가 배열인 경우
        evaluators = scoreReport.evaluators;
    } else if (scoreReport && (scoreReport.evaluator_1 || scoreReport.evaluator_2 || scoreReport.evaluator_3 || scoreReport.evaluator_4)) {
        // 개별 필드로 제공되는 경우
        evaluators = [
            scoreReport.evaluator_1,
            scoreReport.evaluator_2,
            scoreReport.evaluator_3,
            scoreReport.evaluator_4
        ].filter(Boolean);
    } else if (scoreReport) {
        // 기존 단일 구조(test 코드의 구조)인 경우, 4개의 복사본으로 변환하여 UI 유지
        // test 코드의 데이터 필드명을 dev 코드 UI가 이해할 수 있도록 매핑
        const mappedEvaluator = {
            ...scoreReport,
            overall_score: scoreReport.overallScore,
            // comment: scoreReport.overallComment, // 아래에서 별도 처리
            suitability_score: {
                ideal_candidate_fit: scoreReport.idealCandidateFit,
                job_description_fit: scoreReport.jobDescriptionFit
            }
        };

        evaluators = Array(4).fill(null).map((_, index) => ({
            ...mappedEvaluator,
            name: `면접관 ${index + 1}`,
            criteria: scoreReport.criteria || '종합 평가'
        }));
    }

    // 항상 4명의 면접관이 표시되도록 보장 (빈 카드 생성)
    while (evaluators.length < 4) {
        evaluators.push({
            name: `면접관 ${evaluators.length + 1}`,
            criteria: null,
            overall_score: null,
            score: null
        });
    }

    // 최대 4명까지만 표시
    evaluators = evaluators.slice(0, 4);

    // 종합 점수 계산 (API에 overallScore가 없으면 평균 계산)
    let overallScore = scoreReport.overallScore || scoreReport.overall_score;
    if (!overallScore && evaluators.length > 0) {
        const validScores = evaluators.filter((e: any) => (e && (e.overall_score || e.score)));
        if (validScores.length > 0) {
            const sum = validScores.reduce((acc: number, e: any) => acc + Number(e.overall_score || e.score || 0), 0);
            overallScore = Math.round(sum / validScores.length);
        } else {
            overallScore = 0;
        }
    }

    return (
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>면접 채점 결과</Text>

            {/* 종합 점수 요약 */}
            <View style={styles.overallSummary}>
                <Text style={styles.overallSummaryLabel}>종합 점수</Text>
                <Text style={styles.overallSummaryScore}>
                    {typeof overallScore === 'number' ? overallScore : parseFloat(String(overallScore || 0)).toFixed(0)} / 100
                </Text>
                {(scoreReport.overallComment || scoreReport.overall_comment) && (
                    <Text style={styles.overallSummaryComment}>
                        {scoreReport.overallComment || scoreReport.overall_comment}
                    </Text>
                )}
            </View>

            {/* 4명의 면접관 평가 카드 */}
            <View style={styles.evaluatorsContainer}>
                <Text style={styles.evaluatorsTitle}>면접관별 평가</Text>
                {evaluators.map((evaluator, index) => (
                    <EvaluatorCard
                        key={index}
                        evaluator={evaluator || { name: `면접관 ${index + 1}` }}
                        index={index}
                    />
                ))}
            </View>
        </View>
    );
};


export default function ChatScreen() {
    // test 코드의 로직 사용 (email 포함)
    const { name, jobId, email } = useLocalSearchParams<{ name: string, jobId: string, email?: string }>();

    // --- 2. 상태(State) 관리 ---
    const [message, setMessage] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; key: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [interviewActive, setInterviewActive] = useState(false);

    // 점수 관련 상태
    const [scoreReport, setScoreReport] = useState<any | null>(null);
    const [isFetchingScore, setIsFetchingScore] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    // --- 3. 면접 시작 (test 코드 로직: api 서비스, 이메일 처리) ---
    useEffect(() => {
        const startInterview = async () => {
            if (!jobId) {
                addMessageToHistory('ai', '채용공고 ID가 필요합니다.');
                return;
            }

            setIsLoading(true);
            try {
                // 이메일 우선순위 처리 로직 유지
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                let applicantEmail = email;
                if (!applicantEmail) {
                    applicantEmail = await AsyncStorage.getItem('userEmail');
                }
                if (!applicantEmail) {
                    applicantEmail = await AsyncStorage.getItem('resumeEmail');
                }
                if (!applicantEmail) {
                    addMessageToHistory('ai', '이메일 정보를 찾을 수 없습니다. 이력서를 먼저 작성해주세요.');
                    setIsLoading(false);
                    return;
                }

                console.log('[면접 시작] 사용할 이메일:', applicantEmail);
                // test 코드의 api 서비스 사용
                const data = await interviewApi.start(parseInt(jobId), applicantEmail);

                setSessionId(data.sessionId);
                addMessageToHistory('ai', data.question);
                setInterviewActive(true);

            } catch (error: any) {
                console.error("Error starting interview:", error);
                addMessageToHistory('ai', `면접 시작 중 오류 발생: ${error.message}`);
            }
            setIsLoading(false);
        };

        addMessageToHistory('ai', `안녕하세요, ${name}님. AI 면접을 시작하겠습니다.`);
        startInterview();
    }, [name, jobId]);

    // --- 4. 메시지 전송 (test 코드 로직) ---
    const handleSend = async () => {
        if (message.trim().length === 0 || isLoading || !interviewActive || !sessionId) {
            return;
        }

        const userMessage = message;
        addMessageToHistory('user', userMessage);
        setMessage('');
        setIsLoading(true);

        try {
            // test 코드의 api 서비스 사용
            const data = await interviewApi.submitAnswer(sessionId, userMessage);

            if (data.question) {
                addMessageToHistory('ai', data.question);
            } else if (data.message) {
                addMessageToHistory('ai', data.message);
                setInterviewActive(false);
                addMessageToHistory('ai', "채점이 완료되면 내 면접 목록에서 채점 결과를 확인하실 수 있습니다.");

                // 면접 종료 시 폴링 시작
                setIsFetchingScore(true);
                addMessageToHistory('ai', "채점을 시작합니다. 약 30초 정도 소요됩니다...");
                pollForScore(sessionId);
            }

        } catch (error: any) {
            console.error("Error sending answer:", error);
            addMessageToHistory('ai', `오류 발생: ${error.message}`);
        }
        setIsLoading(false);
    };

    // --- 5. 점수 폴링 (test 코드 로직: api 서비스, 상태 코드 처리) ---
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const pollForScore = async (currentSessionId: string) => {
        const MAX_ATTEMPTS = 6;
        const POLL_INTERVAL = 5000;

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            try {
                // test 코드의 api 서비스 사용
                const scoreData = await interviewApi.getScore(currentSessionId);

                // 성공 시 점수 상태 업데이트 (화면 표시용)
                setScoreReport(scoreData);
                addMessageToHistory('ai', "채점이 완료되었습니다! 결과를 확인하세요.");
                setIsFetchingScore(false);
                return;

            } catch (error: any) {
                if (error.message === 'NOT_FOUND' || error.message === 'SCORING_IN_PROGRESS') {
                    console.log("채점 진행 중... (Attempt", i + 1, ")");
                    await sleep(POLL_INTERVAL);
                } else {
                    console.error("Error polling score:", error);
                    addMessageToHistory('ai', `채점 결과 로딩 중 오류 발생: ${error.message}`);
                    setIsFetchingScore(false);
                    return;
                }
            }
        }

        addMessageToHistory('ai', "채점 결과 처리가 지연되고 있습니다. 나중에 다시 시도해주세요.");
        setIsFetchingScore(false);
    };

    // --- 6. 유틸리티 함수 ---
    const addMessageToHistory = (sender: string, text: string) => {
        setChatHistory(prevHistory => [...prevHistory, { sender, text, key: Math.random().toString() }]);
    };

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
            >
                <ScrollView
                    style={styles.chatContainer}
                    ref={scrollViewRef}
                    onContentSizeChange={scrollToBottom}
                >
                    {chatHistory.map((chat) => (
                        <View
                            key={chat.key}
                            style={[
                                styles.messageBubble,
                                chat.sender === 'user' ? styles.userMessage : styles.aiMessage
                            ]}
                        >
                            <Text style={styles.messageText}>{chat.text}</Text>
                        </View>
                    ))}

                    {(isLoading || isFetchingScore) && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#555" />
                        </View>
                    )}

                    {/* ★ 점수 결과 표시: dev의 ScoreDisplay (면접관 4명) 사용 */}
                    {scoreReport && (
                        <ScoreDisplay scoreReport={scoreReport} />
                    )}

                </ScrollView>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={interviewActive ? "답변 입력..." : "면접이 종료되었습니다."}
                        placeholderTextColor="#999"
                        editable={!isLoading && interviewActive}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (isLoading || !interviewActive) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={isLoading || !interviewActive}
                    >
                        <Text style={styles.sendButtonText}>전송</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// --- 9. 스타일시트 (test + dev 통합) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff',
    },
    chatContainer: {
        flex: 1,
        padding: 10,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        marginVertical: 5,
    },
    userMessage: {
        backgroundColor: '#DCF8C6',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    aiMessage: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    loadingContainer: {
        alignSelf: 'flex-start',
        padding: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
        backgroundColor: '#f9f9f9'
    },
    sendButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 20,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#a5b4fc',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },

    // --- dev 코드에서 가져온 스타일 (면접관 카드용) ---
    scoreContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 15,
        marginVertical: 10,
    },
    scoreTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3b82f6',
        textAlign: 'center',
        marginBottom: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 10,
    },
    overallSummary: {
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
    },
    overallSummaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    overallSummaryScore: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 8,
    },
    overallSummaryComment: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        lineHeight: 20,
    },
    evaluatorsContainer: {
        marginTop: 10,
    },
    evaluatorsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    evaluatorCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    evaluatorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    evaluatorAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    evaluatorAvatarText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    evaluatorInfo: {
        flex: 1,
    },
    evaluatorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    evaluatorCriteria: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    evaluatorScoreSection: {
        marginBottom: 12,
    },
    evaluatorScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 4,
    },
    evaluatorScoreLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        flex: 1,
    },
    evaluatorScoreValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
    evaluatorCommentSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    evaluatorCommentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    evaluatorCommentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});
