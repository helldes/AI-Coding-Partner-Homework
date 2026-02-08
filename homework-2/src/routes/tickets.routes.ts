import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ticketService } from '../services/ticket.service';
import { importService } from '../services/import.service';
import { CreateTicketSchema, UpdateTicketSchema, TicketFilterSchema } from '../utils/validation';
import { z } from 'zod';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
    files: 1, // Only allow 1 file per request
  },
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = CreateTicketSchema.parse(req.body);
    const ticket = await ticketService.createTicket(validatedData as any);
    res.status(201).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/import', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    let validationResult;

    switch (fileExtension) {
      case 'csv':
        validationResult = await importService.parseCSV(req.file.buffer);
        break;
      case 'json':
        validationResult = await importService.parseJSON(req.file.buffer);
        break;
      case 'xml':
        validationResult = await importService.parseXML(req.file.buffer);
        break;
      default:
        res.status(400).json({ error: 'Unsupported file format. Use CSV, JSON, or XML' });
        return;
    }

    if (validationResult.successful > 0) {
      const tickets = await (fileExtension === 'csv'
        ? importService.extractValidTicketsFromCSV(req.file.buffer)
        : fileExtension === 'json'
        ? importService.extractValidTicketsFromJSON(req.file.buffer)
        : importService.extractValidTicketsFromXML(req.file.buffer));

      const result = await ticketService.bulkCreateTickets(tickets);

      if (result.length < validationResult.successful) {
        validationResult.failed += validationResult.successful - result.length;
        validationResult.successful = result.length;
        validationResult.errors.push({
          row: 0,
          error: `${validationResult.successful - result.length} tickets failed to save to database`
        });
      }
    }

    res.status(200).json(validationResult);
  } catch (error) {
    if (error instanceof Error && error.message.includes('File too large')) {
      res.status(413).json({ error: 'File too large. Maximum size is 10MB' });
      return;
    }
    res.status(500).json({ error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = TicketFilterSchema.parse(req.query);
    const tickets = await ticketService.getTickets(filters);
    res.status(200).json(tickets);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid filters', details: error.issues });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await ticketService.getTicketById(String(req.params.id));
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = UpdateTicketSchema.parse(req.body);
    const ticket = await ticketService.updateTicket(String(req.params.id), validatedData as any);
    res.status(200).json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await ticketService.deleteTicket(String(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/:id/auto-classify', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await ticketService.autoClassifyTicket(String(req.params.id));
    res.status(200).json({
      id: ticket.id,
      category: ticket.category,
      priority: ticket.priority,
      confidence: ticket.classificationConfidence,
      reasoning: ticket.classificationReasoning,
      keywords: ticket.classificationKeywords
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Ticket not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
