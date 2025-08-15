import { loadMdxFile, parseMdxContent, extractMdxMetadata } from '../mdxLoader'

// Mock gray-matter
jest.mock('gray-matter', () => ({
  __esModule: true,
  default: jest.fn()
}))

const mockGrayMatter = jest.mocked(jest.requireMock('gray-matter').default)

describe('mdxLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('parseMdxContent', () => {
    it('should parse MDX content with frontmatter', () => {
      const mdxContent = `---
title: Test Guide
description: A test guide for testing
order: 1
---

# Test Guide

This is a test guide content.

\`\`\`dql
{ name }
\`\`\`
`

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1
        },
        content: `# Test Guide

This is a test guide content.

\`\`\`dql
{ name }
\`\`\``
      })

      const result = parseMdxContent(mdxContent)

      expect(result).toMatchObject({
        metadata: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1
        },
        content: expect.stringContaining('# Test Guide')
      })
    })

    it('should handle MDX content without frontmatter', () => {
      const mdxContent = `# Test Guide

This is a test guide content.

\`\`\`dql
{ name }
\`\`\``

      mockGrayMatter.mockReturnValue({
        data: {},
        content: mdxContent
      })

      const result = parseMdxContent(mdxContent)

      expect(result).toMatchObject({
        metadata: {},
        content: mdxContent
      })
    })

    it('should handle empty MDX content', () => {
      const mdxContent = ''

      mockGrayMatter.mockReturnValue({
        data: {},
        content: ''
      })

      const result = parseMdxContent(mdxContent)

      expect(result).toMatchObject({
        metadata: {},
        content: ''
      })
    })

    it('should handle MDX content with only frontmatter', () => {
      const mdxContent = `---
title: Test Guide
description: A test guide for testing
---

`

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Test Guide',
          description: 'A test guide for testing'
        },
        content: ''
      })

      const result = parseMdxContent(mdxContent)

      expect(result).toMatchObject({
        metadata: {
          title: 'Test Guide',
          description: 'A test guide for testing'
        },
        content: ''
      })
    })
  })

  describe('extractMdxMetadata', () => {
    it('should extract metadata from parsed MDX content', () => {
      const parsedContent = {
        metadata: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1,
          tags: ['dql', 'guide']
        },
        content: '# Test Guide\n\nContent here...'
      }

      const metadata = extractMdxMetadata(parsedContent)

      expect(metadata).toEqual({
        title: 'Test Guide',
        description: 'A test guide for testing',
        order: 1,
        tags: ['dql', 'guide']
      })
    })

    it('should handle metadata with missing fields', () => {
      const parsedContent = {
        metadata: {
          title: 'Test Guide'
          // Missing description, order, tags
        },
        content: '# Test Guide\n\nContent here...'
      }

      const metadata = extractMdxMetadata(parsedContent)

      expect(metadata).toEqual({
        title: 'Test Guide'
      })
    })

    it('should handle empty metadata', () => {
      const parsedContent = {
        metadata: {},
        content: '# Test Guide\n\nContent here...'
      }

      const metadata = extractMdxMetadata(parsedContent)

      expect(metadata).toEqual({})
    })

    it('should handle undefined metadata', () => {
      const parsedContent = {
        metadata: undefined,
        content: '# Test Guide\n\nContent here...'
      }

      const metadata = extractMdxMetadata(parsedContent)

      expect(metadata).toEqual({})
    })
  })

  describe('loadMdxFile', () => {
    it('should load and parse MDX file successfully', async () => {
      const mockFileContent = `---
title: Test Guide
description: A test guide for testing
order: 1
---

# Test Guide

This is a test guide content.

\`\`\`dql
{ name }
\`\`\``

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1
        },
        content: `# Test Guide

This is a test guide content.

\`\`\`dql
{ name }
\`\`\``
      })

      // Mock fetch to return file content
      global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve(mockFileContent)
      })

      const result = await loadMdxFile('test-guide.mdx')

      expect(result).toMatchObject({
        metadata: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1
        },
        content: expect.stringContaining('# Test Guide')
      })
      expect(fetch).toHaveBeenCalledWith('test-guide.mdx')
    })

    it('should handle fetch errors gracefully', async () => {
      // Mock fetch to throw error
      global.fetch = jest.fn().mockRejectedValue(new Error('File not found'))

      await expect(loadMdxFile('nonexistent.mdx')).rejects.toThrow('File not found')
      expect(fetch).toHaveBeenCalledWith('nonexistent.mdx')
    })

    it('should handle network errors', async () => {
      // Mock fetch to throw network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      await expect(loadMdxFile('test-guide.mdx')).rejects.toThrow('Network error')
    })

    it('should handle malformed MDX content', async () => {
      const malformedContent = `---
title: Test Guide
description: A test guide for testing
order: 1
# Missing closing ---

# Test Guide

This is a test guide content.`

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1
        },
        content: `# Test Guide

This is a test guide content.`
      })

      global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve(malformedContent)
      })

      const result = await loadMdxFile('malformed.mdx')

      // Should still return parsed content even if malformed
      expect(result).toMatchObject({
        metadata: {
          title: 'Test Guide',
          description: 'A test guide for testing',
          order: 1
        },
        content: expect.stringContaining('# Test Guide')
      })
    })
  })

  describe('MDX content parsing edge cases', () => {
    it('should handle MDX with complex frontmatter', () => {
      const complexMdx = `---
title: "Complex Guide with 'quotes' and \"double quotes\""
description: |
  A multi-line description
  with line breaks
  and special characters: !@#$%^&*()
order: 42
tags:
  - dql
  - "graph database"
  - 'tutorial'
author:
  name: "John Doe"
  email: john@example.com
date: 2024-01-01
---

# Complex Guide

Content here...`

      mockGrayMatter.mockReturnValue({
        data: {
          title: "Complex Guide with 'quotes' and \"double quotes\"",
          description: "A multi-line description\nwith line breaks\nand special characters: !@#$%^&*()",
          order: 42,
          tags: ['dql', 'graph database', 'tutorial'],
          author: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          date: '2024-01-01'
        },
        content: '# Complex Guide\n\nContent here...'
      })

      const result = parseMdxContent(complexMdx)

      expect(result.metadata.title).toBe("Complex Guide with 'quotes' and \"double quotes\"")
      expect(result.metadata.tags).toEqual(['dql', 'graph database', 'tutorial'])
      expect(result.metadata.author).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })

    it('should handle MDX with code blocks in frontmatter', () => {
      const mdxWithCodeInFrontmatter = `---
title: Code Example Guide
description: "Guide with code: \`{ name }\`"
example: |
  \`\`\`dql
  { name }
  \`\`\`
---

# Code Example Guide

Content here...`

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Code Example Guide',
          description: 'Guide with code: `{ name }`',
          example: '```dql\n{ name }\n```'
        },
        content: '# Code Example Guide\n\nContent here...'
      })

      const result = parseMdxContent(mdxWithCodeInFrontmatter)

      expect(result.metadata.example).toBe('```dql\n{ name }\n```')
    })

    it('should handle MDX with special characters in content', () => {
      const mdxWithSpecialChars = `---
title: Special Characters Guide
---

# Special Characters Guide

This guide contains special characters: !@#$%^&*()_+-=[]{}|;':",./<>?

And DQL queries:

\`\`\`dql
{ 
  name @filter(regexp(name, ".*[!@#$%^&*()].*"))
  age @filter(gt(age, 18))
}
\`\`\``

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Special Characters Guide'
        },
        content: `# Special Characters Guide

This guide contains special characters: !@#$%^&*()_+-=[]{}|;':",./<>?

And DQL queries:

\`\`\`dql
{ 
  name @filter(regexp(name, ".*[!@#$%^&*()].*"))
  age @filter(gt(age, 18))
}
\`\`\``
      })

      const result = parseMdxContent(mdxWithSpecialChars)

      expect(result.content).toContain('!@#$%^&*()_+-=[]{}|;\\\'":",./<>?')
      expect(result.content).toContain('regexp(name, ".*[!@#$%^&*()].*")')
    })
  })

  describe('error handling and validation', () => {
    it('should handle gray-matter parsing errors', () => {
      mockGrayMatter.mockImplementation(() => {
        throw new Error('Invalid YAML frontmatter')
      })

      expect(() => {
        parseMdxContent('---\ninvalid: yaml: content\n---\n# Content')
      }).toThrow('Invalid YAML frontmatter')
    })

    it('should handle null content gracefully', () => {
      mockGrayMatter.mockReturnValue({
        data: null,
        content: null
      })

      const result = parseMdxContent('')

      expect(result).toMatchObject({
        metadata: {},
        content: ''
      })
    })

    it('should handle undefined content gracefully', () => {
      mockGrayMatter.mockReturnValue({
        data: undefined,
        content: undefined
      })

      const result = parseMdxContent('')

      expect(result).toMatchObject({
        metadata: {},
        content: ''
      })
    })
  })

  describe('performance and large files', () => {
    it('should handle large MDX files efficiently', async () => {
      const largeContent = `---
title: Large Guide
description: A very large guide
---

${'# Large Guide\n\n'.repeat(1000)}
${'This is a very long content section that repeats many times.\n\n'.repeat(1000)}
${'```dql\n{ name age email }\n```\n\n'.repeat(100)}`

      mockGrayMatter.mockReturnValue({
        data: {
          title: 'Large Guide',
          description: 'A very large guide'
        },
        content: largeContent.replace(/^---[\s\S]*?---\n/, '')
      })

      global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve(largeContent)
      })

      const startTime = performance.now()
      const result = await loadMdxFile('large-guide.mdx')
      const endTime = performance.now()

      // Should process large content in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(result.content.length).toBeGreaterThan(10000)
      expect(result.metadata.title).toBe('Large Guide')
    })
  })
})
