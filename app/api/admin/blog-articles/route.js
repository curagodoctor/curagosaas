import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogArticle from '@/models/BlogArticle';
import { isAuthenticated } from '@/lib/auth';

// GET all blog articles (admin only)
export async function GET(request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // filter by status
    const category = searchParams.get('category'); // filter by category
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const [articles, total] = await Promise.all([
      BlogArticle.find(query)
        .select('title slug status category publishedAt createdAt analytics.views')
        .sort({ createdAt: -1 })
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

// POST - Create new blog article (admin only)
export async function POST(request) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const data = await request.json();

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    if (!data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Check if slug already exists
    const existingArticle = await BlogArticle.findOne({ slug: data.slug });
    if (existingArticle) {
      return NextResponse.json(
        { error: 'An article with this slug already exists' },
        { status: 400 }
      );
    }

    // Create new article
    const article = new BlogArticle(data);
    await article.save();

    return NextResponse.json({
      message: 'Blog article created successfully',
      article,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog article:', error);
    return NextResponse.json(
      { error: 'Failed to create blog article' },
      { status: 500 }
    );
  }
}
