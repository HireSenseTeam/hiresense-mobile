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
import { jobPostingApi, JobPosting } from '../services/api';

export default function SelectJobScreen() {
    const router = useRouter();
    const { name, email } = useLocalSearchParams<{ name: string; email: string }>();
    const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadJobPostings();
    }, []);

    const loadJobPostings = async () => {
        try {
            setLoading(true);
            const data = await jobPostingApi.getAll();
            setJobPostings(data);
        } catch (error: any) {
            console.error('채용공고 목록 조회 실패:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadJobPostings();
    };

    const handleSelectJob = (jobId: number) => {
        // 면접 시작 화면으로 이동 (이메일도 전달)
        router.push({
            pathname: '/chat',
            params: { 
                name: name || '지원자', 
                jobId: jobId.toString(),
                email: email || '',
            },
        } as any);
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
                <Text style={styles.headerTitle}>면접할 채용공고 선택</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    {name ? `${name}님, ` : ''}면접을 시작할 채용공고를 선택해주세요.
                </Text>
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
                        <Text style={styles.emptySubtext}>
                            먼저 채용공고를 작성해주세요.
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push({ pathname: '/job-posting' } as any)}
                        >
                            <Text style={styles.createButtonText}>채용공고 작성하기</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    jobPostings.map((job) => (
                        <TouchableOpacity
                            key={job.id}
                            style={styles.jobCard}
                            onPress={() => handleSelectJob(job.id)}
                        >
                            <Text style={styles.jobTitle}>{job.jobTitle}</Text>
                            <Text style={styles.companyName}>{job.companyName}</Text>
                            <Text style={styles.workLocation}>📍 {job.workLocation}</Text>
                            <Text style={styles.recruitmentPeriod}>
                                📅 {job.recruitmentPeriod}
                            </Text>
                            <View style={styles.selectButton}>
                                <Text style={styles.selectButtonText}>면접 시작하기 →</Text>
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
    infoContainer: {
        backgroundColor: '#e0f2fe',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#bae6fd',
    },
    infoText: {
        fontSize: 16,
        color: '#0369a1',
        textAlign: 'center',
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
    selectButton: {
        backgroundColor: '#10b981',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

