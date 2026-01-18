'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WaiverContent } from '@/lib/supabase/types'

export default function WaiverManagementPage() {
  const [waiver, setWaiver] = useState<WaiverContent | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchWaiver() {
      const supabase = createClient()
      const { data } = await supabase
        .from('waiver_content')
        .select('*')
        .eq('active', true)
        .single()

      if (data) {
        setWaiver(data)
        setTitle(data.title)
        setContent(data.content)
      }
      setLoading(false)
    }
    fetchWaiver()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    const supabase = createClient()

    if (waiver) {
      // Update existing waiver
      const { error } = await supabase
        .from('waiver_content')
        .update({
          title,
          content,
          version: waiver.version + 1,
        })
        .eq('id', waiver.id)

      if (error) {
        alert('Failed to save: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      // Create new waiver
      const { error } = await supabase
        .from('waiver_content')
        .insert({
          title,
          content,
          active: true,
        })

      if (error) {
        alert('Failed to save: ' + error.message)
        setSaving(false)
        return
      }
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Waiver Content</h1>
        {success && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Saved successfully!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Waiver</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Content (Markdown supported)
              </label>
              <textarea
                id="content"
                rows={20}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 max-h-[600px] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{title || 'Waiver Title'}</h3>
            <div className="prose prose-sm max-w-none">
              {content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace('## ', '')}</h2>
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-md font-semibold mt-3 mb-1">{line.replace('### ', '')}</h3>
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4">{line.replace('- ', '')}</li>
                }
                if (line.trim() === '') {
                  return <br key={i} />
                }
                return <p key={i} className="mb-2">{line}</p>
              })}
            </div>
          </div>
        </div>
      </div>

      {waiver && (
        <div className="text-sm text-gray-500">
          Version {waiver.version} • Last updated: {new Date(waiver.created_at).toLocaleString()}
        </div>
      )}
    </div>
  )
}
