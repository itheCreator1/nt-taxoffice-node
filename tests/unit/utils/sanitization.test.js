/**
 * Unit Tests - Sanitization Utility
 * Tests for input sanitization functions
 */

const sanitization = require('../../../utils/sanitization');

describe('Sanitization Utility', () => {
    describe('escapeHtml', () => {
        test('should escape HTML special characters', () => {
            expect(sanitization.escapeHtml('<script>alert("xss")</script>'))
                .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
            expect(sanitization.escapeHtml('Test & Co.')).toBe('Test &amp; Co.');
            expect(sanitization.escapeHtml("It's a test")).toBe('It&#x27;s a test');
        });

        test('should return empty string for non-string input', () => {
            expect(sanitization.escapeHtml(null)).toBe('');
            expect(sanitization.escapeHtml(123)).toBe('');
        });
    });

    describe('sanitizeString', () => {
        test('should trim whitespace', () => {
            expect(sanitization.sanitizeString('  test  ')).toBe('test');
        });

        test('should remove control characters except newlines and tabs', () => {
            expect(sanitization.sanitizeString('test\x00data')).toBe('testdata');
            expect(sanitization.sanitizeString('test\ndata')).toBe('test\ndata');
        });

        test('should return empty string for non-string input', () => {
            expect(sanitization.sanitizeString(null)).toBe('');
        });
    });

    describe('sanitizeName', () => {
        test('should allow English letters', () => {
            expect(sanitization.sanitizeName('John Smith')).toBe('John Smith');
            expect(sanitization.sanitizeName('Maria Elena')).toBe('Maria Elena');
        });

        test('should allow hyphens and apostrophes', () => {
            expect(sanitization.sanitizeName('Maria-Elena')).toBe('Maria-Elena');
            expect(sanitization.sanitizeName("O'Connor")).toBe("O'Connor");
        });

        test('should remove numbers and special characters', () => {
            expect(sanitization.sanitizeName('John123')).toBe('John');
            expect(sanitization.sanitizeName('Test@Email')).toBe('TestEmail');
        });

        test('should replace multiple spaces with single space', () => {
            expect(sanitization.sanitizeName('John    Smith')).toBe('John Smith');
        });

        test('should limit length to 255 characters', () => {
            const longName = 'A'.repeat(300);
            expect(sanitization.sanitizeName(longName).length).toBe(255);
        });
    });

    describe('sanitizeEmail', () => {
        test('should convert to lowercase and trim', () => {
            expect(sanitization.sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
        });

        test('should remove all whitespace', () => {
            expect(sanitization.sanitizeEmail('test @example.com')).toBe('test@example.com');
        });

        test('should limit length to 255 characters', () => {
            const longEmail = 'a'.repeat(300) + '@test.com';
            expect(sanitization.sanitizeEmail(longEmail).length).toBe(255);
        });
    });

    describe('sanitizePhone', () => {
        test('should remove spaces, dashes, and parentheses', () => {
            expect(sanitization.sanitizePhone('691 234 5678')).toBe('6912345678');
            expect(sanitization.sanitizePhone('691-234-5678')).toBe('6912345678');
            expect(sanitization.sanitizePhone('(691) 234-5678')).toBe('6912345678');
        });

        test('should keep + sign at the beginning', () => {
            expect(sanitization.sanitizePhone('+306912345678')).toBe('+306912345678');
        });

        test('should remove + signs that are not at the beginning', () => {
            expect(sanitization.sanitizePhone('691+234+5678')).toBe('6912345678');
        });

        test('should keep only digits and + sign', () => {
            expect(sanitization.sanitizePhone('691abc234xyz5678')).toBe('6912345678');
        });

        test('should limit length to 50 characters', () => {
            const longPhone = '1'.repeat(60);
            expect(sanitization.sanitizePhone(longPhone).length).toBe(50);
        });
    });

    describe('sanitizeNotes', () => {
        test('should preserve newlines', () => {
            expect(sanitization.sanitizeNotes('Line 1\nLine 2')).toBe('Line 1\nLine 2');
        });

        test('should limit consecutive newlines to 2', () => {
            expect(sanitization.sanitizeNotes('Test\n\n\n\nText')).toBe('Test\n\nText');
        });

        test('should replace multiple spaces with single space', () => {
            expect(sanitization.sanitizeNotes('Test    Text')).toBe('Test Text');
        });

        test('should limit length to 1000 characters', () => {
            const longNotes = 'A'.repeat(1500);
            expect(sanitization.sanitizeNotes(longNotes).length).toBe(1000);
        });
    });

    describe('sanitizeDeclineReason', () => {
        test('should sanitize like notes but with 500 char limit', () => {
            const longReason = 'A'.repeat(600);
            expect(sanitization.sanitizeDeclineReason(longReason).length).toBe(500);
        });

        test('should preserve newlines', () => {
            expect(sanitization.sanitizeDeclineReason('Reason:\nNot available')).toBe('Reason:\nNot available');
        });
    });

    describe('sanitizeUsername', () => {
        test('should convert to lowercase', () => {
            expect(sanitization.sanitizeUsername('TestUser')).toBe('testuser');
        });

        test('should keep only alphanumeric and underscore', () => {
            expect(sanitization.sanitizeUsername('test_user123')).toBe('test_user123');
            expect(sanitization.sanitizeUsername('test@user')).toBe('testuser');
        });

        test('should limit length to 50 characters', () => {
            const longUsername = 'a'.repeat(60);
            expect(sanitization.sanitizeUsername(longUsername).length).toBe(50);
        });
    });

    describe('sanitizeBookingRequest', () => {
        test('should sanitize all fields correctly', () => {
            const data = {
                client_name: '  JOHN SMITH  ',
                client_email: 'TEST@EXAMPLE.COM',
                client_phone: '691 234 5678',
                appointment_date: '2025-12-25',
                appointment_time: '10:00:00',
                service_type: 'Φορολογική Δήλωση',
                notes: 'Test    notes\n\n\n\nwith    spaces'
            };

            const result = sanitization.sanitizeBookingRequest(data);

            expect(result.client_name).toBe('JOHN SMITH');
            expect(result.client_email).toBe('test@example.com');
            expect(result.client_phone).toBe('6912345678');
            expect(result.appointment_date).toBe('2025-12-25');
            expect(result.appointment_time).toBe('10:00:00');
            expect(result.service_type).toBe('Φορολογική Δήλωση');
            expect(result.notes).toBe('Test notes\n\nwith spaces');
        });

        test('should handle missing fields', () => {
            const result = sanitization.sanitizeBookingRequest({});

            expect(result.client_name).toBe('');
            expect(result.client_email).toBe('');
            expect(result.client_phone).toBe('');
            expect(result.notes).toBe('');
        });
    });

    describe('sanitizeAdminCredentials', () => {
        test('should sanitize username and email, preserve password', () => {
            const data = {
                username: 'Test_User',
                email: 'ADMIN@EXAMPLE.COM',
                password: 'SecureP@ssw0rd!'
            };

            const result = sanitization.sanitizeAdminCredentials(data);

            expect(result.username).toBe('test_user');
            expect(result.email).toBe('admin@example.com');
            expect(result.password).toBe('SecureP@ssw0rd!'); // Unchanged
        });
    });

    describe('sanitizeAvailabilitySettings', () => {
        test('should parse and sanitize settings correctly', () => {
            const data = {
                day_of_week: '1',
                is_working_day: 'true',
                start_time: '09:00:00',
                end_time: '17:00:00'
            };

            const result = sanitization.sanitizeAvailabilitySettings(data);

            expect(result.day_of_week).toBe(1);
            expect(result.is_working_day).toBe(true);
            expect(result.start_time).toBe('09:00:00');
            expect(result.end_time).toBe('17:00:00');
        });

        test('should handle boolean conversion', () => {
            // String 'false' is converted to true because Boolean('false') is true (non-empty string)
            expect(sanitization.sanitizeAvailabilitySettings({ is_working_day: false }).is_working_day).toBe(false);
            expect(sanitization.sanitizeAvailabilitySettings({ is_working_day: true }).is_working_day).toBe(true);
            expect(sanitization.sanitizeAvailabilitySettings({ is_working_day: 1 }).is_working_day).toBe(true);
            expect(sanitization.sanitizeAvailabilitySettings({ is_working_day: 0 }).is_working_day).toBe(false);
        });
    });

    describe('sanitizeBlockedDate', () => {
        test('should sanitize blocked date data', () => {
            const data = {
                blocked_date: '  2025-12-25  ',
                reason: '  Christmas Holiday  '
            };

            const result = sanitization.sanitizeBlockedDate(data);

            expect(result.blocked_date).toBe('2025-12-25');
            expect(result.reason).toBe('Christmas Holiday');
        });
    });

    describe('sanitizeSql', () => {
        test('should remove SQL comment sequences', () => {
            expect(sanitization.sanitizeSql('SELECT * FROM users -- comment')).toBe('SELECT * FROM users  comment');
            expect(sanitization.sanitizeSql('SELECT /* comment */ * FROM users')).toBe('SELECT  comment  * FROM users');
        });

        test('should remove semicolons', () => {
            expect(sanitization.sanitizeSql('SELECT * FROM users; DROP TABLE users;')).toBe('SELECT * FROM users DROP TABLE users');
        });

        test('should return empty string for non-string input', () => {
            expect(sanitization.sanitizeSql(null)).toBe('');
        });
    });

    describe('stripHtmlTags', () => {
        test('should remove all HTML tags', () => {
            expect(sanitization.stripHtmlTags('<p>Test</p>')).toBe('Test');
            expect(sanitization.stripHtmlTags('<script>alert("xss")</script>')).toBe('alert("xss")');
            expect(sanitization.stripHtmlTags('Normal text')).toBe('Normal text');
        });

        test('should return empty string for non-string input', () => {
            expect(sanitization.stripHtmlTags(null)).toBe('');
        });
    });

    describe('sanitizeForDisplay', () => {
        test('should strip tags and escape HTML', () => {
            const input = '<script>alert("xss")</script> & <b>text</b>';
            const result = sanitization.sanitizeForDisplay(input);
            expect(result).toBe('alert(&quot;xss&quot;) &amp; text');
        });
    });

    describe('sanitizeInteger', () => {
        test('should parse valid integers', () => {
            expect(sanitization.sanitizeInteger('123')).toBe(123);
            expect(sanitization.sanitizeInteger(456)).toBe(456);
            expect(sanitization.sanitizeInteger('0')).toBe(0);
        });

        test('should return default value for invalid input', () => {
            expect(sanitization.sanitizeInteger('invalid')).toBe(0);
            expect(sanitization.sanitizeInteger('invalid', 10)).toBe(10);
            expect(sanitization.sanitizeInteger(null, -1)).toBe(-1);
        });
    });

    describe('sanitizeBoolean', () => {
        test('should handle boolean inputs', () => {
            expect(sanitization.sanitizeBoolean(true)).toBe(true);
            expect(sanitization.sanitizeBoolean(false)).toBe(false);
        });

        test('should parse string inputs', () => {
            expect(sanitization.sanitizeBoolean('true')).toBe(true);
            expect(sanitization.sanitizeBoolean('TRUE')).toBe(true);
            expect(sanitization.sanitizeBoolean('1')).toBe(true);
            expect(sanitization.sanitizeBoolean('yes')).toBe(true);
            expect(sanitization.sanitizeBoolean('false')).toBe(false);
            expect(sanitization.sanitizeBoolean('0')).toBe(false);
            expect(sanitization.sanitizeBoolean('no')).toBe(false);
        });

        test('should handle number inputs', () => {
            expect(sanitization.sanitizeBoolean(1)).toBe(true);
            expect(sanitization.sanitizeBoolean(0)).toBe(false);
            expect(sanitization.sanitizeBoolean(123)).toBe(true);
        });

        test('should return false for other types', () => {
            expect(sanitization.sanitizeBoolean(null)).toBe(false);
            expect(sanitization.sanitizeBoolean(undefined)).toBe(false);
            expect(sanitization.sanitizeBoolean({})).toBe(false);
        });
    });
});
