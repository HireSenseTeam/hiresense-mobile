import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { interviewApi, InterviewSession, jobPostingApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InterviewsScreen() {
    const router = useRouter();
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [jobPostingsMap, setJobPostingsMap] = useState<Map<number, any>>(new Map());

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            // 이메일 가져오기
            const email = await AsyncStorage.getItem('userEmail');
            if (!email) {
                console.error('이메일을 찾을 수 없습니다.');
                return;
            }
            const data = await interviewApi.getSessionsByApplicant(email);
            setSessions(data);
            
            // 채용공고 정보 로드 (중복 제거)
            const uniqueJobPostingIds = [...new Set(data.map(s => s.jobPostingId))];
            const jobPostings = await Promise.all(
                uniqueJobPostingIds.map(id => 
                    jobPostingApi.getById(id).catch(() => null)
                )
            );
            const map = new Map();
            jobPostings.forEach((job, index) => {
                if (job) {
                    map.set(uniqueJobPostingIds[index], job);
                }
            });
            setJobPostingsMap(map);
        } catch (error: any) {
            console.error('면접 목록 조회 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
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

    const handleDelete = async (sessionId: string, event: any) => {
        event.stopPropagation(); // 카드 클릭 이벤트 방지
        
        Alert.alert(
            '면접 삭제',
            '이 면접을 삭제하시겠습니까? 삭제된 면접은 복구할 수 없습니다.',
            [
                {
                    text: '취소',
                    style: 'cancel',
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await interviewApi.deleteSession(sessionId);
                            // 목록 새로고침
                            loadSessions();
                        } catch (error: any) {
                            Alert.alert('삭제 실패', error.message || '면접 삭제 중 오류가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>면접 목록을 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← 뒤로</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>내 면접 목록</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {sessions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>면접 기록이 없습니다</Text>
                        <Text style={styles.emptySubtext}>새로운 면접을 시작해보세요!</Text>
                    </View>
                ) : (
                    sessions.map((session) => {
                        const sessionId = session.sessionId || session.id;
                        const jobPosting = jobPostingsMap.get(session.jobPostingId);
                        
                        if (!sessionId) {
                            console.error('sessionId가 없습니다:', session);
                            return null;
                        }
                        
                        return (
                            <View key={sessionId} style={styles.sessionCardContainer}>
                                <TouchableOpacity
                                    style={styles.sessionCard}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/interview-detail',
                                            params: { sessionId: sessionId },
                                        } as any);
                                    }}
                                >
                                    <View style={styles.sessionHeader}>
                                        <Text style={styles.sessionTitle}>
                                            {jobPosting?.jobTitle || session.jobPosting?.jobTitle || `채용공고 #${session.jobPostingId}`}
                                        </Text>
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
                                    <Text style={styles.sessionCompany}>
                                        {jobPosting?.companyName || session.jobPosting?.companyName || '회사명'}
                                    </Text>
                                    <Text style={styles.sessionDate}>
                                        진행률: {session.currentIndex} / {session.totalQuestions || '?'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={(e) => handleDelete(sessionId, e)}
                                >
                                    <Text style={styles.deleteButtonText}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }).filter(Boolean)
                )}
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
    backButton: {
        padding: 8,
        minWidth: 60,
    },
    backButtonText: {
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
    sessionCardContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    sessionCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    deleteButton: {
        marginLeft: 8,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 20,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: '600',
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
    sessionCompany: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    sessionDate: {
        fontSize: 12,
        color: '#999',
    },
});

