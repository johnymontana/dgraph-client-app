import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define the guides directory
const guidesDirectory = path.join(process.cwd(), 'src/mdx/guides');

// Interface for guide metadata
export interface GuideMetadata {
  title: string;
  description: string;
  order: number;
  slug: string;
}

// Get all guide files
export function getGuideFiles(): string[] {
  return fs.readdirSync(guidesDirectory).filter(file => file.endsWith('.mdx'));
}

// Get all guides with their metadata
export function getAllGuides(): GuideMetadata[] {
  const guideFiles = getGuideFiles();
  
  const guides = guideFiles.map(filename => {
    // Get the slug from the filename
    const slug = filename.replace(/\.mdx$/, '');
    
    // Read the file content
    const fullPath = path.join(guidesDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    
    // Use gray-matter to parse the metadata section
    const { data } = matter(fileContents);
    
    // Return metadata with slug
    return {
      title: data.title || 'Untitled Guide',
      description: data.description || '',
      order: data.order || 999,
      slug,
    };
  });
  
  // Sort guides by their order
  return guides.sort((a, b) => a.order - b.order);
}

// Get a specific guide by slug
export function getGuideBySlug(slug: string): { content: string; metadata: GuideMetadata } {
  const fullPath = path.join(guidesDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  
  // Use gray-matter to parse the metadata section
  const { data, content } = matter(fileContents);
  
  // Return metadata and content
  return {
    content,
    metadata: {
      title: data.title || 'Untitled Guide',
      description: data.description || '',
      order: data.order || 999,
      slug,
    }
  };
}

// Extract DQL queries from guide content
export function extractQueriesFromContent(content: string): string[] {
  const queryRegex = /```dql-query\n([\s\S]*?)```/g;
  const queries: string[] = [];
  let match;
  
  while ((match = queryRegex.exec(content)) !== null) {
    queries.push(match[1].trim());
  }
  
  return queries;
}
