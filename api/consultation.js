import { Resend } from 'resend';

const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_TO_EMAIL) return response.status(500).json({ error: 'Email service is not configured' });
  const { parentName, email, childAge, focus, message, language } = request.body || {};
  if (!parentName || !email || !/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Valid name and email are required' });
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.BOOKING_FROM_EMAIL || 'Ura e Leximit <onboarding@resend.dev>',
      to: [process.env.BOOKING_TO_EMAIL], replyTo: email,
      subject: `New consultation request — ${parentName}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#14243b"><h1 style="color:#0d2f68">New consultation request</h1><p><strong>Parent / guardian:</strong> ${escapeHtml(parentName)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Child's age:</strong> ${escapeHtml(childAge || 'Not provided')}</p><p><strong>Focus:</strong> ${escapeHtml(focus || 'Not provided')}</p><p><strong>Website language:</strong> ${escapeHtml(language || 'Not provided')}</p><p><strong>Message:</strong></p><p>${escapeHtml(message || 'No message').replaceAll('\n','<br>')}</p></div>`
    });
    if (error) throw error;
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Resend booking error:', error);
    return response.status(502).json({ error: 'Unable to send booking email' });
  }
}
