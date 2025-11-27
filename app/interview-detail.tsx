import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { interviewApi, InterviewSession, InterviewScore } from '../services/api';

interface InterviewAnswer {
    id: number;
    questionText: string;
    answerText: string;
    score?: number;
    feedback?: string;
}

export default function InterviewDetailScreen() {
    const router = useRouter();
    const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
    const [score, setScore] = useState<InterviewScore | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            loadInterviewData();
        }
    }, [sessionId]);

    const loadInterviewData = async () => {
        try {
            setLoading(true);
            const [sessionData, answersData] = await Promise.all([
                interviewApi.getSession(sessionId!),
                interviewApi.getAnswers(sessionId!).catch(() => []),
            ]);
            setSession(sessionData);
            setAnswers(answersData);

            // 점수 조회 (채점 완료된 경우)
            if (sessionData.status === 'SCORED') {
                try {
                    const scoreData = await interviewApi.getScore(sessionId!);
                    setScore(scoreData);
                } catch (error) {
                    console.log('점수 조회 실패 (아직 채점 중일 수 있음)');
                }
            }
        } catch (error: any) {
            console.error('면접 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return '#3b82f6';
            case 'COMPLETED': return '#10b981';
            case 'SCORED': return '#8b5cf6';
            case 'ERROR': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return '진행 중';
            case 'COMPLETED': return '완료';
            case 'SCORED': return '채점 완료';
            case 'ERROR': return '오류';
            default: return status;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>면접 정보를 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>면접 정보를 찾을 수 없습니다.</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Text style={styles.headerBackText}>← 뒤로</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>면접 상세</Text>
                <View style={styles.headerBackButton} />
            </View>

            <ScrollView style={styles.content}>
                {/* 면접 정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>면접 정보</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>진행률:</Text>
                        <Text style={styles.infoValue}>
                            {session.currentIndex} / {session.totalQuestions || '?'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>상태:</Text>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(session.status) },
                            ]}
                        >
                            <Text style={styles.statusText}>
                                {getStatusText(session.status)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 채점 결과 */}
                {score && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>채점 결과</Text>
                        <View style={styles.scoreCard}>
                            <Text style={styles.scoreTitle}>종합 점수</Text>
                            <Text style={styles.scoreValue}>
                                {typeof score.overallScore === 'number' 
                                    ? score.overallScore.toFixed(2) 
                                    : parseFloat(String(score.overallScore || 0)).toFixed(2)} / 100
                            </Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>종합 코멘트:</Text>
                            <Text style={styles.scoreComment}>{score.overallComment}</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>인재상 적합도:</Text>
                            <Text style={styles.scoreValue}>{score.idealCandidateFit} / 5</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>직무 적합도:</Text>
                            <Text style={styles.scoreValue}>{score.jobDescriptionFit} / 5</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>주요 강점:</Text>
                            <Text style={styles.scoreComment}>{score.strengths}</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreLabel}>보완할 점:</Text>
                            <Text style={styles.scoreComment}>{score.weaknesses}</Text>
                        </View>
                    </View>
                )}

                {/* 답변 목록 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>면접 답변 ({answers.length}개)</Text>
                    {answers.length === 0 ? (
                        <Text style={styles.emptyText}>답변이 없습니다.</Text>
                    ) : (
                        answers.map((answer, index) => (
                            <View key={answer.id} style={styles.answerCard}>
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                    {answer.score !== undefined && (
                                        <Text style={styles.answerScore}>
                                            점수: {answer.score}점
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.questionText}>{answer.questionText}</Text>
                                <Text style={styles.answerText}>{answer.answerText}</Text>
                                {answer.feedback && (
                                    <View style={styles.feedbackContainer}>
                                        <Text style={styles.feedbackLabel}>피드백:</Text>
                                        <Text style={styles.feedbackText}>{answer.feedback}</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerBackButton: {
        padding: 8,
        minWidth: 60,
    },
    headerBackText: {
        fontSize: 16,
        color: '#3b82f6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 80,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    scoreCard: {
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    scoreTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    scoreItem: {
        marginBottom: 12,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    scoreComment: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    answerCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
    answerScore: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },
    questionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    answerText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    feedbackContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    feedbackLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontWeight: '600',
    },
    feedbackText: {
        fontSize: 12,
        color: '#8b5cf6',
        lineHeight: 18,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
});

