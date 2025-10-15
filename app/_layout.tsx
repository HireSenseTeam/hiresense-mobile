import { Stack } from 'expo-router';
import { Text } from 'react-native';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{ title: '메인 화면' }}
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
        </Stack>
    );
}