import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { useMyJobPostings } from '../hooks/useMyJobPostings';

export default function MyJobPostingsScreen() {
    const router = useRouter();
    const { jobPostings: myJobPostings, loading, error, refresh } = useMyJobPostings();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>내 공고를 불러오는 중...</Text>
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
                <Text style={styles.headerTitle}>내 채용공고</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {myJobPostings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>작성한 채용공고가 없습니다</Text>
                        <Text style={styles.emptySubtext}>새로운 채용공고를 작성해보세요!</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push({ pathname: '/job-posting' })}
                        >
                            <Text style={styles.createButtonText}>채용공고 작성하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    myJobPostings.map((job) => (
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

                            <View style={styles.buttonContainer}>
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

                                <TouchableOpacity
                                    style={styles.rankingButton}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/ranking',
                                            params: { jobId: job.id.toString() },
                                        });
                                    }}
                                >
                                    <Text style={styles.rankingButtonText}>📊 면접 랭킹</Text>
                                </TouchableOpacity>
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
        marginBottom: 20,
    },
    createButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        marginBottom: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    detailButton: {
        flex: 1,
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    detailButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    rankingButton: {
        flex: 1,
        backgroundColor: '#8b5cf6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    rankingButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

