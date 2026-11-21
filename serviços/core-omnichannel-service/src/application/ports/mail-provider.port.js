export class IMailProvider {
  async send({ to, subject, html, text, replyTo }) {
    throw new Error('Method not implemented: send');
  }

  async verifyConnection() {
    throw new Error('Method not implemented: verifyConnection');
  }
}
