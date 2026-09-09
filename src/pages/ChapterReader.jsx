import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Heart, MessageCircle, Send, Reply, Coffee, UserCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchAllChapterRows } from '../lib/fetchAllChapterRows'
import { useAuth } from '../lib/AuthContext'

export default function ChapterReader() {
  const { slug, number } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [novel, setNovel] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)

  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: novelData } = await supabase
        .from('novels')
        .select('id, title, slug')
        .eq('slug', slug)
        .single()

      if (!novelData) {
        setLoading(false)
        return
      }
      setNovel(novelData)

      const { data: chapterData } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelData.id)
        .eq('chapter_number', number)
        .single()
      setChapter(chapterData)

      const allChapters = await fetchAllChapterRows(novelData.id, 'chapter_number')
      setSiblings(allChapters ?? [])

      if (user && chapterData) {
        await supabase.from('bookmarks').upsert(
          {
            user_id: user.id,
            novel_id: novelData.id,
            last_chapter_read: Number(number),
          },
          { onConflict: 'user_id,novel_id' },
        )
        await supabase.from('chapter_reads').upsert(
          {
            chapter_id: chapterData.id,
            novel_id: novelData.id,
            user_id: user.id,
          },
          { onConflict: 'chapter_id,user_id' },
        )
      }

      setLoading(false)
    }
    load()
  }, [slug, number, user])

  useEffect(() => {
    if (chapter?.id && novel?.id) {
      supabase
        .rpc('increment_chapter_views', {
          target_chapter_id: chapter.id,
          target_novel_id: novel.id,
        })
        .then(({ error }) => {
          if (!error) {
            setChapter((prev) => (prev ? { ...prev, views: (prev.views ?? 0) + 1 } : prev))
          }
        })
    }
  }, [chapter?.id])

  useEffect(() => {
    async function loadLikes() {
      if (!chapter?.id) return

      const { count } = await supabase
        .from('chapter_likes')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapter.id)
      setLikeCount(count ?? 0)

      if (user) {
        const { data } = await supabase
          .from('chapter_likes')
          .select('id')
          .eq('chapter_id', chapter.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setLiked(!!data)
      } else {
        setLiked(false)
      }
    }
    loadLikes()
  }, [chapter?.id, user])

  useEffect(() => {
    if (chapter?.id) loadComments()
  }, [chapter?.id])

  async function loadComments() {
    setLoadingComments(true)
    const { data } = await supabase
      .from('chapter_comments')
      .select('id, content, created_at, user_id, parent_id, profiles(display_name)')
      .eq('chapter_id', chapter.id)
      .order('created_at', { ascending: false })
    setComments(data ?? [])
    setLoadingComments(false)
  }

  async function handlePostComment(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!newComment.trim()) return

    setPostingComment(true)
    const { error } = await supabase.from('chapter_comments').insert({
      chapter_id: chapter.id,
      user_id: user.id,
      content: newComment.trim(),
    })
    setPostingComment(false)

    if (!error) {
      setNewComment('')
      loadComments()
    }
        }
