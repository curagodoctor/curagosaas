import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ForumPost from "@/models/ForumPost";

// GET - Get public forum posts (for display)
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Build query - show public posts (both pending and replied)
    const query = {
      isPublic: true,
      status: { $in: ['pending', 'replied'] },
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const [posts, total] = await Promise.all([
      ForumPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name query category replies createdAt views')
        .lean(),
      ForumPost.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum posts" },
      { status: 500 }
    );
  }
}

// POST - Submit a new forum query
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, query, category } = body;

    // Validation
    if (!name || !email || !query) {
      return NextResponse.json(
        { error: "Name, email, and query are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Create forum post
    const post = new ForumPost({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      query: query.trim(),
      category: category || 'general',
    });

    await post.save();

    return NextResponse.json({
      success: true,
      message: "Your query has been submitted successfully. We'll respond soon!",
      postId: post._id,
    });
  } catch (error) {
    console.error("Error submitting forum post:", error);
    return NextResponse.json(
      { error: "Failed to submit your query. Please try again." },
      { status: 500 }
    );
  }
}
