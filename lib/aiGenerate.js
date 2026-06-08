const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function callClaude(systemPrompt, userPrompt) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[AI] ANTHROPIC_API_KEY not configured');
    return { success: false, error: 'AI not configured. Set ANTHROPIC_API_KEY in environment.' };
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0]?.text;
    return { success: true, text };
  } catch (error) {
    console.error('[AI] Claude API error:', error.message);
    return { success: false, error: error.message };
  }
}

// Generate all website sections from onboarding form data
export async function generateWebsiteSections(formData, doctorInfo) {
  const systemPrompt = `You are a medical website content generator. Given doctor information, generate website section configurations as JSON.

Return ONLY a valid JSON array of section objects. Each section has:
- type: one of "header", "doctor_profile", "custom_text", "benefits_list", "testimonials", "faqs", "location_map", "cta_button", "footer"
- order: number (0-based)
- visible: true
- config: object with section-specific fields

Section config formats:
- header: { logoText, showNavigation: true, navMode: "auto", ctaButton: { text, url, show: true }, backgroundColor: "white", sticky: true }
- doctor_profile: { title, content (multi-paragraph text about the doctor), imageUrl: "", credentials: [string array], layout: "left" }
- custom_text: { title, content, alignment: "left", backgroundColor: "white" }
- benefits_list: { title, subtitle, benefits: [{ title, description, icon }] }
- testimonials: { title, subtitle, testimonials: [{ name, text, rating: 5 }] }
- faqs: { title, subtitle, faqs: [{ question, answer }] }
- location_map: { title, address, mapUrl: "", phone, email, timings }
- cta_button: { title, subtitle, buttonText, buttonLink, buttonStyle: "primary", alignment: "center", size: "large" }
- footer: { companyName, tagline, address, phone, email, showQuickLinks: true, quickLinks: [{ text, url }], copyrightText }

Generate professional, warm, patient-friendly content. Use the doctor's actual information. Generate at least 6-8 sections for a complete website.`;

  const userPrompt = `Generate a complete clinic website for:

Doctor Name: ${doctorInfo.name}
Display Name: ${doctorInfo.displayName || doctorInfo.name}
Specialization: ${formData.specialization || doctorInfo.specialization || 'Medical Professional'}
Qualification: ${formData.qualification || doctorInfo.qualification || ''}
Services: ${formData.services || 'General medical services'}
Clinic Name: ${formData.clinicName || doctorInfo.displayName + "'s Clinic"}
Location: ${formData.location || ''}
Phone: ${formData.phone || doctorInfo.phone || ''}
Email: ${formData.email || doctorInfo.email || ''}
Unique Selling Points: ${formData.usps || ''}
Tone: ${formData.tone || 'Professional and warm'}
Additional Info: ${formData.additionalInfo || ''}

Generate a complete JSON array of website sections.`;

  const result = await callClaude(systemPrompt, userPrompt);
  if (!result.success) return result;

  try {
    // Extract JSON from response (may be wrapped in ```json blocks)
    let jsonText = result.text;
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonText = jsonMatch[0];

    const sections = JSON.parse(jsonText);
    return { success: true, sections };
  } catch (parseError) {
    console.error('[AI] Failed to parse sections:', parseError.message);
    return { success: false, error: 'AI generated invalid content. Please try again.' };
  }
}

// Edit a single section based on user prompt
export async function editSection(currentConfig, prompt, sectionType) {
  const systemPrompt = `You are a medical website content editor. Given the current configuration of a website section and a user's edit instruction, return the updated configuration as JSON.

Section type: ${sectionType}
Return ONLY the updated config object as valid JSON. Keep the same structure, only modify what the user asks for.`;

  const userPrompt = `Current section config:
${JSON.stringify(currentConfig, null, 2)}

User's edit instruction: ${prompt}

Return the updated config JSON only.`;

  const result = await callClaude(systemPrompt, userPrompt);
  if (!result.success) return result;

  try {
    let jsonText = result.text;
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];

    const config = JSON.parse(jsonText);
    return { success: true, config };
  } catch (parseError) {
    console.error('[AI] Failed to parse edited config:', parseError.message);
    return { success: false, error: 'AI generated invalid content. Please try again.' };
  }
}

// Generate a blog article
export async function generateBlogArticle(topic, doctorInfo) {
  const systemPrompt = `You are a medical content writer. Generate a professional, informative blog article for a doctor's website. Return JSON with: { title, slug, metaDescription, content (full article text with paragraphs separated by newlines), category }. Return ONLY valid JSON.`;

  const userPrompt = `Write a blog article about: ${topic}
Doctor: ${doctorInfo.displayName || doctorInfo.name}
Specialization: ${doctorInfo.specialization || 'Medical Professional'}

Return JSON only.`;

  const result = await callClaude(systemPrompt, userPrompt);
  if (!result.success) return result;

  try {
    let jsonText = result.text;
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonText = jsonMatch[0];

    const article = JSON.parse(jsonText);
    return { success: true, article };
  } catch (parseError) {
    return { success: false, error: 'AI generated invalid content. Please try again.' };
  }
}
