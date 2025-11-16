import { Redirect } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MainScreen() {
    // TODO: 추후 실제 인증 상태에 따라 분기하도록 수정
    // 현재는 앱 첫 진입 시 무조건 로그인 화면으로 리다이렉트
    return <Redirect href="/login" />;
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
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
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});