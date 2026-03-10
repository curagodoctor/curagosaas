import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentDoctor } from "@/lib/doctorAuth";
import connectDB from "@/lib/mongodb";
import ForumPost from "@/models/ForumPost";

// GET - Get single forum post
export async function GET(request, { params }) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    const { id } = await params;

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const post = await ForumPost.findOne(query).lean();

    if (!post) {
      return NextResponse.json(
        { error: "Forum post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error fetching forum post:", error);
    return NextResponse.json(
      { error: "Failed to fetch forum post" },
      { status: 500 }
    );
  }
}

// PATCH - Update forum post (reply, change status, toggle visibility)
export async function PATCH(request, { params }) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { action, reply, status, isPublic } = body;

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const post = await ForumPost.findOne(query);

    if (!post) {
      return NextResponse.json(
        { error: "Forum post not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    if (action === 'reply' && reply) {
      post.replies.push({
        message: reply.trim(),
        repliedBy: doctor?.displayName || doctor?.name || 'Doctor',
        repliedAt: new Date(),
      });
      post.status = 'replied';
    }

    if (status) {
      post.status = status;
    }

    if (typeof isPublic === 'boolean') {
      post.isPublic = isPublic;
    }

    await post.save();

    return NextResponse.json({
      success: true,
      message: action === 'reply' ? 'Reply sent successfully' : 'Post updated successfully',
      post,
    });
  } catch (error) {
    console.error("Error updating forum post:", error);
    return NextResponse.json(
      { error: "Failed to update forum post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete forum post
export async function DELETE(request, { params }) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const doctor = await getCurrentDoctor(request);
    const doctorId = doctor?._id;

    await connectDB();

    const { id } = await params;

    const query = { _id: id };
    if (doctorId) query.doctorId = doctorId;

    const post = await ForumPost.findOneAndDelete(query);

    if (!post) {
      return NextResponse.json(
        { error: "Forum post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Forum post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting forum post:", error);
    return NextResponse.json(
      { error: "Failed to delete forum post" },
      { status: 500 }
    );
  }
}
