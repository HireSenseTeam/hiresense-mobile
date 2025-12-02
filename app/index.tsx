import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { authApi, JobPosting, jobPostingApi, resumeApi } from '../services/api';
import { handleApiError, handleNetworkError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export default function MainScreen() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        checkAuth();
        loadJobPostings();
    }, []);

    const filteredJobPostings = useMemo(() => {
        if (searchQuery.trim() === '') {
            return jobPostings;
        }
        const query = searchQuery.toLowerCase();
        return jobPostings.filter(
            (job) =>
                job.jobTitle.toLowerCase().includes(query) ||
                job.companyName.toLowerCase().includes(query) ||
                job.workLocation.toLowerCase().includes(query) ||
                (job.jobDescription && job.jobDescription.toLowerCase().includes(query))
        );
    }, [searchQuery, jobPostings]);

    const checkAuth = async () => {
        const token = await AsyncStorage.getItem('authToken');
        const name = await AsyncStorage.getItem('userName');
        const role = await AsyncStorage.getItem('userRole');

        if (token) {
            setIsLoggedIn(true);
            setUserName(name || '');
            setUserRole(role);
        } else {
            setIsLoggedIn(false);
            setUserName('');
            setUserRole(null);
        }
    };

    const loadJobPostings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await jobPostingApi.getAll();
            setJobPostings(data);
        } catch (error) {
            logger.error('채용공고 목록 조회 실패:', error);
            setJobPostings([]);
            handleNetworkError(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadJobPostings();
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            logger.error('로그아웃 API 호출 실패:', error);
        } finally {
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userId', 'userEmail', 'userName', 'userRole']);
            setIsLoggedIn(false);
            setUserRole(null);
            checkAuth();
        }
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

            // 이메일 가져오기
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
            const userName = await AsyncStorage.getItem('userName') || '지원자';
            router.push({
                pathname: '/chat',
                params: {
                    name: userName,
                    jobId: jobId.toString(),
                    email: applicantEmail,
                },
            });
        } catch (error) {
            logger.error('면접 시작 오류:', error);
            handleApiError(error, '면접 시작');
        }
    };

    const getCategoryFromJob = (job: JobPosting): string => {
        // 직무 분류 (간단한 키워드 기반)
        const title = job.jobTitle.toLowerCase();
        if (title.includes('개발자') || title.includes('developer') || title.includes('엔지니어')) {
            return '개발';
        }
        if (title.includes('기획') || title.includes('planner') || title.includes('pm')) {
            return '기획';
        }
        if (title.includes('디자인') || title.includes('designer') || title.includes('ui') || title.includes('ux')) {
            return '디자인';
        }
        if (title.includes('데이터') || title.includes('data') || title.includes('사이언티스트')) {
            return '데이터';
        }
        return '기타';
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
            {/* 헤더 */}
            <View style={styles.topHeader}>
                <Text style={styles.logoText}>HIRESENSE</Text>
                <View style={styles.headerButtons}>
                    {isLoggedIn ? (
                        <>
                            {userRole === 'APPLICANT' && (
                                <>
                                    <TouchableOpacity
                                        style={styles.headerButton}
                                        onPress={() => router.push({ pathname: '/interviews' })}
                                    >
                                        <Text style={styles.headerButtonText}>내 면접</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.headerButton}
                                        onPress={() => router.push({ pathname: '/my-resume' })}
                                    >
                                        <Text style={styles.headerButtonText}>내 이력서</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {userRole === 'COMPANY' && (
                                <>
                                    <TouchableOpacity
                                        style={styles.headerButton}
                                        onPress={() => router.push({ pathname: '/my-job-postings' })}
                                    >
                                        <Text style={styles.headerButtonText}>내 공고</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.headerButton}
                                        onPress={() => router.push({ pathname: '/job-posting' })}
                                    >
                                        <Text style={styles.headerButtonText}>공고 작성</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
                                <Text style={styles.headerButtonText}>로그아웃</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => router.push({ pathname: '/login' })}
                            >
                                <Text style={styles.headerButtonText}>로그인</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.headerButton, styles.signupButton]}
                                onPress={() => router.push({ pathname: '/signup' })}
                            >
                                <Text style={[styles.headerButtonText, styles.signupButtonText]}>회원가입</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* 검색 바 */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="직무 / 지역 검색..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                {searchQuery.trim() !== '' && (
                    <TouchableOpacity 
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearButtonText}>초기화</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 채용공고 목록 */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Text style={styles.sectionTitle}>현재 채용 중인 공고</Text>

                {filteredJobPostings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? '검색 결과가 없습니다' : '채용공고가 없습니다'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? '다른 검색어를 시도해보세요' : '새로운 채용공고를 작성해보세요!'}
                        </Text>
                    </View>
                ) : (
                    filteredJobPostings.map((job) => (
                        <View key={job.id} style={styles.jobCard}>
                            <View style={styles.jobCardContent}>
                                {/* 이미지 영역 (플레이스홀더) */}
                                <View style={styles.jobImage}>
                                    <Text style={styles.jobImageText}>🏢</Text>
                                </View>

                                {/* 채용공고 정보 */}
                                <View style={styles.jobInfo}>
                                    <View style={styles.jobHeader}>
                                        <View style={styles.jobTitleContainer}>
                                            <Text style={styles.jobCompany}>{job.companyName}</Text>
                                            <Text style={styles.jobTitle}>{job.jobTitle}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.jobMeta}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryText}>{getCategoryFromJob(job)}</Text>
                                        </View>
                                        <Text style={styles.jobLocation}>📍 {job.workLocation}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* 액션 버튼 */}
                            <View style={styles.jobActions}>
                                <TouchableOpacity
                                    style={styles.detailButton}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/job-detail',
                                            params: { jobId: job.id.toString() },
                                        });
                                    }}
                                >
                                    <Text style={styles.detailButtonText}>상세보기</Text>
                                </TouchableOpacity>

                                {isLoggedIn && userRole === 'APPLICANT' && (
                                    <TouchableOpacity
                                        style={styles.interviewButton}
                                        onPress={() => handleStartInterview(job.id)}
                                    >
                                        <Text style={styles.interviewButtonText}>면접 시작</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
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
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    headerButtonText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    signupButton: {
        backgroundColor: '#333',
    },
    signupButtonText: {
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        gap: 8,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    clearButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
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
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    jobCardContent: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    jobImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    jobImageText: {
        fontSize: 32,
    },
    jobInfo: {
        flex: 1,
    },
    jobHeader: {
        marginBottom: 8,
    },
    jobTitleContainer: {
        marginBottom: 4,
    },
    jobCompany: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    jobMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
    },
    jobLocation: {
        fontSize: 12,
        color: '#666',
    },
    jobActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    detailButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    detailButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    interviewButton: {
        flex: 1,
        backgroundColor: '#10b981',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    interviewButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    rankingButton: {
        flex: 1,
        backgroundColor: '#8b5cf6',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    rankingButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
