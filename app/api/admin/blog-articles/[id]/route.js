import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BlogArticle from '@/models/BlogArticle';
import { isAuthenticated } from '@/lib/auth';
import { getCurrentDoctor } from '@/lib/doctorAuth';

// GET single blog article by ID (admin only)
export async function GET(request, { params }) {
  try {
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    const { id } = await params;

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const article = await BlogArticle.findOne(query);

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
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    // If changing slug, check if it's unique for this doctor
    if (updates.slug) {
      const slugQuery = {
        slug: updates.slug,
        _id: { $ne: id },
      };
      if (doctorId) slugQuery.doctorId = doctorId;

      const existingArticle = await BlogArticle.findOne(slugQuery);
      if (existingArticle) {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Filter out empty FAQ entries
    if (updates.faqSection?.faqs) {
      updates.faqSection.faqs = updates.faqSection.faqs.filter(
        faq => faq.question?.trim() || faq.answer?.trim()
      );
    }

    // Filter out empty audit steps
    if (updates.surgicalAuditSection?.auditSteps) {
      updates.surgicalAuditSection.auditSteps = updates.surgicalAuditSection.auditSteps.filter(
        step => step.step?.trim() || step.description?.trim()
      );
    }

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const article = await BlogArticle.findOneAndUpdate(
      query,
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
    if (!(await isAuthenticated(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    const { id } = await params;

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const article = await BlogArticle.findOneAndDelete(query);

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
