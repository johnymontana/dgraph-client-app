import { NextResponse } from 'next/server';
import { getAllGuides, getGuideBySlug } from '@/utils/mdxLoader';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  try {
    // If a specific guide is requested by slug
    if (slug) {
      const guide = getGuideBySlug(slug);
      return NextResponse.json(guide);
    }
    
    // Otherwise return all guides (metadata only)
    const guides = getAllGuides();
    return NextResponse.json(guides);
  } catch (error) {
    console.error('Error loading guides:', error);
    return NextResponse.json(
      { error: 'Failed to load guides' },
      { status: 500 }
    );
  }
}
