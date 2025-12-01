import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Modal, KeyboardTypeOptions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import styles from '../components/ResumeApp/ResumeApp.styles';
import { resumeApi } from '../services/api';

// --- 인터페이스 정의 ---
interface ResumeData {
  name: string;
  address: string;
  gender: string;
  birthYear: string;
  phone: string;
  email: string;
  homePhone: string;
  schoolName: string;
  period: string;
  status: string;
  gpa: string;
  major: string;
  desiredJob: string;
  experienceLevel: string;
  description: string;
  desiredRegion: string;
  desiredSalary: string;
  employmentType: string;
  desiredHours: string;
}
interface ValidationErrors { [key: string]: string; }
interface Step { id: string; label: string; icon: string; requiredFields: string[]; }
interface Option { value: string; label: string; }

export default function ResumeScreen(): React.JSX.Element {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: '', address: '', gender: '', birthYear: '', phone: '', email: '', homePhone: '',
    schoolName: '', period: '', status: '', gpa: '', major: '',
    desiredJob: '', experienceLevel: '', description: '', desiredRegion: '',
    desiredSalary: '', employmentType: '', desiredHours: '',
  });

  useEffect(() => {
    const loadResumeDraft = async () => {
      try {
        // 로그인한 사용자의 이메일 가져오기
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          setResumeData(prevData => ({ ...prevData, email: userEmail }));
        }

        const savedDraft = await AsyncStorage.getItem('resumeDraft');
        if (savedDraft !== null) {
          const loadedData = JSON.parse(savedDraft);
          // 이메일은 로그인한 사용자의 이메일로 고정
          setResumeData(prevData => ({ ...prevData, ...loadedData, email: userEmail || prevData.email }));
        }
      } catch (error) { console.error('Failed to load resume draft', error); }
    };
    loadResumeDraft();
  }, []);

  const steps: Step[] = [
    { id: 'personal', label: '개인정보', icon: '👤', requiredFields: ['name', 'email', 'address', 'gender', 'birthYear', 'phone'] },
    { id: 'education', label: '학력', icon: '🎓', requiredFields: ['schoolName', 'major', 'period', 'status'] },
    { id: 'career', label: '희망직종', icon: '💼', requiredFields: ['desiredJob', 'experienceLevel'] },
    { id: 'conditions', label: '근무조건', icon: '📍', requiredFields: ['desiredRegion', 'desiredSalary', 'employmentType'] }
  ];

  const dataLabels: { [key in keyof ResumeData]: string } = {
    name: '성명', email: '이메일', address: '주소', gender: '성별', birthYear: '출생년도', phone: '휴대전화', homePhone: '일반전화',
    schoolName: '학교명', major: '전공명', period: '재학기간', status: '재학상태', gpa: '학점',
    desiredJob: '희망직종', experienceLevel: '경력수준', description: '희망직무내용', desiredRegion: '희망 근무 지역',
    desiredSalary: '희망임금', employmentType: '고용형태', desiredHours: '희망근무시간',
  };

  const handlePreview = (): void => { setShowPreviewModal(true); };

  const handleFinalSave = async (): Promise<void> => {
    try {
      // 백엔드 DTO 구조에 맞게 중첩된 요청 객체 생성
      const requestBody = {
        name: resumeData.name,
        address: resumeData.address,
        gender: resumeData.gender,
        birthYear: resumeData.birthYear,
        phone: resumeData.phone,
        email: resumeData.email,
        homePhone: resumeData.homePhone,
        academicRecord: {
          schoolName: resumeData.schoolName,
          period: resumeData.period,
          status: resumeData.status,
          gpa: resumeData.gpa ? parseFloat(resumeData.gpa) : null,
          major: resumeData.major,
        },
        jobPreference: {
          desiredJob: resumeData.desiredJob,
          experienceLevel: resumeData.experienceLevel,
          description: resumeData.description,
        },
        desiredRegion: resumeData.desiredRegion,
        desiredSalary: resumeData.desiredSalary ? parseInt(resumeData.desiredSalary.replace(/[^0-9]/g, ''), 10) : null,
        workCondition: {
          employmentType: resumeData.employmentType,
          desiredHours: resumeData.desiredHours,
        },
      };

      const savedData = await resumeApi.create(requestBody);
      console.log('서버 저장 성공:', savedData);

      // 최종 저장 성공 후, 로컬 초안 데이터를 삭제하여 다음 작성 시 빈 양식으로 시작하도록 합니다.
      await AsyncStorage.removeItem('resumeDraft');
      setShowPreviewModal(false);
      
      // 이력서 이메일을 AsyncStorage에 저장 (면접 시작 시 사용)
      if (savedData.email) {
        await AsyncStorage.setItem('resumeEmail', savedData.email);
      }
      
      // 채용공고 선택 화면으로 이동
      router.replace({
        pathname: '/select-job',
        params: { 
          name: resumeData.name, 
          email: savedData.email || resumeData.email || '',
        },
      } as any);

    } catch (error) {
      console.error('이력서 최종 저장 실패:', error);
    }
  };

  const validateField = (field: string, value: string): string => {
    if (!value.trim() && steps[currentStep].requiredFields.includes(field)) { return '필수 입력 항목입니다'; }
    if (field === 'email' && value) { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(value)) return '올바른 이메일 형식이 아닙니다'; }
    if (field === 'phone' && value) { const phoneRegex = /^010\d{8}$/; if (!phoneRegex.test(value.replace(/-/g, ''))) return '올바른 휴대폰 번호 형식이 아닙니다'; }
    if (field === 'birthYear' && value) { const year = parseInt(value); const currentYear = new Date().getFullYear(); if (isNaN(year) || year < 1900 || year > currentYear) return '올바른 출생년도를 입력하세요'; }
    return '';
  };

  const handleInputChange = (field: keyof ResumeData, value: string): void => {
    // 이메일 필드는 수정 불가
    if (field === 'email') {
      return;
    }
    const newData = { ...resumeData, [field]: value };
    setResumeData(newData);
    if (touchedFields.has(field)) { const error = validateField(field, value); setValidationErrors(prev => ({ ...prev, [field]: error })); }
    AsyncStorage.setItem('resumeDraft', JSON.stringify(newData));
  };

  const handleFieldBlur = (field: string): void => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, resumeData[field as keyof ResumeData]);
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const getProgress = (): number => {
    const totalRequiredFields = steps.reduce((acc, step) => acc + step.requiredFields.length, 0);
    const filledRequiredFields = steps.reduce((acc, step) => acc + step.requiredFields.filter(field => typeof resumeData[field as keyof ResumeData] === 'string' && resumeData[field as keyof ResumeData].trim() !== '').length, 0);
    return (filledRequiredFields / totalRequiredFields) * 100;
  };

  const canProceedToNext = (): boolean => {
    const currentRequiredFields = steps[currentStep].requiredFields;
    return currentRequiredFields.every(field => typeof resumeData[field as keyof ResumeData] === 'string' && resumeData[field as keyof ResumeData].trim() !== '');
  };

  const handleNext = (): void => {
    const currentRequiredFields = steps[currentStep].requiredFields;
    const errors: ValidationErrors = {};
    currentRequiredFields.forEach(field => { const error = validateField(field, resumeData[field as keyof ResumeData]); if (error) errors[field] = error; });
    setValidationErrors(errors);
    setTouchedFields(new Set(currentRequiredFields));
    if (Object.keys(errors).length === 0 && currentStep < steps.length - 1) { setCurrentStep(currentStep + 1); scrollViewRef.current?.scrollTo({ y: 0, animated: true }); }
  };

  const handlePrev = (): void => {
    if (currentStep > 0) { setCurrentStep(currentStep - 1); scrollViewRef.current?.scrollTo({ y: 0, animated: true }); }
  };

  const renderInput = (field: keyof ResumeData, label: string, placeholder: string, required = false, keyboardType: KeyboardTypeOptions = 'default', multiline = false, disabled = false) => {
    const hasError = validationErrors[field] && touchedFields.has(field);
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
        <TextInput
          style={[styles.input, multiline && styles.textArea, hasError && styles.inputError, disabled && styles.inputDisabled]}
          value={resumeData[field]} 
          onChangeText={disabled ? undefined : (value) => handleInputChange(field, value)}
          onBlur={() => handleFieldBlur(field)} 
          placeholder={placeholder} 
          placeholderTextColor="#999"
          keyboardType={keyboardType} 
          multiline={multiline} 
          numberOfLines={multiline ? 6 : 1}
          editable={!disabled} />
        {hasError && <View style={styles.errorContainer}><Text style={styles.errorIcon}>⚠️</Text><Text style={styles.errorText}>{validationErrors[field]}</Text></View>}
        {disabled && <Text style={styles.disabledHint}>로그인한 계정의 이메일입니다</Text>}
      </View>
    );
  };

  const renderRadioGroup = (field: keyof ResumeData, label: string, options: Option[]) => {
    const hasError = validationErrors[field] && touchedFields.has(field);
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
        <View style={styles.radioGroup}>
          {options.map(option => (
            <TouchableOpacity key={option.value} style={styles.radioOption} onPress={() => { handleInputChange(field, option.value); handleFieldBlur(field); }}>
              <View style={styles.radio}>{resumeData[field] === option.value && <View style={styles.radioSelected} />}</View>
              <Text style={styles.radioLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {hasError && <View style={styles.errorContainer}><Text style={styles.errorIcon}>⚠️</Text><Text style={styles.errorText}>{validationErrors[field]}</Text></View>}
      </View>
    );
  };

  const renderPicker = (field: keyof ResumeData, label: string, options: Option[], required = false) => {
    const hasError = validationErrors[field] && touchedFields.has(field);
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
        <TouchableOpacity style={[styles.picker, hasError && styles.inputError]} onPress={() => setShowPicker(field)}>
          <Text style={[styles.pickerText, !resumeData[field] && styles.placeholderText]}>
            {resumeData[field] ? options.find(opt => opt.value === resumeData[field])?.label : '선택하세요'}
          </Text>
          <Text style={styles.pickerIcon}>▼</Text>
        </TouchableOpacity>
        {hasError && <View style={styles.errorContainer}><Text style={styles.errorIcon}>⚠️</Text><Text style={styles.errorText}>{validationErrors[field]}</Text></View>}
        <Modal visible={showPicker === field} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPicker(null)}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}><Text style={styles.pickerTitle}>{label}</Text><TouchableOpacity onPress={() => setShowPicker(null)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity></View>
              <ScrollView>
                {options.map(option => (
                  <TouchableOpacity key={option.value} style={styles.pickerOption} onPress={() => { handleInputChange(field, option.value); handleFieldBlur(field); setShowPicker(null); }}>
                    <Text style={styles.pickerOptionText}>{option.label}</Text>
                    {resumeData[field] === option.value && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return (
        <>
          {renderInput('name', '성명', '홍길동', true)}
          {renderInput('birthYear', '출생년도', '4자리 (예: 1995)', true, 'numeric')}
          {renderRadioGroup('gender', '성별', [{ value: 'MALE', label: '남성' }, { value: 'FEMALE', label: '여성' }])}
          {renderInput('address', '주소', '정확한 주소를 입력하세요', true)}
          
          <View style={{ height: 20 }} />

          {renderInput('email', '이메일', 'example@email.com', true, 'email-address', false, true)}
          {renderInput('phone', '휴대전화', '010-1234-5678', true, 'phone-pad')}
          {renderInput('homePhone', '일반전화', '(선택) 02-1234-5678', false, 'phone-pad')}
        </>
      );
      case 1: return (<>{renderInput('schoolName', '학교명', 'OO대학교', true)}{renderInput('major', '전공명', '컴퓨터공학과', true)}{renderInput('period', '재학기간', '입학년월 ~ 졸업년월 (예: 2018.03 ~ 2022.02)', true)}{renderPicker('status', '재학상태', [{ value: 'ATTENDING', label: '재학중' }, { value: 'GRADUATED', label: '졸업' }, { value: 'COMPLETED', label: '수료' }, { value: 'DROPOUT', label: '중퇴' }], true)}{renderInput('gpa', '학점', '(선택) 학점/만점 (예: 3.8/4.5)', false)}</>);
      case 2: return (<>{renderInput('desiredJob', '희망직종', '예: 프론트엔드 개발자, UI/UX 디자이너', true)}{renderPicker('experienceLevel', '경력수준', [{ value: 'NEWCOMER', label: '신입' }, { value: 'JUNIOR', label: '주니어 (1~5년)' }, { value: 'SENIOR', label: '시니어 (5년 이상)' }], true)}{renderInput('description', '희망직무내용', '담당하고 싶은 역할, 사용하고 싶은 기술, 성장하고 싶은 분야 등을 자유롭게 작성해주세요. (예: React와 TypeScript를 사용한 프론트엔드 개발에 기여하고 싶습니다.)', false, 'default', true)}</>);
      case 3: return (<>{renderInput('desiredRegion', '희망 근무 지역', '예: 서울 강남구 / 재택근무', true)}{renderInput('desiredSalary', '희망임금', '예: 연봉 3,500만원', true)}{renderPicker('employmentType', '고용형태', [{ value: 'FULL_TIME', label: '정규직' }, { value: 'PART_TIME', label: '파트타임' }, { value: 'INTERN', label: '인턴십' }], true)}{renderInput('desiredHours', '희망근무시간', '(선택) 예: 09:00 ~ 18:00', false)}</>);
      default: return <View />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePrev} disabled={currentStep === 0} style={styles.headerButton}>
            <Text style={[styles.headerIcon, currentStep === 0 && styles.headerIconDisabled]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>이력서 작성</Text>
            <Text style={styles.headerSubtitle}>{currentStep + 1} / {steps.length} 단계</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${getProgress()}%` }]} /></View></View>

        <View style={styles.stepIndicator}>
          {steps.map((step, index) => {
            const isActive = index === currentStep; const isCompleted = index < currentStep;
            return (
              <View key={step.id} style={styles.stepItem}>
                <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isCompleted && styles.stepCircleCompleted]}>
                  <Text style={[styles.stepIcon, (isActive || isCompleted) && styles.stepIconActive]}>{isCompleted ? '✓' : step.icon}</Text>
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                {index < steps.length - 1 && <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />}
              </View>
            );
          })}
        </View>

        <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.cardIcon}>{steps[currentStep].icon}</Text><Text style={styles.cardTitle}>{steps[currentStep].label}</Text></View>
            <View style={styles.cardContent}>{renderStepContent()}</View>
          </View>
        </ScrollView>

        <View style={styles.bottomButtons}>
          {currentStep > 0 && <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={handlePrev}><Text style={styles.buttonOutlineText}>이전</Text></TouchableOpacity>}
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity style={[styles.button, styles.buttonPrimary, !canProceedToNext() && styles.buttonDisabled]} onPress={handleNext} disabled={!canProceedToNext()}><Text style={styles.buttonPrimaryText}>다음</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.button, styles.buttonPrimary, !canProceedToNext() && styles.buttonDisabled]} onPress={handlePreview} disabled={!canProceedToNext()}><Text style={styles.buttonIcon}>💾</Text><Text style={styles.buttonPrimaryText}>저장하기</Text></TouchableOpacity>
          )}
        </View>

        <Modal visible={showPreviewModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.previewModal}>
              <View style={styles.previewHeader}><Text style={styles.previewTitle}>📄 최종 검토</Text></View>
              <ScrollView style={styles.previewContent}>
                {Object.entries(resumeData).map(([key, value]) => {
                  if (value) {
                    return (
                      <View key={key} style={styles.previewRow}>
                        <Text style={styles.previewLabel}>{dataLabels[key as keyof ResumeData]}</Text>
                        <Text style={styles.previewValue}>{value}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </ScrollView>
              <View style={styles.modalBottomButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.editButton]} onPress={() => setShowPreviewModal(false)}><Text style={styles.editButtonText}>수정하기</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleFinalSave}><Text style={styles.saveButtonText}>최종 저장</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}