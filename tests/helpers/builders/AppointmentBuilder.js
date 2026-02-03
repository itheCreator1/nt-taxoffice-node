/**
 * AppointmentBuilder - Fluent API for building appointment test data
 * Uses faker for realistic Greek locale data
 */

const { faker } = require('@faker-js/faker');
const { getFutureWorkingDate } = require('../fixtures');

class AppointmentBuilder {
  constructor() {
    // Set default values with realistic data
    this.data = {
      client_name: faker.person.fullName(),
      client_email: faker.internet.email().toLowerCase(),
      client_phone: this._generateGreekPhone(),
      appointment_date: getFutureWorkingDate(2),
      appointment_time: '10:00:00',
      service_type: 'Φορολογική Δήλωση',
      notes: null,
    };
  }

  /**
   * Generate a realistic Greek mobile phone number
   * Format: 69XXXXXXXX (10 digits starting with 69)
   * @private
   */
  _generateGreekPhone() {
    return `69${faker.string.numeric(8)}`;
  }

  /**
   * Set client name
   * @param {string} name
   * @returns {AppointmentBuilder}
   */
  withName(name) {
    this.data.client_name = name;
    return this;
  }

  /**
   * Set client email
   * @param {string} email
   * @returns {AppointmentBuilder}
   */
  withEmail(email) {
    this.data.client_email = email;
    return this;
  }

  /**
   * Set client phone
   * @param {string} phone
   * @returns {AppointmentBuilder}
   */
  withPhone(phone) {
    this.data.client_phone = phone;
    return this;
  }

  /**
   * Set appointment date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {AppointmentBuilder}
   */
  onDate(date) {
    this.data.appointment_date = date;
    return this;
  }

  /**
   * Set appointment time
   * @param {string} time - Time in HH:MM:SS format
   * @returns {AppointmentBuilder}
   */
  atTime(time) {
    this.data.appointment_time = time;
    return this;
  }

  /**
   * Set service type
   * @param {string} serviceType
   * @returns {AppointmentBuilder}
   */
  forService(serviceType) {
    this.data.service_type = serviceType;
    return this;
  }

  /**
   * Set appointment for tax return service
   * @returns {AppointmentBuilder}
   */
  forTaxReturn() {
    this.data.service_type = 'Φορολογική Δήλωση';
    return this;
  }

  /**
   * Set appointment for consultation service
   * @returns {AppointmentBuilder}
   */
  forConsultation() {
    this.data.service_type = 'Συμβουλευτική';
    return this;
  }

  /**
   * Set appointment for bookkeeping service
   * @returns {AppointmentBuilder}
   */
  forBookkeeping() {
    this.data.service_type = 'Λογιστική Παρακολούθηση';
    return this;
  }

  /**
   * Set appointment for VAT service
   * @returns {AppointmentBuilder}
   */
  forVAT() {
    this.data.service_type = 'ΦΠΑ';
    return this;
  }

  /**
   * Add notes to the appointment
   * @param {string} notes
   * @returns {AppointmentBuilder}
   */
  withNotes(notes) {
    this.data.notes = notes;
    return this;
  }

  /**
   * Set random appointment time during business hours
   * @returns {AppointmentBuilder}
   */
  atRandomTime() {
    const hour = faker.number.int({ min: 9, max: 16 });
    const minute = faker.helpers.arrayElement(['00', '30']);
    this.data.appointment_time = `${String(hour).padStart(2, '0')}:${minute}:00`;
    return this;
  }

  /**
   * Set appointment for a random future working day
   * @param {number} [minDays=1] - Minimum days in the future
   * @param {number} [maxDays=30] - Maximum days in the future
   * @returns {AppointmentBuilder}
   */
  onRandomFutureDate(minDays = 1, maxDays = 30) {
    const days = faker.number.int({ min: minDays, max: maxDays });
    this.data.appointment_date = getFutureWorkingDate(days);
    return this;
  }

  /**
   * Build and return the appointment data object
   * @returns {Object}
   */
  build() {
    return { ...this.data };
  }

  /**
   * Build multiple appointments with variations
   * @param {number} count - Number of appointments to build
   * @returns {Array<Object>}
   */
  buildMany(count) {
    const appointments = [];
    for (let i = 0; i < count; i++) {
      // Create new instance to avoid shared state
      const builder = new AppointmentBuilder();
      // Copy current configuration
      builder.data = { ...this.data };
      // Add variation for each appointment
      builder
        .withName(faker.person.fullName())
        .withEmail(faker.internet.email().toLowerCase())
        .withPhone(this._generateGreekPhone())
        .onDate(getFutureWorkingDate(i + 1));

      appointments.push(builder.build());
    }
    return appointments;
  }
}

module.exports = AppointmentBuilder;
