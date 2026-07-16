// Helper compartido para los correos transaccionales de Cheers.
// Antes cada ruta (bienvenida, notificar-rsvp, recordatorios, post-evento,
// checkout-abandonado) tenía su propio copy/paste del banner y el footer —
// si querías cambiar un link o un texto tenías que acordarte de tocar los
// 5 archivos. Ahora ese pedazo vive en un solo lugar.

export type Idioma = 'es' | 'en'

// Agrega parámetros UTM a cualquier link de un correo, para poder ver en Vercel
// Analytics (o donde sea que midas tráfico) cuánta gente entra desde cada tipo
// de correo específico, no solo "vino de algún lado".
export function trackedLink(url: string, campaign: string): string {
  const u = new URL(url)
  u.searchParams.set('utm_source', 'email')
  u.searchParams.set('utm_medium', 'email')
  u.searchParams.set('utm_campaign', campaign)
  return u.toString()
}

function bannerHtml(): string {
  return `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://joincheers.app" style="display: inline-block; text-decoration: none; background: linear-gradient(135deg,#534AB7,#D4537E); padding: 10px 22px; border-radius: 12px;">
        <span style="color: #fff; font-size: 16px; font-weight: 800;">Cheers</span>
      </a>
    </div>
  `
}

function footerHtml(lang: Idioma): string {
  return lang === 'en'
    ? `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
        <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Terms</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacy</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
        <p style="margin: 0;">Don't want your account anymore? You can delete it from <a href="https://joincheers.app/perfil" style="color: #a39ec0;">your profile</a>.</p>
      </div>
    `
    : `
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #a39ec0; line-height: 1.6; text-align: center;">
        <p style="margin: 0 0 6px;">Cheers · <a href="https://joincheers.app/terminos" style="color: #a39ec0;">Términos</a> · <a href="https://joincheers.app/privacidad" style="color: #a39ec0;">Privacidad</a> · <a href="https://joincheers.app/faq" style="color: #a39ec0;">FAQ</a></p>
        <p style="margin: 0;">¿Ya no quieres tu cuenta? Puedes darla de baja desde <a href="https://joincheers.app/perfil" style="color: #a39ec0;">tu perfil</a>.</p>
      </div>
    `
}

// Envuelve el contenido propio de cada correo (lo único que cambia entre rutas)
// con el mismo banner arriba y el mismo footer abajo en todos los correos.
export function envolverEmail(lang: Idioma, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      ${bannerHtml()}
      ${bodyHtml}
      ${footerHtml(lang)}
    </div>
  `
}
