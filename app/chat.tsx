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

// ★ (새로 추가) 채점 결과를 표시할 컴포넌트
interface ScoreReport {
    overallScore: number | string; // BigDecimal이 문자열로 올 수 있음
    overallComment: string;
    strengths: string;
    weaknesses: string;
    idealCandidateFit: number;
    jobDescriptionFit: number;
}

const ScoreDisplay = ({ scoreReport }: { scoreReport: ScoreReport }) => {
    // overallScore를 숫자로 변환 (BigDecimal이 문자열로 올 수 있음)
    const overallScore = typeof scoreReport.overallScore === 'number'
        ? scoreReport.overallScore
        : parseFloat(String(scoreReport.overallScore || 0));

    return (
        <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>면접 채점 결과</Text>

            <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>종합 점수:</Text>
                <Text style={[styles.scoreValue, styles.overallScore]}>
                    {isNaN(overallScore) ? '0' : overallScore.toFixed(2)} / 100
                </Text>
            </View>

            <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>종합 코멘트:</Text>
                <Text style={styles.scoreComment}>{scoreReport.overallComment}</Text>
            </View>

            <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>인재상 적합도:</Text>
                <Text style={styles.scoreValue}>{scoreReport.idealCandidateFit} / 5</Text>
            </View>

            <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>직무 적합도:</Text>
                <Text style={styles.scoreValue}>{scoreReport.jobDescriptionFit} / 5</Text>
            </View>

            <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>주요 강점:</Text>
                <Text style={styles.scoreComment}>{scoreReport.strengths}</Text>
            </View>

            <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>보완할 점:</Text>
                <Text style={styles.scoreComment}>{scoreReport.weaknesses}</Text>
            </View>
        </View>
    );
};


