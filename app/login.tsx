import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type UserType = 'candidate' | 'company';

export default function LoginScreen() {
    const router = useRouter();
    const [userType, setUserType] = useState<UserType>('candidate');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // TODO: 실제 로그인 로직 연동 (API 호출 등)
        // userType에 따라 다른 로그인 처리 또는 role 정보를 함께 전달
        console.log('로그인 시도', { userType, email, password });

        if (userType === 'candidate') {
            // 지원자는 로그인 후 바로 이력서 작성 화면으로 이동
            router.replace('/resume' as any);
        } else {
            // 기업은 로그인 후 채용공고 작성 화면으로 이동
            router.replace('/job-posting' as any);
        }
    };

    const handleSignup = (type: UserType) => {
        if (type === 'candidate') {
            router.push('/signup-candidate' as any);
        } else {
            router.push('/signup-company' as any);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>로그인</Text>
                <Text style={styles.subtitle}>
                    서비스를 이용할 유형을 선택하고 로그인해주세요.
                </Text>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            userType === 'candidate' && styles.tabButtonActive,
                        ]}
                        onPress={() => setUserType('candidate')}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                userType === 'candidate' && styles.tabButtonTextActive,
                            ]}
                        >
                            지원자
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            userType === 'company' && styles.tabButtonActive,
                        ]}
                        onPress={() => setUserType('company')}
                    >
                        <Text
                            style={[
                                styles.tabButtonText,
                                userType === 'company' && styles.tabButtonTextActive,
                            ]}
                        >
                            기업
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="이메일"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>
                            {userType === 'candidate' ? '지원자 로그인' : '기업 로그인'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.signupSection}>
                    <Text style={styles.signupText}>아직 계정이 없으신가요?</Text>
                    <View style={styles.signupButtonsRow}>
                        <TouchableOpacity
                            style={[styles.signupButton, styles.signupCandidateButton]}
                            onPress={() => handleSignup('candidate')}
                        >
                            <Text style={styles.signupButtonText}>지원자 회원가입</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.signupButton, styles.signupCompanyButton]}
                            onPress={() => handleSignup('company')}
                        >
                            <Text style={styles.signupButtonText}>기업 회원가입</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#e5e7eb',
        borderRadius: 999,
        padding: 4,
        marginBottom: 24,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#3b82f6',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b5563',
    },
    tabButtonTextActive: {
        color: '#ffffff',
    },
    form: {
        gap: 12,
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    signupSection: {
        marginTop: 'auto',
        paddingBottom: 24,
    },
    signupText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    signupButtonsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    signupButton: {
        flex: 1,
        borderRadius: 999,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupCandidateButton: {
        backgroundColor: '#10b981',
    },
    signupCompanyButton: {
        backgroundColor: '#6366f1',
    },
    signupButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});


