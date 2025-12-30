/**
 * T042: Tag Input Component with Autocomplete
 *
 * Allows users to add/remove tags with autocomplete suggestions
 * Includes:
 * - T052: Creating new tags on-the-fly
 * - T053: Tag suggestion dropdown
 * - T054: Tag badge removal UI (X button)
 * - T055: Visual feedback for new vs existing tags
 * - T056: Debounced autocomplete API calls (300ms)
 * Fully responsive with beautiful styling for light and dark modes
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchTags } from '@/actions/tasks'
import type { Tag } from '@/types/task'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
  className?: string
}

export function TagInput({
  value,
  onChange,
  disabled = false,
  className = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // T056: Debounced autocomplete API call (300ms)
  const debouncedFetchSuggestions = useDebouncedCallback(
    async (search: string) => {
      setIsLoading(true)
      // Fetch tags with optional search parameter
      // If search is empty, backend returns all tags (up to limit)
      const result = await fetchTags({
        search: search.trim() || undefined,
        limit: 20
      })
      setIsLoading(false)

      if (result.tags) {
        // Filter out already selected tags
        const filtered = result.tags.filter((tag) => !value.includes(tag.name))
        setSuggestions(filtered)
      }
    },
    300 // 300ms debounce
  )

  useEffect(() => {
    debouncedFetchSuggestions(inputValue)
  }, [inputValue, debouncedFetchSuggestions])

  // Fetch all tags when component mounts or when value changes (to update filtered suggestions)
  useEffect(() => {
    if (showSuggestions) {
      debouncedFetchSuggestions(inputValue)
    }
  }, [value]) // Re-fetch when selected tags change to update filtered list

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
  }

  // Fetch all tags on focus
  const handleFocus = async () => {
    setShowSuggestions(true)
    // Immediately fetch tags without debounce on focus
    if (suggestions.length === 0 && !isLoading) {
      setIsLoading(true)
      const result = await fetchTags({ limit: 20 })
      setIsLoading(false)
      if (result.tags) {
        const filtered = result.tags.filter((tag) => !value.includes(tag.name))
        setSuggestions(filtered)
      }
    }
  }

  // T052: Add tag (existing or new)
  const handleAddTag = (tagName: string) => {
    const trimmedTag = tagName.trim()
    if (!trimmedTag) return
    if (value.includes(trimmedTag)) return

    onChange([...value, trimmedTag])
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // T054: Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  // T053: Select suggestion
  const handleSelectSuggestion = (tagName: string) => {
    handleAddTag(tagName)
  }

  // T055: Check if tag would be new
  const wouldBeNewTag = useCallback(
    (tagName: string) => {
      return !suggestions.some((s) => s.name === tagName.trim())
    },
    [suggestions]
  )

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="tag-input" className="text-sm font-semibold text-white/90">
        Tags <span className="text-white/40 font-normal text-xs ml-1">(optional)</span>
      </Label>

      {/* Selected tags display with remove buttons (T054) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 sm:p-4 rounded-xl bg-[#1a2332]/50 border-2 border-white/5">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00d4b8]/10 text-[#00d4b8] border border-[#00d4b8]/30 hover:bg-[#00d4b8]/20 transition-all text-sm font-medium rounded-lg"
            >
              <span className="break-all">{tag}</span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent hover:text-white transition-colors flex-shrink-0"
                  onClick={() => handleRemoveTag(tag)}
                  title={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Input field with autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            id="tag-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            disabled={disabled}
            placeholder="Type to search or add new tag..."
            className="flex-1 h-12 rounded-xl bg-[#1a2332]/80 border-2 border-white/10 text-white placeholder:text-white/40 focus:bg-[#1a2332] focus:border-[#00d4b8]/60 focus:shadow-[0_0_20px_rgba(0,212,184,0.2)] transition-all duration-300"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || !inputValue.trim()}
            onClick={() => handleAddTag(inputValue)}
            title="Add tag"
            className="h-12 w-12 rounded-xl border-2 border-white/10 bg-[#1a2332]/80 text-[#00d4b8] hover:bg-[#00d4b8]/10 hover:border-[#00d4b8]/50 hover:text-[#00d4b8] transition-all duration-200 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* T053: Autocomplete suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-2 bg-[#131929] border-2 border-[#00d4b8]/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-white/60 text-center">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2 text-[#00d4b8]" />
                Loading...
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="py-2">
                {suggestions.map((tag) => (
                  <li key={tag.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(tag.name)}
                      className="w-full px-3 sm:px-4 py-2.5 text-left hover:bg-[#00d4b8]/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 group"
                    >
                      <span className="font-semibold text-white group-hover:text-[#00d4b8] transition-colors text-sm sm:text-base break-all">{tag.name}</span>
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                        {tag.usage_count} {tag.usage_count === 1 ? 'use' : 'uses'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : inputValue.trim() ? (
              // T055: Visual feedback for new tag (only show when user has typed something)
              <div className="p-2 sm:p-3">
                <button
                  type="button"
                  onClick={() => handleAddTag(inputValue)}
                  className="w-full text-left hover:bg-[#00d4b8]/5 transition-all p-2 sm:p-3 rounded-lg border-2 border-transparent hover:border-[#00d4b8]/30"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#00d4b8]/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="h-4 w-4 text-[#00d4b8]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm text-white font-medium">Create new tag</div>
                      <div className="text-xs text-[#00d4b8] font-semibold truncate">{inputValue}</div>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              // No suggestions and empty input - show message
              <div className="p-3 text-sm text-white/40 text-center">
                No tags yet. Type to create your first tag!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
