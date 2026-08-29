// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth'); // Import auth middleware

// Mock data for help desk functionality
const helpTickets = [];
const faqs = [
  {
    id: 1,
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'You can reset your password by clicking on the "Forgot Password" link on the login page. Enter your email address and follow the instructions sent to your inbox.',
  },
  {
    id: 2,
    category: 'billing',
    question: 'How do I update my payment method?',
    answer: 'Go to your Account Settings, click on Billing Information, and select "Update Payment Method". You can add or remove payment methods from this section.',
  },
  {
    id: 3,
    category: 'technical',
    question: 'Why am I unable to connect to the service?',
    answer: 'First, check your internet connection. If that\'s working, try clearing your browser cache and cookies. If the issue persists, contact our technical support team.',
  },
  {
    id: 4,
    category: 'orders',
    question: 'How do I track my order?',
    answer: 'You can track your order by logging into your account and navigating to "My Orders". Alternatively, use the tracking number sent to your email.',
  },
  {
    id: 5,
    category: 'returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return period for most items. Items must be in original condition with tags attached. Visit our Returns page for more details.',
  },
];

const troubleshootingGuides = [
  {
    id: 1,
    title: 'Connection Issues',
    steps: [
      'Check your internet connection',
      'Restart your router/modem',
      'Clear browser cache and cookies',
      'Try a different browser',
      'Contact support if issue persists',
    ],
  },
  {
    id: 2,
    title: 'Login Problems',
    steps: [
      'Verify your username and password',
      'Try resetting your password',
      'Clear browser cache',
      'Disable browser extensions temporarily',
      'Contact support if issue persists',
    ],
  },
  {
    id: 3,
    title: 'Payment Issues',
    steps: [
      'Verify payment information is correct',
      'Check if card has sufficient funds',
      'Try a different payment method',
      'Contact your bank if declined',
      'Reach out to our billing team',
    ],
  },
];

const knowledgeBase = [
  {
    id: 1,
    title: 'Getting Started with Our Service',
    category: 'beginner',
    content: 'Learn how to set up your account and get started with our service. This guide covers the basics of navigation and core features.',
    tags: ['setup', 'beginner', 'overview'],
  },
  {
    id: 2,
    title: 'Advanced Features Guide',
    category: 'advanced',
    content: 'Explore advanced features and customization options. Learn how to maximize the potential of our service.',
    tags: ['advanced', 'features', 'customization'],
  },
  {
    id: 3,
    title: 'Security Best Practices',
    category: 'security',
    content: 'Understand our security measures and learn how to keep your account secure. Includes tips for password management and account protection.',
    tags: ['security', 'best-practices', 'protection'],
  },
];

// Helper function for error handling
const handleError = (res, error, message = 'An error occurred') => {
  console.error(message, error);
  res.status(500).json({
    success: false,
    message,
  });
};

// Helper function for finding items in an array
const findItemById = (array, id) => array.find((item) => item.id === parseInt(id, 10));

// FAQ Routes
router.get('/faq', (req, res) => {
  try {
    res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching FAQs');
  }
});

router.get('/faq/:id', (req, res) => {
  try {
    const faq = findItemById(faqs, req.params.id);
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    res.json({
      success: true,
      data: faq,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching FAQ');
  }
});

router.get('/faq/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({
        success: true,
        data: faqs,
      });
    }

    const searchTerm = q.toLowerCase();
    const filteredFaqs = faqs.filter((faq) => faq.question.toLowerCase().includes(searchTerm)
      || faq.answer.toLowerCase().includes(searchTerm));

    res.json({
      success: true,
      data: filteredFaqs,
    });
  } catch (error) {
    handleError(res, error, 'Error searching FAQs');
  }
});

// Troubleshooting Guide Routes
router.get('/troubleshooting', (req, res) => {
  try {
    res.json({
      success: true,
      data: troubleshootingGuides,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching troubleshooting guides');
  }
});

router.get('/troubleshooting/:id', (req, res) => {
  try {
    const guide = findItemById(troubleshootingGuides, req.params.id);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Troubleshooting guide not found',
      });
    }

    res.json({
      success: true,
      data: guide,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching troubleshooting guide');
  }
});

// Knowledge Base Routes
router.get('/knowledge-base', (req, res) => {
  try {
    res.json({
      success: true,
      data: knowledgeBase,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching knowledge base');
  }
});

router.get('/knowledge-base/:id', (req, res) => {
  try {
    const article = findItemById(knowledgeBase, req.params.id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge base article not found',
      });
    }

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching knowledge base article');
  }
});

// Ticket Routes
router.post('/tickets', protect, async (req, res) => { // Changed from authenticateToken to protect
  try {
    const {
      subject, category, priority, description,
    } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    // Create new ticket
    const newTicket = {
      id: helpTickets.length + 1,
      userId: req.user.id,
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      description,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    helpTickets.push(newTicket);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: newTicket,
    });
  } catch (error) {
    handleError(res, error, 'Error creating ticket');
  }
});

router.get('/tickets', protect, async (req, res) => { // Changed from authenticateToken to protect
  try {
    const userTickets = helpTickets.filter((ticket) => ticket.userId === req.user.id);

    res.json({
      success: true,
      data: userTickets,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching tickets');
  }
});

router.get('/tickets/all', protect, async (req, res) => { // Changed from authenticateToken to protect
  try {
    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: helpTickets,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching all tickets');
  }
});

router.get('/tickets/:id', protect, async (req, res) => { // Changed from authenticateToken to protect
  try {
    const ticketId = parseInt(req.params.id, 10);
    const ticket = helpTickets.find((t) => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check if user owns the ticket or is admin
    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    handleError(res, error, 'Error fetching ticket');
  }
});

router.patch('/tickets/:id', protect, async (req, res) => { // Changed from authenticateToken to protect
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const ticketIndex = helpTickets.findIndex((ticket) => ticket.id === parseInt(id, 10));
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    helpTickets[ticketIndex].status = status;
    if (resolution) {
      helpTickets[ticketIndex].resolution = resolution;
    }
    helpTickets[ticketIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: helpTickets[ticketIndex],
    });
  } catch (error) {
    handleError(res, error, 'Error updating ticket');
  }
});

module.exports = router;
