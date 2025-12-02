import { Stack } from 'expo-router';
import { Text } from 'react-native';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="login"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="signup"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="resume"
                options={{ headerShown: false }}
            />
            {/* 채용공고 작성 화면 설정 추가 */}
            <Stack.Screen
                name="job-posting"
                options={{ headerShown: false }}
            />
            {/* ----- 아래 chat 화면 설정을 추가합니다 ----- */}
            <Stack.Screen
                name="chat"
                options={({ route }) => ({
                    title: 'AI와 대화',
                    headerBackVisible: false, // 뒤로가기 버튼 숨기기
                    headerRight: () => (
                        <Text style={{ marginRight: 15, fontSize: 16 }}>
                            {(route.params as { name?: string })?.name ?? ''}님
                        </Text>
                    ),
                })}
            />
            <Stack.Screen
                name="job-list"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="interviews"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="select-job"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="interview-detail"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="job-detail"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ranking"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="my-job-postings"
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="my-resume"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}