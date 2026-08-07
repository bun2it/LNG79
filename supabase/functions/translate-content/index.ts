import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Authenticate user via ctx.supabaseAdmin using Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace(/^Bearer\s+/, '');
    const { data: { user }, error: userError } = await ctx.supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate user active CMS status
    const { data: profile, error: profileError } = await ctx.supabaseAdmin
      .from('users')
      .select('account_type, status')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile || profile.status !== 'active' || profile.account_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden CMS access' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check Groq configuration
    const groqApiKey = Deno.env.get('GROQ_API_KEY') || '';
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured on Supabase.' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { entries } = await req.json();
    if (!entries || !Array.isArray(entries)) {
      return new Response(JSON.stringify({ error: 'Invalid entries payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const groqModel = Deno.env.get('GROQ_TRANSLATION_MODEL') || 'llama-3.3-70b-versatile';

    // Insert translation job log
    const sourceText = JSON.stringify(entries);
    const { data: job, error: jobInsertError } = await ctx.supabaseAdmin
      .from('ai_translation_jobs')
      .insert({
        status: 'processing',
        requester_id: user.id,
        source_text: sourceText,
        model: groqModel
      })
      .select()
      .single();

    if (jobInsertError) {
      console.error('Job insertion failed:', jobInsertError);
    }

    let translations = [];
    let errorMessage = '';
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqApiKey}` },
        body: JSON.stringify({
          model: groqModel,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a professional Vietnamese-to-English translator for industrial LNG, LPG, gas safety, EPC engineering, and commercial kitchen websites. Return JSON only in the exact shape {"translations":[{"id":"same id","text":"English translation"}]}. CRITICAL: You must preserve the EXACT structural layout of the source text, retaining all commas (,), semicolons (;), slashes (/), and other delimiting punctuation exactly in position, as some page layouts split text elements using these separators. Preserve numbers, units, standards, model names, HTML-free formatting, and brand names. Do not omit or merge entries.' },
            { role: 'user', content: JSON.stringify({ entries }) },
          ],
        }),
      });

      const groq = await response.json();
      if (!response.ok) throw new Error(groq.error?.message || 'Groq API request failed');
      const result = JSON.parse(groq.choices?.[0]?.message?.content || '{}');
      if (!Array.isArray(result.translations)) throw new Error('Groq returned an invalid translation response');
      
      translations = result.translations;

      // Update job to completed
      if (job) {
        await ctx.supabaseAdmin
          .from('ai_translation_jobs')
          .update({
            status: 'completed',
            translated_text: JSON.stringify(translations)
          })
          .eq('id', job.id);
      }
    } catch (e: any) {
      errorMessage = e.message || 'Translation failed';
      console.error('Translation error:', errorMessage);

      // Update job to failed
      if (job) {
        await ctx.supabaseAdmin
          .from('ai_translation_jobs')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .eq('id', job.id);
      }

      return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ translations }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }),
};
