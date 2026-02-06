export function exceptionEmailTemplate(
  error_message: string,
  action: string,
  stack:string
) {
  
  return {
    subject: "An exception has occurred in zipties dev",
    html: `
      <h3>Exception email</h3>
      <hr />

      <p><strong>Message :</strong></p>
      <pre>${error_message}</pre>

      <p><strong>Action :</strong></p>
      <pre>${action}</pre>

      <p><strong>Stack trace :</strong></p>
      <pre style="background:#f4f4f4;padding:10px;border-radius:4px;">
${stack}
      </pre>
    `,
  };
}

export function resetPasswordEmailTemplate(
  resetLink: string
) {
  
  return {
    subject: "Reset your password",
    html: `
      <h3>Reset your password</h3>
      <hr />

      <p><strong>Reset link :</strong></p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  };
}

