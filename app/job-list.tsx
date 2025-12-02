import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { JobPosting, jobPostingApi, resumeApi } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export default function JobListScreen() {
    const router = useRouter();
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        loadUserRole();
    }, []);

    const loadUserRole = async () => {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role);
    };

    useEffect(() => {
        loadJobPostings();
    }, []);

    const loadJobPostings = async () => {
        try {
            setLoading(true);
            const data = await jobPostingApi.getAll();
            setJobPostings(data);
        } catch (error: any) {
            logger.error('채용공고 목록 조회 실패:', error);
            handleApiError(error, '채용공고 목록 조회');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadJobPostings();
    };

    const handleStartInterview = async (jobId: number) => {
        try {
            // 로그인 체크
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert(
                    '로그인 필요',
                    '면접을 시작하려면 먼저 로그인해주세요.',
                    [
                        { text: '취소', style: 'cancel' },
                        {
                            text: '로그인하기',
                            onPress: () => router.push({ pathname: '/login' }),
                        },
                    ]
                );
                return;
            }

            // 이메일 가져오기 (로그인 이메일 우선 사용)
            let applicantEmail = await AsyncStorage.getItem('userEmail');
            if (!applicantEmail) {
                applicantEmail = await AsyncStorage.getItem('resumeEmail');
            }

            if (!applicantEmail) {
                Alert.alert(
                    '이력서 필요',
                    '면접을 시작하려면 먼저 이력서를 작성해주세요.',
                    [
                        { text: '취소', style: 'cancel' },
                        {
                            text: '이력서 작성하기',
                            onPress: () => router.push({ pathname: '/resume' }),
                        },
                    ]
                );
                return;
            }

            // 이력서 존재 확인
            try {
                await resumeApi.getByEmail(applicantEmail);
            } catch (error) {
                Alert.alert(
                    '이력서 없음',
                    '이력서를 찾을 수 없습니다. 먼저 이력서를 작성해주세요.',
                    [
                        { text: '취소', style: 'cancel' },
                        {
                            text: '이력서 작성하기',
                            onPress: () => router.push({ pathname: '/resume' }),
                        },
                    ]
                );
                return;
            }

            // 면접 시작
            router.push({
                pathname: '/chat',
                params: {
                    name: await AsyncStorage.getItem('userName') || '지원자',
                    jobId: jobId.toString(),
                    email: applicantEmail,
                },
            });
        } catch (error) {
            logger.error('면접 시작 오류:', error);
            handleApiError(error, '면접 시작');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>채용공고를 불러오는 중...</Text>
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
                <Text style={styles.headerTitle}>채용공고 목록</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {jobPostings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>채용공고가 없습니다</Text>
                        <Text style={styles.emptySubtext}>새로운 채용공고를 작성해보세요!</Text>
                    </View>
                ) : (
                    jobPostings.map((job) => (
                        <View key={job.id} style={styles.jobCard}>
                            <TouchableOpacity
                                onPress={() => {
                                    router.push({
                                        pathname: '/job-detail',
                                        params: { jobId: job.id.toString() },
                                    });
                                }}
                            >
                                <Text style={styles.jobTitle}>{job.jobTitle}</Text>
                                <Text style={styles.companyName}>{job.companyName}</Text>
                                <Text style={styles.workLocation}>📍 {job.workLocation}</Text>
                                <Text style={styles.recruitmentPeriod}>
                                    📅 {job.recruitmentPeriod}
                                </Text>
                            </TouchableOpacity>
                            
                            {userRole === 'APPLICANT' && (
                                <TouchableOpacity
                                    style={styles.interviewButton}
                                    onPress={() => handleStartInterview(job.id)}
                                >
                                    <Text style={styles.interviewButtonText}>🎤 면접 시작하기</Text>
                                </TouchableOpacity>
                            )}
                            
                            {userRole === 'COMPANY' && (
                                <TouchableOpacity
                                    style={styles.rankingButton}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/ranking',
                                            params: { jobId: job.id.toString() },
                                        });
                                    }}
                                >
                                    <Text style={styles.rankingButtonText}>📊 지원자 랭킹 보기</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
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
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    interviewButton: {
        backgroundColor: '#10b981',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    interviewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    rankingButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    rankingButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    companyName: {
        fontSize: 16,
        color: '#3b82f6',
        marginBottom: 8,
    },
    workLocation: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    recruitmentPeriod: {
        fontSize: 12,
        color: '#999',
    },
});

