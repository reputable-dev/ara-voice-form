import { initialContractData, parseContractSource, applyParsedToState } from '../contractParser';

describe('contractParser', () => {
  describe('initialContractData', () => {
    it('returns empty contract form with correct structure', () => {
      const initial = initialContractData();

      expect(initial).toHaveProperty('clientName', '');
      expect(initial).toHaveProperty('siteAddress', '');
      expect(initial).toHaveProperty('brand', null);
      expect(initial).toHaveProperty('isStartup', false);
      expect(initial).toHaveProperty('days');
      expect(initial.days).toHaveProperty('mon', false);
      expect(initial.days).toHaveProperty('sun', false);
    });

    it('initializes all boolean flags to false', () => {
      const initial = initialContractData();

      expect(initial.isStartup).toBe(false);
      expect(initial.isAdjustment).toBe(false);
      expect(initial.isTermination).toBe(false);
      expect(initial.employeeToggle).toBe(false);
      expect(initial.subcontractorToggle).toBe(false);
    });
  });

  describe('parseContractSource', () => {
    it('extracts client name correctly', () => {
      const source = 'Client name: ABC Corporation\nSite Address: 123 Main St';
      const result = parseContractSource(source);

      expect(result.data.clientName).toBe('ABC Corporation');
    });

    it('extracts site address correctly', () => {
      const source = 'Site Address: 456 Oak Avenue, Suite 100';
      const result = parseContractSource(source);

      expect(result.data.siteAddress).toBe('456 Oak Avenue, Suite 100');
    });

    it('detects AIS brand when checked', () => {
      const source = 'ARA Indigenous Services ☒';
      const result = parseContractSource(source);

      expect(result.data.brand).toBe('AIS');
    });

    it('detects APS brand when checked', () => {
      const source = 'ARA Property Services ☒';
      const result = parseContractSource(source);

      expect(result.data.brand).toBe('APS');
    });

    it('detects startup contract type', () => {
      const source = 'Start up ☒\nAdjustment ☐';
      const result = parseContractSource(source);

      expect(result.data.isStartup).toBe(true);
      expect(result.data.isAdjustment).toBe(false);
    });

    it('extracts effective date', () => {
      const source = 'EFFECTIVE 11/22/2025';
      const result = parseContractSource(source);

      expect(result.data.effectiveDate).toBe('11/22/2025');
    });

    it('extracts employee name and mobile', () => {
      const source = 'New Employee Name: John Smith   Mobile: 555-1234';
      const result = parseContractSource(source);

      expect(result.data.newEmployeeName).toBe('John Smith');
      expect(result.data.newEmployeeMobile).toBe('555-1234');
    });

    it('extracts shift times', () => {
      const source = 'New shift 9:00 – 17:00';
      const result = parseContractSource(source);

      expect(result.data.shiftStart).toBe('9:00');
      expect(result.data.shiftEnd).toBe('17:00');
    });

    it('generates summary lines for extracted data', () => {
      const source = 'Client name: Test Corp\nEFFECTIVE 01/01/2025';
      const result = parseContractSource(source);

      expect(result.summaryLines).toContain('Client: Test Corp');
      expect(result.summaryLines).toContain('Effective: 01/01/2025');
    });

    it('handles empty source gracefully', () => {
      const result = parseContractSource('');

      expect(result.data).toBeDefined();
      expect(result.summaryLines).toEqual([]);
    });

    it('handles invalid source without crashing', () => {
      const result = parseContractSource('Random text with no patterns');

      expect(result.data).toBeDefined();
      expect(result.summaryLines).toBeDefined();
    });
  });

  describe('applyParsedToState', () => {
    it('merges parsed data into current state', () => {
      const current = initialContractData();
      const parsed = {
        data: {
          clientName: 'New Client',
          effectiveDate: '12/25/2025',
        },
        summaryLines: ['Client: New Client'],
      };

      const result = applyParsedToState(current, parsed);

      expect(result.clientName).toBe('New Client');
      expect(result.effectiveDate).toBe('12/25/2025');
      expect(result.siteAddress).toBe(''); // Unchanged
    });

    it('only updates fields present in parsed data', () => {
      const current = {
        ...initialContractData(),
        clientName: 'Original Client',
        siteAddress: 'Original Address',
      };

      const parsed = {
        data: {
          clientName: 'Updated Client',
        },
        summaryLines: [],
      };

      const result = applyParsedToState(current, parsed);

      expect(result.clientName).toBe('Updated Client');
      expect(result.siteAddress).toBe('Original Address'); // Preserved
    });

    it('combines summary lines with newlines', () => {
      const current = initialContractData();
      const parsed = {
        data: {},
        summaryLines: ['Line 1', 'Line 2', 'Line 3'],
      };

      const result = applyParsedToState(current, parsed);

      expect(result.summary).toBe('Line 1\nLine 2\nLine 3');
    });

    it('handles empty parsed data', () => {
      const current = initialContractData();
      const parsed = {
        data: {},
        summaryLines: [],
      };

      const result = applyParsedToState(current, parsed);

      expect(result).toEqual(current);
    });
  });
});
