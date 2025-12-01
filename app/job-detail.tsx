import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jobPostingApi, JobPosting, resumeApi } from '../services/api';

export default function JobDetailScreen() {
    const router = useRouter();
    const { jobId } = useLocalSearchParams<{ jobId: string }>();
    const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        loadUserRole();
    }, []);

    const loadUserRole = async () => {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role);
    };

    useEffect(() => {
        if (jobId) {
            loadJobPosting();
        }
    }, [jobId]);

    const loadJobPosting = async () => {
        try {
            setLoading(true);
            const data = await jobPostingApi.getById(parseInt(jobId!));
            setJobPosting(data);
        } catch (error: any) {
            console.error('채용공고 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartInterview = async () => {
        if (!jobId) return;

        try {
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
                            onPress: () => router.push({ pathname: '/resume' } as any),
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
                            onPress: () => router.push({ pathname: '/resume' } as any),
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
                    jobId: jobId,
                    email: applicantEmail,
                },
            } as any);
        } catch (error: any) {
            Alert.alert('오류', '면접 시작 중 오류가 발생했습니다.');
            console.error('면접 시작 오류:', error);
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

    if (!jobPosting) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>채용공고를 찾을 수 없습니다.</Text>
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
                <Text style={styles.headerTitle}>채용공고 상세</Text>
                <View style={styles.headerBackButton} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.jobTitle}>{jobPosting.jobTitle}</Text>
                    <Text style={styles.companyName}>{jobPosting.companyName}</Text>
                    <View style={styles.divider} />
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <Text style={styles.infoText}>{jobPosting.workLocation}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📅</Text>
                        <Text style={styles.infoText}>{jobPosting.recruitmentPeriod}</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>인재상</Text>
                    <Text style={styles.sectionContent}>{jobPosting.idealCandidate}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>주요 업무</Text>
                    <Text style={styles.sectionContent}>{jobPosting.jobDescription}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>자격 요건</Text>
                    <Text style={styles.sectionContent}>{jobPosting.qualifications}</Text>
                </View>

                {jobPosting.preferredQualifications && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>우대사항</Text>
                        <Text style={styles.sectionContent}>
                            {jobPosting.preferredQualifications}
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    {userRole === 'COMPANY' && (
                        <TouchableOpacity
                            style={styles.rankingButton}
                            onPress={() => {
                                router.push({
                                    pathname: '/ranking',
                                    params: { jobId: jobId },
                                } as any);
                            }}
                        >
                            <Text style={styles.rankingButtonText}>📊 지원자 랭킹 보기</Text>
                        </TouchableOpacity>
                    )}
                    
                    {userRole === 'APPLICANT' && (
                        <TouchableOpacity
                            style={styles.interviewButton}
                            onPress={handleStartInterview}
                        >
                            <Text style={styles.interviewButtonText}>🎤 면접 시작하기</Text>
                        </TouchableOpacity>
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    jobTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    companyName: {
        fontSize: 18,
        color: '#3b82f6',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    sectionContent: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    buttonContainer: {
        marginBottom: 20,
    },
    rankingButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    rankingButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    interviewButton: {
        backgroundColor: '#10b981',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    interviewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

