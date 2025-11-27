import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

export default function MainScreen() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = await AsyncStorage.getItem('authToken');
        const name = await AsyncStorage.getItem('userName');
        const role = await AsyncStorage.getItem('userRole');
        
        if (token) {
            setIsLoggedIn(true);
            setUserName(name || '');
            setUserRole(role || '');
        } else {
            // 로그인되지 않은 경우 로그인 화면으로 이동
            router.replace({ pathname: '/login' } as any);
        }
    };

    const handleLogout = async () => {
        try {
            // 백엔드 로그아웃 API 호출
            await authApi.logout();
        } catch (error) {
            console.error('로그아웃 API 호출 실패:', error);
        } finally {
            // 로컬 스토리지 삭제
            await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userId', 'userEmail', 'userName', 'userRole']);
            setIsLoggedIn(false);
            router.replace({ pathname: '/login' } as any);
        }
    };

    if (!isLoggedIn) {
        return null; // 로그인 화면으로 리다이렉트 중
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>🎉 환영합니다!</Text>
                    <Text style={styles.subtitle}>
                        {userName}님 ({userRole === 'APPLICANT' ? '지원자' : '기업'})
                    </Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.menuTitle}>원하는 메뉴를 선택해주세요.</Text>

                {userRole === 'APPLICANT' && (
                    <>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push({ pathname: '/resume' } as any)}
                        >
                            <Text style={styles.buttonText}>📝 이력서 작성하기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.sixthButton]}
                            onPress={() => router.push({ pathname: '/my-resume' } as any)}
                        >
                            <Text style={styles.buttonText}>📄 내 이력서 보기</Text>
                        </TouchableOpacity>
                    </>
                )}

                {userRole === 'COMPANY' && (
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => router.push({ pathname: '/job-posting' } as any)}
                    >
                        <Text style={styles.buttonText}>💼 채용공고 작성하기</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.button, styles.tertiaryButton]}
                    onPress={() => router.push({ pathname: '/job-list' } as any)}
                >
                    <Text style={styles.buttonText}>📋 채용공고 목록</Text>
                </TouchableOpacity>

                {userRole === 'APPLICANT' && (
                    <TouchableOpacity
                        style={[styles.button, styles.quaternaryButton]}
                        onPress={() => router.push({ pathname: '/interviews' } as any)}
                    >
                        <Text style={styles.buttonText}>📊 내 면접 목록</Text>
                    </TouchableOpacity>
                )}

                {userRole === 'COMPANY' && (
                    <TouchableOpacity
                        style={[styles.button, styles.quinaryButton]}
                        onPress={() => {
                            router.push({ pathname: '/job-list' } as any);
                        }}
                    >
                        <Text style={styles.buttonText}>🏆 채용공고별 지원자 랭킹</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 10,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    menuTitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginBottom: 15,
        minWidth: 200,
        alignItems: 'center',
    },
    secondaryButton: {
        backgroundColor: '#10b981',
    },
    tertiaryButton: {
        backgroundColor: '#f59e0b',
    },
    quaternaryButton: {
        backgroundColor: '#8b5cf6',
    },
    quinaryButton: {
        backgroundColor: '#ec4899',
    },
    sixthButton: {
        backgroundColor: '#06b6d4',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});