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
import { cn } from '@/lib/utils'
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
      const result = await fetchTags({ search: search.trim(), limit: 10 })
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
    // Refresh suggestions after adding to exclude the newly added tag
    debouncedFetchSuggestions('')
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
    const newTags = value.filter((tag) => tag !== tagToRemove)
    onChange(newTags)
    // Refresh suggestions to include the removed tag in possibilities
    debouncedFetchSuggestions(inputValue)
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
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor="tag-input"
        className={cn(
          "text-sm font-semibold",
          "dark:text-white light:text-gray-900"
        )}
      >
        Tags <span className="dark:text-gray-500 light:text-gray-500 font-normal text-xs ml-1">(optional)</span>
      </Label>

      {/* Selected tags display with remove buttons (T054) */}
      {value.length > 0 && (
        <div className={cn(
          "flex flex-wrap gap-2 p-3 sm:p-4 rounded-xl border-2 transition-colors",
          "dark:bg-[#1a1a2e]/50 dark:border-[#2a2a3e]",
          "light:bg-purple-50/50 light:border-purple-200"
        )}>
          {value.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium rounded-lg transition-all",
                "dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 dark:hover:bg-purple-500/20",
                "light:bg-purple-100 light:text-purple-700 light:border-purple-300 light:hover:bg-purple-200"
              )}
            >
              <span className="break-all">{tag}</span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-4 w-4 p-0 hover:bg-transparent transition-colors flex-shrink-0",
                    "dark:text-purple-400 dark:hover:text-white",
                    "light:text-purple-700 light:hover:text-purple-900"
                  )}
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
            onFocus={() => {
              setShowSuggestions(true)
              debouncedFetchSuggestions(inputValue)
            }}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            disabled={disabled}
            placeholder="Type to search or select existing tag..."
            className={cn(
              "flex-1 h-12 rounded-xl border-2 font-medium transition-all duration-200",
              // Dark mode
              "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
              "dark:text-white dark:placeholder:text-gray-400",
              "dark:hover:bg-[#2a2a3e] dark:hover:border-purple-500/40",
              "dark:focus:border-purple-500/60 dark:focus:ring-2 dark:focus:ring-purple-500/20",
              // Light mode
              "light:bg-white light:border-gray-200",
              "light:text-gray-900 light:placeholder:text-gray-500",
              "light:hover:bg-gray-50 light:hover:border-purple-400",
              "light:focus:border-purple-500 light:focus:ring-2 light:focus:ring-purple-500/20"
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || !inputValue.trim()}
            onClick={() => handleAddTag(inputValue)}
            title="Add tag"
            className={cn(
              "h-12 w-12 rounded-xl border-2 transition-all duration-200",
              // Dark mode
              "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
              "dark:text-purple-400 dark:hover:bg-purple-500/10 dark:hover:border-purple-500/50",
              // Light mode
              "light:bg-white light:border-gray-200",
              "light:text-purple-600 light:hover:bg-purple-50 light:hover:border-purple-400",
              // Disabled
              "disabled:opacity-50"
            )}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* T053: Autocomplete suggestions dropdown */}
        {showSuggestions && (inputValue.trim() || suggestions.length > 0) && (
          <div className={cn(
            "absolute z-50 w-full mt-2 border-2 rounded-xl shadow-xl max-h-60 overflow-auto",
            "dark:bg-[#1a1a2e] dark:border-[#2a2a3e]",
            "light:bg-white light:border-purple-200"
          )}>
            {isLoading ? (
              <div className={cn(
                "p-4 text-sm text-center",
                "dark:text-gray-400 light:text-gray-600"
              )}>
                <Loader2 className={cn(
                  "h-4 w-4 animate-spin inline mr-2",
                  "dark:text-purple-400 light:text-purple-600"
                )} />
                Loading...
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="py-2">
                {suggestions.map((tag) => (
                  <li key={tag.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectSuggestion(tag.name)}
                      className={cn(
                        "w-full px-3 sm:px-4 py-2.5 text-left transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 group",
                        "dark:hover:bg-purple-500/10 light:hover:bg-purple-50"
                      )}
                    >
                      <span className={cn(
                        "font-semibold transition-colors text-sm sm:text-base break-all",
                        "dark:text-white dark:group-hover:text-purple-400",
                        "light:text-gray-900 light:group-hover:text-purple-700"
                      )}>
                        {tag.name}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                        "dark:text-gray-400 dark:bg-[#2a2a3e]",
                        "light:text-gray-600 light:bg-gray-100"
                      )}>
                        {tag.usage_count} {tag.usage_count === 1 ? 'use' : 'uses'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : inputValue.trim() ? (
              // T055: Visual feedback for new tag
              <div className="p-2 sm:p-3">
                <button
                  type="button"
                  onClick={() => handleAddTag(inputValue)}
                  className={cn(
                    "w-full text-left transition-all p-2 sm:p-3 rounded-lg border-2",
                    "dark:border-transparent dark:hover:bg-purple-500/5 dark:hover:border-purple-500/30",
                    "light:border-transparent light:hover:bg-purple-50 light:hover:border-purple-300"
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      "dark:bg-purple-500/10 light:bg-purple-100"
                    )}>
                      <Plus className={cn(
                        "h-4 w-4",
                        "dark:text-purple-400 light:text-purple-600"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "text-xs sm:text-sm font-medium",
                        "dark:text-white light:text-gray-900"
                      )}>
                        Create new tag
                      </div>
                      <div className={cn(
                        "text-xs font-semibold truncate",
                        "dark:text-purple-400 light:text-purple-700"
                      )}>
                        {inputValue}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
