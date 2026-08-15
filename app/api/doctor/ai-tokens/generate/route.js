import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIToken from '@/models/AIToken';
import { requireDoctorAuth } from '@/lib/doctorAuth';
import { generateWebsiteSections, editSection, generateBlogArticle } from '@/lib/aiGenerate';
import { getDoctorProfileFields } from '@/lib/practice-os/profile';

const TOKEN_COSTS = {
  generate: 5,
  edit: 1,
  blog: 2,
};

export async function POST(request) {
  try {
    const doctor = await requireDoctorAuth(request);
    await connectDB();

    const body = await request.json();
    const { action, formData, sectionConfig, sectionType, prompt, topic } = body;

    if (!action || !TOKEN_COSTS[action]) {
      return NextResponse.json({ success: false, error: 'Invalid action. Use: generate, edit, or blog' }, { status: 400 });
    }

    const cost = TOKEN_COSTS[action];

    // Check balance
    const balance = await AIToken.getBalance(doctor._id);
    if (balance < cost) {
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_TOKENS',
        message: `This action requires ${cost} tokens. You have ${balance}.`,
        balance,
        required: cost,
      }, { status: 402 });
    }

    let result;

    switch (action) {
      case 'generate': {
        if (!formData) {
          return NextResponse.json({ success: false, error: 'formData is required for generate action' }, { status: 400 });
        }
        // Pull the doctor's real clinic details from their Practice OS profile so
        // the generated site includes address, city, timings, etc. (#5)
        const profile = await getDoctorProfileFields(doctor._id).catch(() => ({}));
        result = await generateWebsiteSections(formData, {
          name: doctor.name,
          displayName: doctor.displayName,
          specialization: doctor.specialization || profile.specialty,
          qualification: doctor.qualification || profile.qualifications,
          phone: doctor.phone || profile.appointment_number,
          email: doctor.email,
          clinicName: profile.clinic_name,
          clinicAddress: profile.clinic_address,
          city: profile.city,
          state: profile.state,
          timings: profile.consultation_timings,
          consultationFee: profile.consultation_fee,
          whatsapp: profile.whatsapp_number,
          procedures: profile.procedures,
          expertise: profile.expertise,
        });
        break;
      }

      case 'edit':
        if (!sectionConfig || !prompt || !sectionType) {
          return NextResponse.json({ success: false, error: 'sectionConfig, prompt, and sectionType are required' }, { status: 400 });
        }
        result = await editSection(sectionConfig, prompt, sectionType);
        break;

      case 'blog':
        if (!topic) {
          return NextResponse.json({ success: false, error: 'topic is required for blog action' }, { status: 400 });
        }
        result = await generateBlogArticle(topic, {
          name: doctor.name,
          displayName: doctor.displayName,
          specialization: doctor.specialization,
        });
        break;
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Deduct tokens
    const deduction = await AIToken.deductTokens(doctor._id, cost, action, `${action}: ${prompt || topic || 'full website'}`);

    return NextResponse.json({
      success: true,
      ...result,
      tokensUsed: cost,
      balance: deduction.balance,
    });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[AITokens Generate]', error);
    return NextResponse.json({ success: false, error: error.message || 'AI generation failed' }, { status: 500 });
  }
}
