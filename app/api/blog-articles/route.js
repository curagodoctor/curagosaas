import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogArticle from '@/models/BlogArticle';

// GET published blog articles (public)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 9;
    const skip = (page - 1) * limit;

    // Only fetch published articles
    const query = { status: 'published' };
    if (category) query.category = category;

    const [articles, total] = await Promise.all([
      BlogArticle.find(query)
        .select('title slug metaDescription featuredImage category publishedAt analytics.views')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogArticle.countDocuments(query),
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog articles' },
      { status: 500 }
    );
  }
}
