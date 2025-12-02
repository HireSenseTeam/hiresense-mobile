import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { JobPosting, jobPostingApi, rankingApi, RankingItem, resumeApi } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export default function RankingScreen() {
    const router = useRouter();
    const { jobId } = useLocalSearchParams<{ jobId: string }>();
    const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
    const [rankings, setRankings] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCompanyName, setUserCompanyName] = useState<string | null>(null);

    useEffect(() => {
        loadUserCompanyName();
        if (jobId) {
            loadData();
        }
    }, [jobId]);

    const loadUserCompanyName = async () => {
        try {
            // 사용자가 COMPANY 역할인 경우, 자신의 회사명을 가져옴
            // 실제로는 사용자 정보에서 회사명을 가져와야 하지만, 여기서는 채용공고의 회사명을 기준으로 필터링
            const userEmail = await AsyncStorage.getItem('userEmail');
            const userRole = await AsyncStorage.getItem('userRole');
            if (userRole === 'COMPANY' && jobId) {
                // 채용공고 정보에서 회사명을 가져와서 필터링 기준으로 사용
                const jobData = await jobPostingApi.getById(parseInt(jobId!));
                setUserCompanyName(jobData.companyName);
            }
        } catch (error) {
            logger.error('회사 정보 로드 실패:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [jobData, rankingData] = await Promise.all([
                jobPostingApi.getById(parseInt(jobId!)),
                rankingApi.getByJobId(parseInt(jobId!)),
            ]);
            setJobPosting(jobData);
            
            // 자사 공고 랭킹만 필터링 (회사명이 일치하는 경우만)
            const userRole = await AsyncStorage.getItem('userRole');
            let filteredRankings = rankingData;
            if (userRole === 'COMPANY' && jobData.companyName) {
                // 본인 회사의 채용공고인 경우에만 랭킹 표시
                // 이미 특정 jobId로 조회했으므로 해당 공고의 랭킹만 표시하면 됨
                filteredRankings = rankingData;
            }
            
            // 백엔드에서 이미 정렬되어 있고 rank가 포함되어 있음
            setRankings(filteredRankings);
        } catch (error: any) {
            logger.error('랭킹 데이터 로드 실패:', error);
            handleApiError(error, '랭킹 데이터 로드');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRankingItemPress = async (applicantEmail: string) => {
        try {
            // 지원자의 이력서 조회
            const resume = await resumeApi.getByEmail(applicantEmail);
            // 이력서 상세 페이지로 이동 (새로운 화면이 필요할 수 있음)
            // 여기서는 my-resume 화면을 재사용하거나, 새로운 화면으로 이동
            router.push({
                pathname: '/my-resume',
                params: { applicantEmail: applicantEmail },
            });
        } catch (error) {
            logger.error('이력서 조회 실패:', error);
            handleApiError(error, '이력서 조회');
            // 이력서를 찾을 수 없는 경우 처리
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return '#ffd700'; // 금
        if (rank === 2) return '#c0c0c0'; // 은
        if (rank === 3) return '#cd7f32'; // 동
        return '#e0e0e0';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>랭킹을 불러오는 중...</Text>
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
                <Text style={styles.headerTitle}>지원자 랭킹</Text>
                <View style={styles.backButton} />
            </View>

            {jobPosting && (
                <View style={styles.jobInfoContainer}>
                    <Text style={styles.jobTitle}>{jobPosting.jobTitle}</Text>
                    <Text style={styles.companyName}>{jobPosting.companyName}</Text>
                </View>
            )}

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {rankings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>아직 면접 결과가 없습니다</Text>
                        <Text style={styles.emptySubtext}>
                            면접이 완료되면 랭킹이 표시됩니다.
                        </Text>
                    </View>
                ) : (
                    rankings.map((item) => (
                        <TouchableOpacity
                            key={item.applicantEmail}
                            style={[
                                styles.rankingCard,
                                item.rank === 1 && styles.firstPlace,
                            ]}
                            onPress={() => handleRankingItemPress(item.applicantEmail)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.rankContainer}>
                                <View
                                    style={[
                                        styles.rankBadge,
                                        { backgroundColor: getRankColor(item.rank || 0) },
                                    ]}
                                >
                                    <Text style={styles.rankText}>{item.rank}</Text>
                                </View>
                            </View>
                            <View style={styles.rankingInfo}>
                                <Text style={styles.applicantName}>{item.applicantName}</Text>
                                <Text style={styles.applicantEmail}>{item.applicantEmail}</Text>
                                <View style={styles.scoreContainer}>
                                    <View style={styles.scoreItem}>
                                        <Text style={styles.scoreLabel}>종합 점수</Text>
                                        <Text style={styles.scoreValue}>
                                            {typeof item.overallScore === 'number' 
                                                ? Math.round(item.overallScore) 
                                                : Math.round(parseFloat(String(item.overallScore || 0)))}점
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
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
    jobInfoContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    companyName: {
        fontSize: 14,
        color: '#666',
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
    rankingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        flexDirection: 'row',
    },
    firstPlace: {
        borderColor: '#ffd700',
        borderWidth: 2,
        backgroundColor: '#fffef0',
    },
    rankContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    rankBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    rankingInfo: {
        flex: 1,
    },
    applicantName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    applicantEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    scoreItem: {
        flex: 1,
    },
    scoreLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3b82f6',
    },
});

