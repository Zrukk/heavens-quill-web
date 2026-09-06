import { supabase } from './supabase'

// Supabase/PostgREST balikin maksimal 1000 baris per request secara default.
// Fungsi ini looping pakai .range() sampai semua baris kebawa, jadi
// novel dengan ribuan chapter tetap ke-load lengkap.
export async function fetchAllChapterRows(novelId, selectStr) {
  const pageSize = 1000
  let allRows = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('chapters')
      .select(selectStr)
      .eq('novel_id', novelId)
      .order('chapter_number', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error || !data) break
    allRows = allRows.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

  return allRows
}
