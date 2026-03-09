"use client";

import { useState, useEffect } from "react";
import Section from "./Section";

export default function ForumSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    query: "",
    category: "general",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [expandedPost, setExpandedPost] = useState(null);

  const categories = [
    { value: "all", label: "All Topics" },
    { value: "general", label: "General" },
    { value: "symptoms", label: "Symptoms" },
    { value: "treatment", label: "Treatment" },
    { value: "diet", label: "Diet" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "other", label: "Other" },
  ];

  const categoryColors = [
    "from-blue-500/20 to-purple-500/20",
    "from-purple-500/20 to-pink-500/20",
    "from-pink-500/20 to-blue-500/20",
    "from-green-500/20 to-blue-500/20",
    "from-yellow-500/20 to-orange-500/20",
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      const response = await fetch(`/api/forum?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Your query has been submitted successfully! Dr. Yuvaraj will respond soon.",
        });
        setFormData({ name: "", email: "", query: "", category: "general" });
        setShowForm(false);
        fetchPosts(); // Refresh the posts list to show the new question
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit query" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <Section bgColor="bg-gradient-to-br from-beige-200 via-white to-accent-50/30" id="community">
      {/* 3D Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-primary-200/30 to-accent-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-accent-200/30 to-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent-200/20 to-primary-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-500/10 to-accent-600/10 backdrop-blur-sm border border-accent-500/20 text-primary-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-4 shadow-lg">
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              Ask Dr. Yuvaraj
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              Health Forum
            </h2>
            <p className="text-lg text-primary-800">
              Have questions about digestive health? Submit your query and get expert advice from Dr. Yuvaraj.
            </p>
          </div>

          {/* Ask Question Button */}
          <div className="text-center mb-8">
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? "Close Form" : "Ask a Question"}
            </button>
          </div>

          {/* Success/Error Message */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl backdrop-blur-sm ${
                message.type === "success"
                  ? "bg-green-100/80 text-green-800 border border-green-200"
                  : "bg-red-100/80 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Query Submission Form */}
          {showForm && (
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-2xl mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-primary-900 mb-6">Submit Your Question</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">Your Question *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.query}
                      onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                      placeholder="Describe your question or concern in detail..."
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-primary-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Your email will not be displayed publicly</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit Question"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-white/60 text-primary-700 hover:bg-white/80 border border-primary-200/50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Glassmorphism Container */}
          <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-2xl">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 bg-accent-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-bold text-primary-900">Community Questions</span>
                </div>
                <span className="text-xs text-primary-700 bg-white/50 px-3 py-1 rounded-full border border-primary-200/50">
                  {posts.length} answered
                </span>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-primary-600">Loading questions...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-primary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-primary-600">No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.map((post, index) => (
                    <div
                      key={post._id}
                      className="group relative bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                      onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                    >
                      {/* Gradient background on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[index % categoryColors.length]} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-beige-200 to-beige-300 rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-primary-700" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-primary-900">{post.name}</span>
                              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full capitalize">{post.category}</span>
                            </div>
                            <p className="text-base font-medium text-primary-900 mb-3 leading-relaxed">
                              {post.query}
                            </p>

                            {/* Answer Box - Always show latest reply */}
                            {post.replies && post.replies.length > 0 && (
                              <div className="relative bg-gradient-to-br from-primary-500/10 to-primary-600/10 backdrop-blur-sm border-l-4 border-primary-600 p-4 rounded-r-xl shadow-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex-shrink-0 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-bold text-primary-700 tracking-wide uppercase">Dr. Yuvaraj's Response</span>
                                </div>
                                <p className="text-sm text-primary-800 leading-relaxed whitespace-pre-wrap">
                                  {expandedPost === post._id
                                    ? post.replies[post.replies.length - 1].message
                                    : post.replies[post.replies.length - 1].message.length > 150
                                      ? post.replies[post.replies.length - 1].message.substring(0, 150) + "..."
                                      : post.replies[post.replies.length - 1].message
                                  }
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-primary-600 font-medium">{getTimeAgo(post.createdAt)}</p>
                              </div>
                              {post.replies && post.replies[post.replies.length - 1]?.message.length > 150 && (
                                <span className="text-xs text-primary-500 font-medium">
                                  {expandedPost === post._id ? "Show less" : "Read more"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    </Section>
  );
}
