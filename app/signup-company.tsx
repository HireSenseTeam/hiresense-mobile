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

export default function SignupCompanyScreen() {
    const router = useRouter();

    const [companyName, setCompanyName] = useState('');
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const handleSignup = () => {
        // TODO: 기업 회원가입 API 연동
        console.log('기업 회원가입 시도', { companyName, managerName, email });
        router.replace('/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>기업 회원가입</Text>
                <Text style={styles.subtitle}>
                    채용공고 등록을 위해 기업 정보를 입력해주세요.
                </Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="회사 이름"
                        placeholderTextColor="#999"
                        value={companyName}
                        onChangeText={setCompanyName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="담당자 이름"
                        placeholderTextColor="#999"
                        value={managerName}
                        onChangeText={setManagerName}
                    />
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
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호 확인"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                    />

                    <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
                        <Text style={styles.primaryButtonText}>회원가입 완료</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>이미 계정이 있으신가요?</Text>
                    <TouchableOpacity onPress={() => router.replace('/login')}>
                        <Text style={styles.footerLink}>로그인 하기</Text>
                    </TouchableOpacity>
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
        paddingBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
    },
    form: {
        gap: 12,
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
    primaryButton: {
        backgroundColor: '#6366f1',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    footerLink: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },
});


