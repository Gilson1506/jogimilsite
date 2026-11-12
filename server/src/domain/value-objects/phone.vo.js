export class PhoneVO {
  constructor(value) {
    if (!value) {
      this.value = null;
      return;
    }

    const cleaned = String(value).trim().replace(/[\s.-]/g, '');
    this.value = cleaned;
    Object.freeze(this);
  }

  isAngolan() {
    if (!this.value) return false;
    return this.value.startsWith('+244') || this.value.startsWith('244') || (this.value.length === 9 && this.value.startsWith('9'));
  }

  toString() {
    return this.value || '';
  }
}
