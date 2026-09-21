'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { normalizeKnowledge } from '@/lib/knowledge';
import { Knowledge, PolicyCategory } from '@/types/database';

function isMissingTagsColumn(message: string): boolean {
  return /tags/i.test(message) && /column|schema cache|does not exist/i.test(message);
}

type KnowledgeWrite = {
  title?: string;
  content?: string;
  category_id?: number | null;
  tags?: string[];
};

export function useKnowledges() {
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const needsAuthorInput = !authorName.trim();

  const fetchData = useCallback(async () => {
    const [{ data: catData, error: catError }, { data: knowData, error: knowError }] = await Promise.all([
      supabase.from('policy_categories').select('*').order('id'),
      supabase.from('knowledges').select('*').order('updated_at', { ascending: false }),
    ]);

    if (catError) setLoadError(catError.message);
    if (knowError) setLoadError(knowError.message);
    if (catData) setCategories(catData);
    if (knowData) setKnowledges(knowData.map((row) => normalizeKnowledge(row)));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .maybeSingle();
        const name = profile?.name || session.user.user_metadata?.full_name || '';
        if (name) setAuthorName(name);
      }
      await fetchData();
    };
    init();
  }, [fetchData]);

  const ensureAuthor = () => {
    if (!authorName.trim()) {
      return 'ナレッジを追加・編集する前に、最終更新者名を入力してください。';
    }
    return null;
  };

  const addCategory = async (parentId: number | null, name: string) => {
    const authorError = ensureAuthor();
    if (authorError) return { error: authorError, data: null as PolicyCategory | null };
    const trimmed = name.trim();
    if (!trimmed) return { error: null, data: null as PolicyCategory | null };

    const { data, error } = await supabase
      .from('policy_categories')
      .insert([{ name: trimmed, parent_id: parentId, created_by_name: authorName.trim() }])
      .select()
      .single();

    if (error) return { error: error.message, data: null as PolicyCategory | null };
    setCategories((prev) => [...prev, data]);
    return { error: null, data: data as PolicyCategory };
  };

  const updateCategory = async (id: number, name: string) => {
    const authorError = ensureAuthor();
    if (authorError) return { error: authorError, data: null as PolicyCategory | null };
    const trimmed = name.trim();
    if (!trimmed) return { error: '名前を入力してください。', data: null as PolicyCategory | null };

    const { data, error } = await supabase
      .from('policy_categories')
      .update({ name: trimmed })
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, data: null as PolicyCategory | null };
    setCategories((prev) => prev.map((item) => (item.id === id ? data : item)));
    return { error: null, data: data as PolicyCategory };
  };

  const writeKnowledge = async (
    includeTags: boolean,
    payload: Record<string, unknown>,
    mode: 'insert' | 'update',
    id?: number
  ) => {
    const body = includeTags ? payload : Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== 'tags')
    );

    if (mode === 'insert') {
      return supabase.from('knowledges').insert([body]).select().single();
    }
    return supabase.from('knowledges').update(body).eq('id', id).select().single();
  };

  const addKnowledge = async (categoryId: number) => {
    const authorError = ensureAuthor();
    if (authorError) return { error: authorError, data: null as Knowledge | null };

    const payload = {
      category_id: categoryId,
      title: '無題のドキュメント',
      content: '',
      tags: [] as string[],
      author_name: authorName.trim(),
    };

    let result = await writeKnowledge(true, payload, 'insert');
    if (result.error && isMissingTagsColumn(result.error.message)) {
      result = await writeKnowledge(false, payload, 'insert');
    }
    if (result.error) return { error: result.error.message, data: null as Knowledge | null };

    const created = normalizeKnowledge({
      ...result.data,
      tags: payload.tags,
    });
    setKnowledges((prev) => [created, ...prev]);
    return { error: null, data: created };
  };

  const updateKnowledge = async (id: number, patch: KnowledgeWrite) => {
    const authorError = ensureAuthor();
    if (authorError) return { error: authorError, data: null as Knowledge | null };

    const payload: Record<string, unknown> = {
      ...patch,
      author_name: authorName.trim(),
      updated_at: new Date().toISOString(),
    };

    let result = await writeKnowledge(true, payload, 'update', id);
    if (result.error && isMissingTagsColumn(result.error.message)) {
      result = await writeKnowledge(false, payload, 'update', id);
    }
    if (result.error) return { error: result.error.message, data: null as Knowledge | null };

    const updated = normalizeKnowledge({
      ...result.data,
      tags: patch.tags ?? result.data.tags,
    });
    setKnowledges((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return { error: null, data: updated };
  };

  const deleteKnowledge = async (id: number) => {
    const { error } = await supabase.from('knowledges').delete().eq('id', id);
    if (error) return { error: error.message };
    setKnowledges((prev) => prev.filter((item) => item.id !== id));
    return { error: null };
  };

  return {
    categories,
    knowledges,
    authorName,
    setAuthorName,
    needsAuthorInput,
    isLoading,
    loadError,
    addCategory,
    updateCategory,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
  };
}
