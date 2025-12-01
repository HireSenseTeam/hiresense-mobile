import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

export default function SignUpScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'APPLICANT' | 'COMPANY'>('APPLICANT');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !name) {
            Alert.alert('오류', '모든 필드를 입력해주세요.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        try {
            setLoading(true);
            const data = await authApi.signup(email, password, name, role);
            
            // 토큰 및 사용자 정보 저장
            await AsyncStorage.setItem('authToken', data.token);
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
            await AsyncStorage.setItem('userId', data.userId.toString());
            await AsyncStorage.setItem('userEmail', data.email);
            await AsyncStorage.setItem('userName', data.name);
            await AsyncStorage.setItem('userRole', data.role);

            Alert.alert('성공', '회원가입이 완료되었습니다.', [
                {
                    text: 'OK',
                    onPress: () => router.replace({ pathname: '/' } as any),
                },
            ]);
        } catch (error: any) {
            Alert.alert('회원가입 실패', error.message || '회원가입 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>회원가입</Text>
                        <Text style={styles.subtitle}>새 계정을 만드세요</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.roleSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'APPLICANT' && styles.roleButtonActive,
                                ]}
                                onPress={() => setRole('APPLICANT')}
                            >
                                <Text
                                    style={[
                                        styles.roleButtonText,
                                        role === 'APPLICANT' && styles.roleButtonTextActive,
                                    ]}
                                >
                                    지원자
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    role === 'COMPANY' && styles.roleButtonActive,
                                ]}
                                onPress={() => setRole('COMPANY')}
                            >
                                <Text
                                    style={[
                                        styles.roleButtonText,
                                        role === 'COMPANY' && styles.roleButtonTextActive,
                                    ]}
                                >
                                    기업
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>이름</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="이름을 입력하세요"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>이메일</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="이메일을 입력하세요"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>비밀번호</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="비밀번호를 입력하세요 (최소 6자)"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.signupButton, loading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.signupButtonText}>
                                {loading ? '가입 중...' : '회원가입'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.loginLinkText}>
                                이미 계정이 있으신가요? <Text style={styles.loginLinkBold}>로그인</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    form: {
        width: '100%',
    },
    roleSelector: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    roleButtonActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    roleButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    roleButtonTextActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: '#333',
    },
    signupButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#a5b4fc',
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        fontSize: 14,
        color: '#666',
    },
    loginLinkBold: {
        color: '#3b82f6',
        fontWeight: '600',
    },
});

