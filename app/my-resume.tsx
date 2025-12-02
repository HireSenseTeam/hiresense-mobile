import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Resume, resumeApi } from '../services/api';

export default function MyResumeScreen() {
    const router = useRouter();
    const { applicantEmail } = useLocalSearchParams<{ applicantEmail?: string }>();
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadResume();
    }, [applicantEmail]);

    const loadResume = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 파라미터로 전달된 이메일 우선 사용 (랭킹에서 클릭한 경우)
            let email: string | null = applicantEmail || null;
            
            // 파라미터가 없으면 로그인 이메일 사용
            if (!email) {
                email = await AsyncStorage.getItem('userEmail');
            }
            if (!email) {
                email = await AsyncStorage.getItem('resumeEmail');
            }

            if (!email) {
                setError('이메일 정보를 찾을 수 없습니다.');
                return;
            }

            const data = await resumeApi.getByEmail(email);
            setResume(data);
        } catch (error: any) {
            // 이력서가 없는 경우는 정상적인 상황이므로 에러 로그를 출력하지 않음
            if (error.message && !error.message.includes('이력서 조회 실패')) {
                // 네트워크 오류 등 실제 오류인 경우에만 로그 출력
            }
            setError('이력서를 찾을 수 없습니다. 먼저 이력서를 작성해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const getGenderText = (gender: string) => {
        return gender === 'MALE' ? '남성' : gender === 'FEMALE' ? '여성' : gender;
    };

    const getAcademicStatusText = (status: string) => {
        switch (status) {
            case 'ATTENDING': return '재학중';
            case 'GRADUATED': return '졸업';
            case 'COMPLETED': return '수료';
            case 'DROPOUT': return '중퇴';
            default: return status;
        }
    };

    const getExperienceLevelText = (level: string) => {
        switch (level) {
            case 'NEWCOMER': return '신입';
            case 'JUNIOR': return '주니어 (1~5년)';
            case 'MIDDLE': return '미들 (3~7년)';
            case 'SENIOR': return '시니어 (5년 이상)';
            default: return level;
        }
    };

    const getEmploymentTypeText = (type: string) => {
        switch (type) {
            case 'FULL_TIME': return '정규직';
            case 'PART_TIME': return '파트타임';
            case 'INTERN': return '인턴십';
            default: return type;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>이력서를 불러오는 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !resume) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← 뒤로</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>내 이력서</Text>
                    <View style={styles.backButton} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || '이력서를 찾을 수 없습니다.'}</Text>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => router.push({ pathname: '/resume' })}
                    >
                        <Text style={styles.createButtonText}>이력서 작성하기</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle}>내 이력서</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push({ pathname: '/resume', params: { edit: 'true' } })}
                >
                    <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* 개인정보 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 개인정보</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>이름:</Text>
                        <Text style={styles.infoValue}>{resume.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>이메일:</Text>
                        <Text style={styles.infoValue}>{resume?.email || ''}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>전화번호:</Text>
                        <Text style={styles.infoValue}>{resume.phone}</Text>
                    </View>
                    {resume.birthYear && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>출생년도:</Text>
                            <Text style={styles.infoValue}>{resume.birthYear}</Text>
                        </View>
                    )}
                    {resume.gender && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>성별:</Text>
                            <Text style={styles.infoValue}>{getGenderText(resume.gender)}</Text>
                        </View>
                    )}
                    {resume.address && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>주소:</Text>
                            <Text style={styles.infoValue}>{resume.address}</Text>
                        </View>
                    )}
                </View>

                {/* 학력 */}
                {resume.academicRecord && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎓 학력</Text>
                        {resume.academicRecord.schoolName && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>학교명:</Text>
                                <Text style={styles.infoValue}>
                                    {resume.academicRecord.schoolName}
                                </Text>
                            </View>
                        )}
                        {resume.academicRecord.major && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>전공:</Text>
                                <Text style={styles.infoValue}>{resume.academicRecord.major}</Text>
                            </View>
                        )}
                        {resume.academicRecord.period && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>재학기간:</Text>
                                <Text style={styles.infoValue}>
                                    {resume.academicRecord.period}
                                </Text>
                            </View>
                        )}
                        {resume.academicRecord.status && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>재학상태:</Text>
                                <Text style={styles.infoValue}>
                                    {getAcademicStatusText(resume.academicRecord.status)}
                                </Text>
                            </View>
                        )}
                        {resume.academicRecord.gpa && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>학점:</Text>
                                <Text style={styles.infoValue}>
                                    {resume.academicRecord.gpa}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* 희망직종 */}
                {resume.jobPreference && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💼 희망직종</Text>
                        {resume.jobPreference.desiredJob && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>희망직종:</Text>
                                <Text style={styles.infoValue}>
                                    {resume.jobPreference.desiredJob}
                                </Text>
                            </View>
                        )}
                        {resume.jobPreference.experienceLevel && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>경력수준:</Text>
                                <Text style={styles.infoValue}>
                                    {getExperienceLevelText(resume.jobPreference.experienceLevel)}
                                </Text>
                            </View>
                        )}
                        {resume.jobPreference.description && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>희망직무내용:</Text>
                                <Text style={styles.infoValue}>
                                    {resume.jobPreference.description}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* 근무조건 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 근무조건</Text>
                    {resume.desiredRegion && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>희망 근무 지역:</Text>
                            <Text style={styles.infoValue}>{resume.desiredRegion}</Text>
                        </View>
                    )}
                    {resume.desiredSalary && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>희망임금:</Text>
                            <Text style={styles.infoValue}>
                                {resume.desiredSalary.toLocaleString()}원
                            </Text>
                        </View>
                    )}
                    {resume.workCondition?.employmentType && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>고용형태:</Text>
                            <Text style={styles.infoValue}>
                                {getEmploymentTypeText(resume.workCondition.employmentType)}
                            </Text>
                        </View>
                    )}
                    {resume.workCondition?.desiredHours && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>희망근무시간:</Text>
                            <Text style={styles.infoValue}>
                                {resume.workCondition.desiredHours}
                            </Text>
                        </View>
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
    editButton: {
        padding: 8,
        minWidth: 60,
        alignItems: 'flex-end',
    },
    editButtonText: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '600',
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
        textAlign: 'center',
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
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        width: 100,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
});

