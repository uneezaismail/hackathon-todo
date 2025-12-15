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
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
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
      if (!search.trim()) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      const result = await fetchTags({ search, limit: 10 })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
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
      <Label htmlFor="tag-input">Tags</Label>

      {/* Selected tags display with remove buttons (T054) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-1"
            >
              <span>{tag}</span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
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
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            disabled={disabled}
            placeholder="Type to search or add new tag..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || !inputValue.trim()}
            onClick={() => handleAddTag(inputValue)}
            title="Add tag"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* T053: Autocomplete suggestions dropdown */}
        {showSuggestions && inputValue.trim() && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
            ) : suggestions.length > 0 ? (
              <ul className="py-1">
                {suggestions.map((tag) => (
                  <li key={tag.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(tag.name)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between group"
                    >
                      <span className="font-medium">{tag.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tag.usage_count} {tag.usage_count === 1 ? 'use' : 'uses'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              // T055: Visual feedback for new tag
              <div className="p-3">
                <button
                  type="button"
                  onClick={() => handleAddTag(inputValue)}
                  className="w-full text-left hover:bg-accent p-2 rounded-sm"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Create new tag: <strong className="text-green-600">{inputValue}</strong>
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
