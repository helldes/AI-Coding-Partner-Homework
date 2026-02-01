import { importService } from '../../src/services/import.service';

describe('XML Import', () => {
  it('should parse valid XML file', async () => {
    const xmlData = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Test Issue</subject>
    <description>This is a test description</description>
    <metadata>
      <source>api</source>
    </metadata>
  </ticket>
</tickets>`;

    const result = await importService.parseXML(Buffer.from(xmlData));

    expect(result.total).toBe(1);
    expect(result.successful).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('should handle multiple tickets', async () => {
    const xmlData = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>user1@example.com</customer_email>
    <customer_name>User One</customer_name>
    <subject>Issue 1</subject>
    <description>Description for issue one</description>
    <metadata><source>email</source></metadata>
  </ticket>
  <ticket>
    <customer_id>CUST002</customer_id>
    <customer_email>user2@example.com</customer_email>
    <customer_name>User Two</customer_name>
    <subject>Issue 2</subject>
    <description>Description for issue two</description>
    <metadata><source>web_form</source></metadata>
  </ticket>
</tickets>`;

    const result = await importService.parseXML(Buffer.from(xmlData));

    expect(result.total).toBe(2);
    expect(result.successful).toBe(2);
  });

  it('should handle malformed XML', async () => {
    const malformedXml = '<tickets><ticket>Invalid</ticket>';

    const result = await importService.parseXML(Buffer.from(malformedXml));

    expect(result.failed).toBeGreaterThan(0);
  });

  it('should validate ticket data', async () => {
    const xmlData = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>invalid-email</customer_email>
    <customer_name>John Doe</customer_name>
    <subject>Test</subject>
    <description>Short</description>
    <metadata><source>api</source></metadata>
  </ticket>
</tickets>`;

    const result = await importService.parseXML(Buffer.from(xmlData));

    expect(result.failed).toBe(1);
  });

  it('should handle empty tickets node', async () => {
    const xmlData = '<?xml version="1.0"?><tickets></tickets>';

    const result = await importService.parseXML(Buffer.from(xmlData));

    expect(result.total).toBe(0);
  });

  it('should extract valid tickets from XML', async () => {
    const xmlData = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>valid@example.com</customer_email>
    <customer_name>Valid User</customer_name>
    <subject>Valid Issue</subject>
    <description>This is a valid description</description>
    <metadata><source>api</source></metadata>
  </ticket>
  <ticket>
    <customer_id>CUST002</customer_id>
    <customer_email>invalid-email</customer_email>
    <customer_name>Invalid User</customer_name>
    <subject>Test</subject>
    <description>Short</description>
    <metadata><source>web_form</source></metadata>
  </ticket>
</tickets>`;

    const result = await importService.parseXML(Buffer.from(xmlData));

    expect(result.validTickets.length).toBe(1);
    expect(result.validTickets[0].customer_id).toBe('CUST001');
  });

  it('should handle malformed XML in extract method', async () => {
    const result = await importService.parseXML(Buffer.from('<invalid>'));

    expect(result.validTickets.length).toBe(0);
  });

  it('should handle XML with tags', async () => {
    const xmlData = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>CUST001</customer_id>
    <customer_email>test@example.com</customer_email>
    <customer_name>Test User</customer_name>
    <subject>Issue with tags</subject>
    <description>Description with tags</description>
    <tags>urgent,payment</tags>
    <metadata><source>email</source></metadata>
  </ticket>
</tickets>`;

    const result = await importService.parseXML(Buffer.from(xmlData));

    expect(result.validTickets.length).toBe(1);
    expect(result.validTickets[0].tags).toEqual(['urgent', 'payment']);
  });
});
