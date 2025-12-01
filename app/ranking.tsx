import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { rankingApi, jobPostingApi, JobPosting, RankingItem } from '../services/api';

export default function RankingScreen() {
    const router = useRouter();
    const { jobId } = useLocalSearchParams<{ jobId: string }>();
    const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
    const [rankings, setRankings] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (jobId) {
            loadData();
        }
    }, [jobId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [jobData, rankingData] = await Promise.all([
                jobPostingApi.getById(parseInt(jobId!)),
                rankingApi.getByJobId(parseInt(jobId!)),
            ]);
            setJobPosting(jobData);
            
            // 백엔드에서 이미 정렬되어 있고 rank가 포함되어 있음
            setRankings(rankingData);
        } catch (error: any) {
            console.error('랭킹 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
                        <View
                            key={item.applicantEmail}
                            style={[
                                styles.rankingCard,
                                item.rank === 1 && styles.firstPlace,
                            ]}
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
                                                ? item.overallScore.toFixed(2) 
                                                : item.overallScore}점
                                        </Text>
                                    </View>
                                </View>
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

