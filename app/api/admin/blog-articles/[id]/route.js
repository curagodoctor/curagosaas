import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BlogArticle from '@/models/BlogArticle';
import { isAuthenticated } from '@/lib/auth';

// GET single blog article by ID (admin only)
export async function GET(request, { params }) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const article = await BlogArticle.findById(id);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching blog article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog article' },
      { status: 500 }
    );
  }
}

// PATCH - Update blog article by ID (admin only)
export async function PATCH(request, { params }) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    // If changing slug, check if it's unique
    if (updates.slug) {
      const existingArticle = await BlogArticle.findOne({
        slug: updates.slug,
        _id: { $ne: id },
      });
      if (existingArticle) {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const article = await BlogArticle.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Blog article updated successfully',
      article,
    });
  } catch (error) {
    console.error('Error updating blog article:', error);
    return NextResponse.json(
      { error: 'Failed to update blog article' },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog article by ID (admin only)
export async function DELETE(request, { params }) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const article = await BlogArticle.findByIdAndDelete(id);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Blog article deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blog article:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog article' },
      { status: 500 }
    );
  }
}
