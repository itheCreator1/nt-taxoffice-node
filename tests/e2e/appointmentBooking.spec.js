const { test, expect } = require('@playwright/test');

test.describe('Appointment Booking System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/appointments.html');
    });

    test('should load appointment page successfully', async ({ page }) => {
        await expect(page).toHaveTitle(/Κράτηση Ραντεβού/);
        await expect(page.locator('h2')).toContainText('Κλείστε Ραντεβού');
    });

    test('should display DD/MM/YYYY format in date picker', async ({ page }) => {
        // Step 1: Select service to enable step 2
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');

        // Wait for step 2 to be visible
        await expect(page.locator('#step-2')).toHaveClass(/active/);

        // Click date field to open flatpickr
        await page.click('#appointment_date');

        // Verify flatpickr calendar is visible
        await expect(page.locator('.flatpickr-calendar')).toBeVisible({ timeout: 5000 });

        // Verify date format configuration
        const dateFormat = await page.evaluate(() => {
            const input = document.getElementById('appointment_date');
            return input._flatpickr ? input._flatpickr.config.dateFormat : null;
        });
        expect(dateFormat).toBe('d/m/Y');
    });

    test('should disable weekends in calendar', async ({ page }) => {
        // Navigate to step 2
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');

        // Open date picker
        await page.click('#appointment_date');
        await expect(page.locator('.flatpickr-calendar')).toBeVisible();

        // Check if weekend days are disabled
        const disabledDays = await page.locator('.flatpickr-day.flatpickr-disabled').count();
        expect(disabledDays).toBeGreaterThan(0);
    });

    test('should navigate through all three steps', async ({ page }) => {
        // Step 1: Service selection
        await expect(page.locator('#step-1')).toHaveClass(/active/);
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');

        // Verify Step 2 is active
        await expect(page.locator('#step-2')).toHaveClass(/active/);
        await expect(page.locator('#step-1')).not.toHaveClass(/active/);

        // Step 2: Date and time selection
        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();

        // Wait for time slots to load
        await page.waitForTimeout(1000);

        // Select first available time slot
        const firstTimeOption = await page.locator('#appointment_time option:not([value=""])').first();
        await expect(firstTimeOption).toBeVisible({ timeout: 5000 });
        const timeValue = await firstTimeOption.getAttribute('value');
        await page.selectOption('#appointment_time', timeValue);

        await page.click('#next-to-step-3');

        // Verify Step 3 is active
        await expect(page.locator('#step-3')).toHaveClass(/active/);
        await expect(page.locator('#step-2')).not.toHaveClass(/active/);
    });

    test('should validate required fields in each step', async ({ page }) => {
        // Step 1: Try to proceed without selecting service
        await page.click('#next-to-step-2');
        await expect(page.locator('#error-message')).toBeVisible();
        await expect(page.locator('#error-text')).toContainText('επιλέξτε τύπο υπηρεσίας');

        // Select service and proceed
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');
        await expect(page.locator('#step-2')).toHaveClass(/active/);

        // Step 2: Try to proceed without selecting date
        await page.click('#next-to-step-3');
        await expect(page.locator('#error-message')).toBeVisible();

        // Select date and time
        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();
        await page.waitForTimeout(1000);

        // Try to proceed without selecting time
        await page.click('#next-to-step-3');
        await expect(page.locator('#error-message')).toBeVisible();
    });

    test('should update booking summary in real-time', async ({ page }) => {
        // Navigate to step 3
        await page.selectOption('#service_type', 'Γενική Συμβουλευτική');
        await page.click('#next-to-step-2');

        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();
        await page.waitForTimeout(1000);

        const firstTimeOption = await page.locator('#appointment_time option:not([value=""])').first();
        const timeValue = await firstTimeOption.getAttribute('value');
        await page.selectOption('#appointment_time', timeValue);

        await page.click('#next-to-step-3');

        // Verify summary is visible
        await expect(page.locator('#booking-summary')).toBeVisible();
        await expect(page.locator('#summary-service')).toContainText('Γενική Συμβουλευτική');

        // Type in name field and verify real-time update
        await page.fill('#client_name', 'Ιωάννης');
        await expect(page.locator('#summary-name')).toContainText('Ιωάννης');

        // Continue typing
        await page.fill('#client_name', 'Ιωάννης Παπαδόπουλος');
        await expect(page.locator('#summary-name')).toContainText('Ιωάννης Παπαδόπουλος');

        // Type email
        await page.fill('#client_email', 'test@example.com');
        await expect(page.locator('#summary-email')).toContainText('test@example.com');

        // Type phone
        await page.fill('#client_phone', '6912345678');
        await expect(page.locator('#summary-phone')).toContainText('6912345678');
    });

    test('should validate email format', async ({ page }) => {
        // Navigate to step 3
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');

        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();
        await page.waitForTimeout(1000);

        const firstTimeOption = await page.locator('#appointment_time option:not([value=""])').first();
        const timeValue = await firstTimeOption.getAttribute('value');
        await page.selectOption('#appointment_time', timeValue);

        await page.click('#next-to-step-3');

        // Fill form with invalid email
        await page.fill('#client_name', 'Test User');
        await page.fill('#client_email', 'invalid-email');
        await page.fill('#client_phone', '6912345678');

        // Try to submit
        await page.click('#submit-booking');

        // Verify error message
        await expect(page.locator('#error-message')).toBeVisible();
        await expect(page.locator('#error-text')).toContainText('email');
    });

    test('should validate Greek phone format', async ({ page }) => {
        // Navigate to step 3
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');

        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();
        await page.waitForTimeout(1000);

        const firstTimeOption = await page.locator('#appointment_time option:not([value=""])').first();
        const timeValue = await firstTimeOption.getAttribute('value');
        await page.selectOption('#appointment_time', timeValue);

        await page.click('#next-to-step-3');

        // Fill form with invalid phone
        await page.fill('#client_name', 'Test User');
        await page.fill('#client_email', 'test@example.com');
        await page.fill('#client_phone', '123'); // Invalid

        // Try to submit
        await page.click('#submit-booking');

        // Verify error message
        await expect(page.locator('#error-message')).toBeVisible();
        await expect(page.locator('#error-text')).toContainText('τηλέφωνο');
    });

    test('should allow navigation back through steps', async ({ page }) => {
        // Go to step 2
        await page.selectOption('#service_type', 'Φορολογική Δήλωση');
        await page.click('#next-to-step-2');
        await expect(page.locator('#step-2')).toHaveClass(/active/);

        // Go back to step 1
        await page.click('#back-to-step-1');
        await expect(page.locator('#step-1')).toHaveClass(/active/);
        await expect(page.locator('#step-2')).not.toHaveClass(/active/);

        // Go forward again
        await page.click('#next-to-step-2');
        await expect(page.locator('#step-2')).toHaveClass(/active/);

        // Select date and time, go to step 3
        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();
        await page.waitForTimeout(1000);

        const firstTimeOption = await page.locator('#appointment_time option:not([value=""])').first();
        const timeValue = await firstTimeOption.getAttribute('value');
        await page.selectOption('#appointment_time', timeValue);

        await page.click('#next-to-step-3');
        await expect(page.locator('#step-3')).toHaveClass(/active/);

        // Go back to step 2
        await page.click('#back-to-step-2');
        await expect(page.locator('#step-2')).toHaveClass(/active/);
        await expect(page.locator('#step-3')).not.toHaveClass(/active/);
    });

    test('should preserve form data when navigating between steps', async ({ page }) => {
        // Fill step 1
        await page.selectOption('#service_type', 'Μισθοδοσία');
        await page.click('#next-to-step-2');

        // Fill step 2
        await page.click('#appointment_date');
        await page.locator('.flatpickr-day:not(.flatpickr-disabled)').first().click();
        await page.waitForTimeout(1000);

        const firstTimeOption = await page.locator('#appointment_time option:not([value=""])').first();
        const timeValue = await firstTimeOption.getAttribute('value');
        await page.selectOption('#appointment_time', timeValue);

        const selectedDate = await page.inputValue('#appointment_date');

        // Go back to step 1
        await page.click('#back-to-step-1');

        // Verify service selection is preserved
        const serviceValue = await page.inputValue('#service_type');
        expect(serviceValue).toBe('Μισθοδοσία');

        // Go forward to step 2
        await page.click('#next-to-step-2');

        // Verify date is still selected
        const dateValue = await page.inputValue('#appointment_date');
        expect(dateValue).toBe(selectedDate);
    });
});
