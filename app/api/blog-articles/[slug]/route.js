import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogArticle from '@/models/BlogArticle';

// GET single published blog article by slug (public)
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { slug } = await params;
    const article = await BlogArticle.findOne({
      slug,
      status: 'published',
    }).lean();

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await BlogArticle.findByIdAndUpdate(article._id, {
      $inc: { 'analytics.views': 1 },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching blog article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog article' },
      { status: 500 }
    );
  }
}