export default function ChatScreen() {
    const { name, jobId, email } = useLocalSearchParams<{ name: string, jobId: string, email?: string }>(); // resume 화면에서 전달받은 이름

    // --- 2. 상태(State) 관리 ---
    const [message, setMessage] = useState(''); // 입력창의 현재 메시지
    const [sessionId, setSessionId] = useState<string | null>(null); // 백엔드에서 받은 면접 세션 ID
    const [chatHistory, setChatHistory] = useState<Array<{ sender: string; text: string; key: string }>>([]); // 대화 기록 (배열)
    const [isLoading, setIsLoading] = useState(false); // AI가 응답 중인지 (로딩)
    const [interviewActive, setInterviewActive] = useState(false); // 면접이 진행 중인지

    // ★ (새로 추가) 점수 관련 상태
    const [scoreReport, setScoreReport] = useState<ScoreReport | null>(null); // 채점 결과 JSON
    const [isFetchingScore, setIsFetchingScore] = useState(false); // 점수 로딩 중

    const scrollViewRef = useRef(null); // 스크롤뷰를 제어하기 위한 Ref

    // --- 3. 면접 시작 (화면 로드 시 1회 실행) ---
    useEffect(() => {
        // 면접 시작 함수
        const startInterview = async () => {
            if (!jobId) {
                addMessageToHistory('ai', '채용공고 ID가 필요합니다.');
                return;
            }

            setIsLoading(true);
            try {
                // 이메일 가져오기 (파라미터 > 로그인 이메일 > 이력서 이메일 순서)
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                let applicantEmail = email;
                if (!applicantEmail) {
                    // 로그인한 사용자 이메일 우선 사용
                    applicantEmail = await AsyncStorage.getItem('userEmail');
                }
                if (!applicantEmail) {
                    // 이력서에 저장된 이메일 사용
                    applicantEmail = await AsyncStorage.getItem('resumeEmail');
                }
                if (!applicantEmail) {
                    addMessageToHistory('ai', '이메일 정보를 찾을 수 없습니다. 이력서를 먼저 작성해주세요.');
                    setIsLoading(false);
                    return;
                }

                console.log('[면접 시작] 사용할 이메일:', applicantEmail);
                const data = await interviewApi.start(parseInt(jobId), applicantEmail);

                // 성공 시: 세션 ID 저장 및 첫 질문 표시
                setSessionId(data.sessionId);
                addMessageToHistory('ai', data.question); // AI의 첫 질문 추가
                setInterviewActive(true); // 면접 시작

            } catch (error: any) {
                console.error("Error starting interview:", error);
                addMessageToHistory('ai', `면접 시작 중 오류 발생: ${error.message}`);
            }
            setIsLoading(false);
        };

        // 처음 환영 메시지 추가 후 면접 시작
        addMessageToHistory('ai', `안녕하세요, ${name}님. AI 면접을 시작하겠습니다.`);
        startInterview();
    }, [name, jobId]); // name과 jobId가 바뀔 때 실행

    // --- 4. 메시지 전송 (답변 제출) ---
    const handleSend = async () => {
        if (message.trim().length === 0 || isLoading || !interviewActive || !sessionId) {
            return;
        }

        const userMessage = message;
        addMessageToHistory('user', userMessage);
        setMessage('');
        setIsLoading(true);

        try {
            const data = await interviewApi.submitAnswer(sessionId, userMessage);

            // 성공 시: AI의 다음 질문 또는 종료 메시지 표시
            if (data.question) {
                // 다음 질문이 있는 경우
                addMessageToHistory('ai', data.question);
            } else if (data.message) {
                // 면접이 종료된 경우
                addMessageToHistory('ai', data.message);
                setInterviewActive(false); // 면접 종료
                // 마무리 멘트 추가
                addMessageToHistory('ai', "채점이 완료되면 내 면접 목록에서 채점 결과를 확인하실 수 있습니다.");
                // ★ (새로 추가) 면접 종료 시, 점수 폴링 시작 (점수는 내 면접 목록에서 확인)
                setIsFetchingScore(true); // "점수 확인 중..." 인디케이터 표시
                addMessageToHistory('ai', "채점을 시작합니다. 약 30초 정도 소요됩니다...");
                pollForScore(sessionId); // ★ 점수 가져오기 함수 호출 (점수는 표시하지 않음)
            }

        } catch (error: any) {
            console.error("Error sending answer:", error);
            addMessageToHistory('ai', `오류 발생: ${error.message}`);
        }
        setIsLoading(false); // AI 질문 로딩은 종료
    };

    // --- 5. ★ (새로 추가) 점수 폴링(Polling) 함수 ---

    // ms만큼 기다리는 함수
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 점수 결과를 주기적으로 확인하는 함수
    const pollForScore = async (currentSessionId: string) => {
        const MAX_ATTEMPTS = 6; // 최대 6번 시도 (총 30초)
        const POLL_INTERVAL = 5000; // 5초 간격

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            try {
                const scoreData = await interviewApi.getScore(currentSessionId);
                // chat 화면에서는 점수를 표시하지 않음 (내 면접 목록에서 확인)
                // setScoreReport(scoreData);
                addMessageToHistory('ai', "채점이 완료되었습니다! 내 면접 목록에서 결과를 확인하세요.");
                setIsFetchingScore(false);
                return; // 폴링 종료

            } catch (error: any) {
                if (error.message === 'NOT_FOUND' || error.message === 'SCORING_IN_PROGRESS') {
                    // 아직 채점 중
                    console.log("채점 진행 중... (Attempt", i + 1, ")");
                    await sleep(POLL_INTERVAL);
                } else {
                    // 그 외 오류
                    console.error("Error polling score:", error);
                    addMessageToHistory('ai', `채점 결과 로딩 중 오류 발생: ${error.message}`);
                    setIsFetchingScore(false);
                    return; // 오류 발생 시 폴링 종료
                }
            }
        }

        // 최대 시도 횟수 초과
        addMessageToHistory('ai', "채점 결과 처리가 지연되고 있습니다. 나중에 다시 시도해주세요.");
        setIsFetchingScore(false);
    };


    // --- 6. 유틸리티 함수 ---

    // 채팅 기록에 메시지 추가하는 함수
    const addMessageToHistory = (sender: string, text: string) => {
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

                    {/* chat 화면에서는 점수 표시하지 않음 (내 면접 목록에서 확인) */}

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

    // ★ (새로 추가) 점수 표시 스타일
    scoreContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 15,
        marginVertical: 10,
    },
    scoreTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3b82f6',
        textAlign: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    scoreItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    scoreLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
        flex: 1,
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
    overallScore: {
        color: '#d32f2f', // 강조색
        fontSize: 18,
    },
    messageContainer: {
        padding: 20,
        alignItems: 'center',
    },
    messageText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    scoreComment: {
        fontSize: 15,
        color: '#333',
        flex: 2,
        textAlign: 'right',
    }
});
