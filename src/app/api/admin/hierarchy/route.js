import { supabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Fetching hierarchy charts...');
    
    const { data, error } = await supabaseServer
      .from('hierarchy_charts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch hierarchy charts error:', error);
      return NextResponse.json({ error: 'Failed to fetch charts', details: error.message }, { status: 500 });
    }

    console.log('Hierarchy charts data:', data);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const dept = formData.get('dept');

    if (!file || !dept) {
      return NextResponse.json({ error: 'File and department are required' }, { status: 400 });
    }

    const fileName = `${dept}_${Date.now()}.pdf`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabaseServer.storage
      .from('hierarchy_charts')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file', details: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage
      .from('hierarchy_charts')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    const { data: insertData, error: insertError } = await supabaseServer
      .from('hierarchy_charts')
      .upsert([{ dept, link: publicUrl }], { onConflict: 'dept' })
      .select();

    if (insertError) {
      console.error('Upsert error:', insertError);
      return NextResponse.json({ error: 'Failed to save chart record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: insertData[0], link: publicUrl });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
