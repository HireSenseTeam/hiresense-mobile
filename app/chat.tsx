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

// --- 1. 설정 ---
// 환경 변수에서 API URL 가져오기 (없을 경우 기본값 사용)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// API URL 유효성 검사
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

// ---

// ★ 면접관 개별 평가 카드 컴포넌트
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

                {evaluator.suitability_score && (
                    <>
                        {evaluator.suitability_score.ideal_candidate_fit !== undefined && (
                            <View style={styles.evaluatorScoreRow}>
                                <Text style={styles.evaluatorScoreLabel}>인재상 적합도:</Text>
                                <Text style={styles.evaluatorScoreValue}>
                                    {evaluator.suitability_score.ideal_candidate_fit} / 5
                                </Text>
                            </View>
                        )}
                        {evaluator.suitability_score.job_description_fit !== undefined && (
                            <View style={styles.evaluatorScoreRow}>
                                <Text style={styles.evaluatorScoreLabel}>직무 적합도:</Text>
                                <Text style={styles.evaluatorScoreValue}>
                                    {evaluator.suitability_score.job_description_fit} / 5
                                </Text>
                            </View>
                        )}
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

            {evaluator.comment && (
                <View style={styles.evaluatorCommentSection}>
                    <Text style={styles.evaluatorCommentLabel}>평가 코멘트:</Text>
                    <Text style={styles.evaluatorCommentText}>{evaluator.comment}</Text>
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

// ★ (수정) 채점 결과를 표시할 컴포넌트 - 4명의 면접관 지원
const ScoreDisplay = ({ scoreReport }) => {
    // 백엔드 응답 구조에 따라 면접관 데이터 추출
    let evaluators: any[] = [];
    
    if (Array.isArray(scoreReport)) {
        // scoreReport가 배열인 경우
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
        // 기존 단일 구조인 경우, 4개의 복사본으로 변환 (하위 호환성)
        evaluators = Array(4).fill(null).map((_, index) => ({
            ...scoreReport,
            name: `면접관 ${index + 1}`,
            criteria: scoreReport.criteria || '종합 평가'
        }));
    }

    // 항상 4명의 면접관이 표시되도록 보장
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

    // 종합 점수 계산 (평균 또는 전체 점수)
    const overallScore = (scoreReport && scoreReport.overall_score) || 
        (evaluators.length > 0 
            ? Math.round(evaluators.reduce((sum: number, e: any) => sum + ((e && (e.overall_score || e.score)) || 0), 0) / evaluators.length)
            : 0);

    return (
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>면접 채점 결과</Text>
            
            {/* 종합 점수 요약 */}
            <View style={styles.overallSummary}>
                <Text style={styles.overallSummaryLabel}>종합 점수</Text>
                <Text style={styles.overallSummaryScore}>{overallScore} / 100</Text>
                {scoreReport && scoreReport.overall_comment && (
                    <Text style={styles.overallSummaryComment}>{scoreReport.overall_comment}</Text>
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
    const { name, jobId } = useLocalSearchParams<{ name: string, jobId: string }>(); // resume 화면에서 전달받은 이름

    // --- 2. 상태(State) 관리 ---
    const [message, setMessage] = useState(''); // 입력창의 현재 메시지
    const [sessionId, setSessionId] = useState(null); // 백엔드에서 받은 면접 세션 ID
    const [chatHistory, setChatHistory] = useState<any[]>([]); // 대화 기록 (배열)
    const [isLoading, setIsLoading] = useState(false); // AI가 응답 중인지 (로딩)
    const [interviewActive, setInterviewActive] = useState(false); // 면접이 진행 중인지

    // ★ (새로 추가) 점수 관련 상태
    const [scoreReport, setScoreReport] = useState(null); // 채점 결과 JSON
    const [isFetchingScore, setIsFetchingScore] = useState(false); // 점수 로딩 중

    const scrollViewRef = useRef<ScrollView>(null); // 스크롤뷰를 제어하기 위한 Ref

    // --- 3. 면접 시작 (화면 로드 시 1회 실행) ---
    useEffect(() => {
        // 면접 시작 함수
        const startInterview = async () => {
            setIsLoading(true);
            // 백엔드에 /interview/start 요청
            try {
                const response = await fetch(`${API_BASE_URL}/interview/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_id: jobId }),
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || '서버 시작 오류');
                }

                // 성공 시: 세션 ID 저장 및 첫 질문 표시
                setSessionId(data.session_id);
                addMessageToHistory('ai', data.question); // AI의 첫 질문 추가
                setInterviewActive(true); // 면접 시작

            } catch (error) {
                console.error("Error starting interview:", error);
                addMessageToHistory('ai', `면접 시작 중 오류 발생: ${error.message}`);
            }
            setIsLoading(false);
        };

        // 처음 환영 메시지 추가 후 면접 시작
        addMessageToHistory('ai', `안녕하세요, ${name}님. AI 면접을 시작하겠습니다.`);
        startInterview();
    }, [name]); // name이 바뀔 때만 (즉, 처음 1회) 실행

    // --- 4. 메시지 전송 (답변 제출) ---
    const handleSend = async () => {
        if (message.trim().length === 0 || isLoading || !interviewActive) {
            return;
        }

        const userMessage = message;
        addMessageToHistory('user', userMessage);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/interview/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    answer_text: userMessage,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '답변 처리 오류');
            }

            // 성공 시: AI의 다음 질문 또는 종료 메시지 표시
            if (data.question) {
                // 다음 질문이 있는 경우
                addMessageToHistory('ai', data.question);
            } else if (data.message) {
                // 면접이 종료된 경우
                addMessageToHistory('ai', data.message);
                setInterviewActive(false); // 면접 종료
                // ★ (새로 추가) 면접 종료 시, 점수 폴링 시작
                setIsFetchingScore(true); // "점수 확인 중..." 인디케이터 표시
                addMessageToHistory('ai', "채점을 시작합니다. 약 30초 정도 소요됩니다...");
                pollForScore(sessionId); // ★ 점수 가져오기 함수 호출
            }

        } catch (error) {
            console.error("Error sending answer:", error);
            addMessageToHistory('ai', `오류 발생: ${error.message}`);
        }
        setIsLoading(false); // AI 질문 로딩은 종료
    };

    // --- 5. ★ (새로 추가) 점수 폴링(Polling) 함수 ---

    // ms만큼 기다리는 함수
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 점수 결과를 주기적으로 확인하는 함수
    const pollForScore = async (currentSessionId) => {
        const MAX_ATTEMPTS = 6; // 최대 6번 시도 (총 30초)
        const POLL_INTERVAL = 5000; // 5초 간격

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            try {
                // 1단계에서 만든 /interview/score API 호출 (GET 요청)
                const response = await fetch(`${API_BASE_URL}/interview/score?session_id=${currentSessionId}`);

                if (response.ok) {
                    // 성공 (200 OK) - 점수(JSON)를 받음
                    const scoreData = await response.json();
                    setScoreReport(scoreData);
                    addMessageToHistory('ai', "채점이 완료되었습니다! 결과를 확인하세요.");
                    setIsFetchingScore(false);
                    return; // 폴링 종료
                }

                if (response.status === 404) {
                    // (404 Not Found) - 아직 채점 중
                    console.log("채점 진행 중... (Attempt", i + 1, ")");
                    // 5초 대기
                    await sleep(POLL_INTERVAL);
                } else {
                    // 그 외 서버 오류
                    throw new Error(`서버 오류: ${response.status}`);
                }

            } catch (error) {
                console.error("Error polling score:", error);
                addMessageToHistory('ai', `채점 결과 로딩 중 오류 발생: ${error.message}`);
                setIsFetchingScore(false);
                return; // 오류 발생 시 폴링 종료
            }
        }

        // 최대 시도 횟수 초과
        addMessageToHistory('ai', "채점 결과 처리가 지연되고 있습니다. 나중에 다시 시도해주세요.");
        setIsFetchingScore(false);
    };


    // --- 6. 유틸리티 함수 ---

    // 채팅 기록에 메시지 추가하는 함수
    const addMessageToHistory = (sender, text) => {
        setChatHistory(prevHistory => [...prevHistory, { sender, text, key: Math.random().toString() }]);
    };

    // 스크롤을 맨 아래로 내리는 함수
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
                {/* --- 7. 대화 내용 표시 --- */}
                <ScrollView
                    style={styles.chatContainer}
                    ref={scrollViewRef}
                    onContentSizeChange={scrollToBottom}
                >
                    {chatHistory.map((chat) => (
                        <View
                            key={chat.key} // key를 index 대신 고유값으로 변경
                            style={[
                                styles.messageBubble,
                                chat.sender === 'user' ? styles.userMessage : styles.aiMessage
                            ]}
                        >
                            <Text style={styles.messageText}>{chat.text}</Text>
                        </View>
                    ))}

                    {/* 로딩 중일 때 인디케이터 표시 (AI 답변 + 점수 확인) */}
                    {(isLoading || isFetchingScore) && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#555" />
                        </View>
                    )}

                    {/* ★ (새로 추가) 점수 리포트 표시 */}
                    {scoreReport && (
                        <ScoreDisplay scoreReport={scoreReport} />
                    )}

                </ScrollView>

                {/* --- 8. 메시지 입력 공간 --- */}
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

// --- 9. 스타일시트 ---
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
        backgroundColor: '#DCF8C6', // 연한 초록
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    aiMessage: {
        backgroundColor: '#FFFFFF', // 흰색
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
        backgroundColor: '#a5b4fc', // 비활성화 시 연한 파랑
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // ... (기존 Placeholder 스타일은 생략) ...

    // ★ (수정) 점수 표시 스타일 - 4명의 면접관 지원
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
