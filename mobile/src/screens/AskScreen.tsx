import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, errorMessage, fieldError, isAbortError } from '../api/client';
import { api } from '../api/endpoints';
import type { Department, Hub, School } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { FormError, Input } from '../components/Form';
import { Icon } from '../components/Icon';
import { KeyboardAvoid } from '../components/KeyboardAvoid';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { Sheet } from '../components/Sheet';
import { EmptyState, ErrorState, Loading, SkeletonQuestionList } from '../components/States';
import { Text } from '../components/Text';
import { TopBar } from '../components/TopBar';
import { useAuthGate } from '../features/auth/AuthGateProvider';
import { TagInput } from '../features/questions/TagInput';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { useKeyboard } from '../lib/useKeyboard';
import { useQuery } from '../lib/useQuery';
import { navigateRoot, TabParamList } from '../navigation/types';
import { radii, useTheme } from '../theme';

type Nav = BottomTabNavigationProp<TabParamList, 'Ask'>;

export function AskScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const params = useRoute<RouteProp<TabParamList, 'Ask'>>().params;
  const { isAuthenticated } = useAuth();
  const { promptSignIn } = useAuthGate();
  const { visible: isKeyboardVisible } = useKeyboard();

  const [step, setStep] = useState<'school' | 'form'>('school');
  const [hubId, setHubId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<unknown>(null);
  const [editTry, setEditTry] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsFocused, setTagsFocused] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [selecting, setSelecting] = useState(false);
  const lastNonce = useRef<number | undefined>(undefined);
  const formScroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const formOffset = useRef(0);
  const tagsOffset = useRef(0);

  const resetForm = useCallback(() => {
    setStep('school');
    setHubId(null);
    setSchoolName(null);
    setEditId(null);
    setEditLoading(false);
    setEditError(null);
    setTitle('');
    setBody('');
    setDepartmentId(null);
    setTags([]);
    setSubmitError(null);
    setSearch('');
  }, []);

  useEffect(() => {
    if (params?.nonce === lastNonce.current) return;
    lastNonce.current = params?.nonce;
    setSubmitError(null);

    if (params?.editQuestionId) {
      setEditId(params.editQuestionId);
      setEditLoading(true);
      setEditError(null);
      setEditTry((value) => value + 1);
      setStep('form');
    } else if (params?.hubId) {
      setHubId(params.hubId);
      setSchoolName(params.schoolName ?? null);
      setEditId(null);
      setStep('form');
    } else resetForm();
  }, [params?.nonce, params?.hubId, params?.schoolId, params?.schoolName, params?.editQuestionId, resetForm]);

  // Always load the question fresh when an edit starts, never from a previous fetch.
  useEffect(() => {
    if (!editId) return;
    let active = true;
    const controller = new AbortController();
    api.questions
      .get(editId, controller.signal)
      .then((question) => {
        if (!active) return;
        setHubId(question.hub.id);
        setSchoolName(question.hub.school.name);
        setTitle(question.title);
        setBody(question.body);
        setDepartmentId(question.department?.id ?? null);
        setTags(question.tags);
      })
      .catch((error) => active && !isAbortError(error) && setEditError(error))
      .finally(() => active && setEditLoading(false));
    return () => {
      active = false;
      controller.abort();
    };
  }, [editId, editTry]);

  useEffect(() => {
    if (!tagsFocused) return;
    const timer = setTimeout(() => formScroll.current?.scrollTo({ y: Math.max(0, formOffset.current + tagsOffset.current), animated: true }), 300);
    return () => clearTimeout(timer);
  }, [tagsFocused]);

  const schools = useQuery((signal) => api.schools.list({ has_hub: true, search: debouncedSearch || undefined, page_size: 50 }, signal), [debouncedSearch], { enabled: isAuthenticated && step === 'school' });
  const hubQuery = useQuery<Hub>((signal) => api.hubs.get(hubId!, signal), [hubId], { enabled: Boolean(hubId) && step === 'form' });

  useEffect(() => {
    if (hubQuery.data?.school?.name) setSchoolName(hubQuery.data.school.name);
  }, [hubQuery.data?.school?.name]);

  const departments: Department[] = hubQuery.data?.departments ?? [];
  const departmentName = departments.find((item) => item.id === departmentId)?.name ?? null;
  const editing = Boolean(editId);

  if (!isAuthenticated) {
    return (
      <Screen>
        <TopBar title="Ask a question" />
        <EmptyState icon="user" title="Sign in to ask a question" message="Browsing is open to everyone. Asking needs an account so answers can reach you." actionLabel="Sign in with Google" onAction={() => promptSignIn('Sign in to ask a question.')} />
      </Screen>
    );
  }

  const selectSchool = async (school: School) => {
    setSelecting(true);
    setSubmitError(null);
    try {
      const hub = await api.hubs.bySchool(school.id);
      if (!hub.is_active) throw new ApiError('This school has no active hub yet.', 404);
      setHubId(hub.id);
      setSchoolName(school.name);
      setEditId(null);
      setDepartmentId(null);
      setStep('form');
    } catch (error) {
      setSubmitError(error);
    } finally {
      setSelecting(false);
    }
  };

  const submit = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    const localFields: Record<string, string[]> = {};
    if (!hubId) localFields.hub_id = ['Choose a school first.'];
    if (!cleanTitle) localFields.title = ['This field is required.'];
    if (!cleanBody) localFields.body = ['This field is required.'];
    if (Object.keys(localFields).length > 0) return setSubmitError(new ApiError('Please fix the highlighted fields.', 400, localFields));

    setSubmitting(true);
    setSubmitError(null);
    Keyboard.dismiss();
    try {
      const payload = { title: cleanTitle, body: cleanBody, department_id: departmentId, tags };
      const saved = editing && editId ? await api.questions.update(editId, payload) : await api.questions.create({ ...payload, hub_id: hubId as string });
      const id = editing && editId ? editId : saved.id;
      resetForm();
      navigateRoot('Question', { questionId: id });
    } catch (error) {
      setSubmitError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const fields = submitError instanceof ApiError ? submitError.fields : null;
  const nonField = fields?.non_field_errors;
  const genericError = (Array.isArray(nonField) && typeof nonField[0] === 'string' ? nonField[0] : null) ?? (typeof fields?.detail === 'string' ? fields.detail : null) ?? (submitError instanceof ApiError && !fields ? submitError.message : null);

  if (editing && editLoading) {
    return (
      <Screen>
        <TopBar title="Edit question" />
        <SkeletonQuestionList rows={5} />
      </Screen>
    );
  }

  if (editing && editError) {
    return (
      <Screen>
        <TopBar title="Edit question" />
        <ErrorState error={editError} onRetry={() => { setEditLoading(true); setEditError(null); setEditTry((value) => value + 1); }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={editing ? 'Edit question' : 'Ask a question'} />

      <KeyboardAvoid>
        {step === 'school' ? (
          <FlatList
            data={schools.data?.results ?? []}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View>
                <View style={styles.intro}>
                  <Text variant="h2">Ask a question</Text>
                  <Text size={14} color={colors.muted} style={{ marginTop: 4 }}>
                    Which school is this about?
                  </Text>
                  <View style={{ marginTop: 12 }}>
                    <SearchField value={search} onChangeText={setSearch} placeholder="Search for your school..." />
                  </View>
                  <FormError message={genericError} />
                </View>
                <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }} />
              </View>
            }
            renderItem={({ item }) => (
              <Pressable accessibilityRole="button" accessibilityLabel={item.name} disabled={selecting} onPress={() => selectSchool(item)} style={({ pressed }) => [styles.schoolRow, { borderBottomColor: colors.line, backgroundColor: pressed ? colors.subtle : 'transparent' }]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text size={14} weight="semibold" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text size={12} color={colors.muted} numberOfLines={1}>
                    {item.short_name}
                    {item.location ? ` · ${item.location}` : ''}
                  </Text>
                </View>
                <Icon name="chevronRight" size={12} color={colors.muted} />
              </Pressable>
            )}
            ListEmptyComponent={
              schools.loading ? (
                <Loading />
              ) : schools.error ? (
                <EmptyState icon="building" title="Could not load schools" message={errorMessage(schools.error)} actionLabel="Try again" onAction={schools.refetch} />
              ) : (
                <EmptyState icon="building" title="No schools found" message="Try a different search." />
              )
            }
            ListFooterComponent={
              <View style={styles.directory}>
                <Text size={14} color={colors.muted}>
                  Don&apos;t see your school?{' '}
                  <Text size={14} color={colors.accent} onPress={() => navigation.navigate('Schools')} suppressHighlighting>
                    Browse the full directory
                  </Text>{' '}
                  to request a hub.
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <>
            <ScrollView ref={formScroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: tagsFocused ? 280 : 24 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formHeader}>
                <Text variant="h2">{editing ? 'Edit question' : 'Ask a question'}</Text>
                <Text size={14} color={colors.muted} style={{ marginTop: 4 }}>
                  {editing ? 'Editing in ' : 'Posting to '}
                  <Text size={14} weight="semibold">
                    {schoolName ?? hubQuery.data?.school?.name ?? 'this school'}
                  </Text>
                  {!editing ? (
                    <Text size={14} color={colors.accent} onPress={() => setStep('school')} suppressHighlighting>
                      {' '}
                      (change school)
                    </Text>
                  ) : null}
                </Text>
              </View>

              <View style={{ paddingHorizontal: 16 }} onLayout={(event) => { formOffset.current = event.nativeEvent.layout.y; }}>
                <FormError message={genericError} />
                {selecting ? (
                  <Text size={12} color={colors.muted}>
                    Opening school...
                  </Text>
                ) : null}

                <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. When does registration close?" maxLength={200} error={fieldError(submitError, 'title')} />

                <View style={{ marginBottom: 16 }}>
                  <Text size={12} color={colors.muted} style={{ marginBottom: 4 }}>
                    Body
                  </Text>
                  <MarkdownEditor value={body} onChangeText={setBody} placeholder="Describe your question in detail..." minHeight={130} accessibilityLabel="Question body" />
                  {fieldError(submitError, 'body') ? (
                    <Text size={12} color={colors.danger} style={{ marginTop: 4 }}>
                      {fieldError(submitError, 'body')}
                    </Text>
                  ) : null}
                </View>

                <Pressable accessibilityRole="button" accessibilityLabel="Choose department" onPress={() => setDepartmentOpen(true)} style={({ pressed }) => [styles.select, { backgroundColor: colors.surface, borderColor: colors.strong, opacity: pressed ? 0.75 : 1 }]}>
                  <View>
                    <Text size={12} color={colors.muted}>
                      Department (optional)
                    </Text>
                    <Text size={14} color={departmentName ? colors.ink : colors.muted} style={{ marginTop: 2 }}>
                      {departmentName ?? 'None'}
                    </Text>
                  </View>
                  <Icon name="chevronDown" size={12} color={colors.muted} />
                </Pressable>
                {fieldError(submitError, 'department_id') ? (
                  <Text size={12} color={colors.danger} style={{ marginBottom: 12 }}>
                    {fieldError(submitError, 'department_id')}
                  </Text>
                ) : null}

                <View onLayout={(event) => { tagsOffset.current = event.nativeEvent.layout.y; }}>
                  <Text size={12} color={colors.muted} style={{ marginTop: 16, marginBottom: 4 }}>
                    Tags
                  </Text>
                  <TagInput tags={tags} onChange={setTags} error={fieldError(submitError, 'tags')} onFocusChange={setTagsFocused} />
                </View>
                {fieldError(submitError, 'hub_id') ? (
                  <Text size={12} color={colors.danger} style={{ marginTop: 4 }}>
                    {fieldError(submitError, 'hub_id')}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.surface, paddingBottom: isKeyboardVisible ? 12 : Math.max(insets.bottom, 16) }]}>
              <Button title={editing ? 'Save changes' : 'Post question'} onPress={submit} loading={submitting} disabled={submitting} fullWidth />
            </View>
          </>
        )}
      </KeyboardAvoid>

      <Sheet visible={departmentOpen} onClose={() => setDepartmentOpen(false)} title="Department">
        {[{ id: null as string | null, name: 'None' }, ...departments].map((item) => (
          <Pressable
            key={item.id ?? 'none'}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => {
              setDepartmentId(item.id);
              setDepartmentOpen(false);
            }}
            style={styles.departmentRow}
          >
            <Text size={14} color={colors.ink} style={{ flex: 1 }}>
              {item.name}
            </Text>
            {item.id === departmentId ? <Icon name="check" size={14} color={colors.accent} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 60 },
  directory: { paddingHorizontal: 16, paddingTop: 18 },
  formHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 10, minHeight: 58 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  departmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, minHeight: 48 },
});